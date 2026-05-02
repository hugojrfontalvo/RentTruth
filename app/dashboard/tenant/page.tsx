import { redirect } from "next/navigation";
import { getSession, logoutAction } from "@/app/actions/auth";
import {
  requestTenantPropertyJoinAction,
  tenantLeavePropertyAction,
} from "@/app/actions/membership";
import {
  submitTenantRepairRequest,
  tenantConfirmRepairFixedAction,
  tenantReportRepairStillBrokenAction,
  tenantSendTicketMessageAction,
} from "@/app/actions/tenant";
import { SupportEntryButtons } from "@/components/support-entry-buttons";
import { TenantJoinForm } from "@/components/tenant-join-form";
import { TenantRepairUploadFields } from "@/components/tenant-repair-upload-fields";
import { TicketMessageThread } from "@/components/ticket-message-thread";
import { roleLabels } from "@/lib/auth";
import {
  type RepairTicket,
  findPropertyById,
  findPropertyByJoinCode,
  findPropertyBySavedAddress,
  formatTenantAddress,
  getSavedTenantAddress,
  getPropertyDisplayName,
  getPropertyServiceAddress,
  getTicketsForTenant,
  isClosePropertyAddressMatch,
  propertyTypeRequiresUnit,
} from "@/lib/demo-data";
import { getMembershipActionMessage } from "@/lib/membership";

type TenantDashboardPageProps = {
  searchParams?: Promise<{
    submitted?: string;
    error?: string;
    membership?: string;
    joinError?: string;
    joinCode?: string;
    repair?: string;
  }>;
};

function getJoinErrorMessage(joinError?: string) {
  if (joinError === "address-required") {
    return "Save your rental address first so RentTruth can keep it on your tenant profile before code verification starts.";
  }

  if (joinError === "property-not-found") {
    return "Your address is saved, but RentTruth still can’t find a matching landlord-created property for it. You can keep the address on file and try the join code again after the landlord sets up the property.";
  }

  if (joinError === "join-code-address-mismatch") {
    return "That join code belongs to a different property than the address you selected. Double-check both the address and the landlord-provided code before trying again.";
  }

  if (joinError === "close-address-mismatch") {
    return "Your address is close, but does not exactly match the landlord’s property. You can use the landlord’s saved address if this is your home.";
  }

  if (joinError === "invalid-join-code") {
    return "That join code doesn’t appear to be active yet. Re-enter the code exactly as your landlord shared it.";
  }

  if (joinError === "unit-required") {
    return "This property needs a unit or apartment number before the landlord can review your request.";
  }

  if (joinError === "zip-invalid") {
    return "Enter a valid 5-digit ZIP code. ZIP+4 is okay; RentTruth will save only the first 5 digits.";
  }

  return null;
}

function getStatusTone(status?: string | null) {
  if (status === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "Pending") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function formatStatusTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isActiveTicket(ticket: RepairTicket) {
  return (
    ticket.status !== "Resolved" &&
    ticket.status !== "Closed" &&
    ticket.status !== "Ready for landlord payment approval" &&
    ticket.status !== "Tenant confirmed fixed"
  );
}

function getTicketNextStep(ticket: RepairTicket) {
  if (ticket.status === "Open" || ticket.status === "Open to vendors") {
    return "Waiting for landlord review or vendor interest.";
  }

  if (ticket.status === "Vendor interested") {
    return "Your landlord is comparing interested vendors.";
  }

  if (ticket.status === "Vendor selected" || ticket.status === "Assigned") {
    return "A vendor has been selected. Arrival status will appear here.";
  }

  if (ticket.status === "Landlord vendor assigned") {
    return "Your landlord assigned their own vendor. Scheduling details will appear on this ticket.";
  }

  if (ticket.status === "Vendor arrived") {
    return ticket.landlordVendorName && !ticket.vendorBusinessName
      ? "Your landlord’s vendor has arrived for this repair."
      : "The vendor is on site or has checked in for this repair.";
  }

  if (ticket.status === "Waiting for tenant confirmation") {
    return "Confirm whether the repair fixed the problem.";
  }

  if (ticket.status === "Follow-up needed") {
    return "The ticket remains open while follow-up work is reviewed.";
  }

  return "Repair activity is still in progress.";
}

function ActiveTicketSummary({ ticket }: { ticket: RepairTicket }) {
  const property = findPropertyById(ticket.propertyId);

  return (
    <article className="rounded-[24px] border border-sky-200 bg-white p-4 shadow-lg shadow-slate-200/70 sm:rounded-[28px] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Active repair
          </p>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {ticket.issueTitle}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              {ticket.category}
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              {ticket.status}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                ticket.urgent
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {ticket.urgent ? "Urgent" : "Standard"}
            </span>
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:min-w-[180px]">
          <p className="font-semibold text-slate-900">Submitted</p>
          <p className="mt-1">{ticket.submittedAt}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">Next:</span> {getTicketNextStep(ticket)}
      </div>
      {property ? (
        <div className="mt-3 rounded-[22px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
          <span className="font-semibold">Service location:</span>{" "}
          {getPropertyServiceAddress(property, ticket.unitNumber)}
        </div>
      ) : null}
      {ticket.landlordVendorName ? (
        <div className="mt-3 rounded-[22px] border border-sky-200 bg-white px-4 py-3 text-sm leading-6 text-sky-800">
          <span className="font-semibold">Vendor assigned:</span>{" "}
          {ticket.landlordVendorName} (Landlord’s vendor)
          {ticket.landlordVendorScheduledFor ? ` · ${ticket.landlordVendorScheduledFor}` : ""}
        </div>
      ) : null}
    </article>
  );
}

function TenantConfirmationCard({ ticket }: { ticket: RepairTicket }) {
  return (
    <article className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-lg shadow-amber-100/60 sm:rounded-[28px] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Confirmation needed
          </p>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Did this repair actually fix the problem?
          </h3>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            {ticket.issueTitle}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
          Waiting on you
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-amber-800">
        Your answer keeps the workflow honest. A “yes” {ticket.landlordVendorName && !ticket.vendorBusinessName ? "closes this outside-vendor ticket" : "sends the job to landlord final review"}. A “no” keeps the ticket open for follow-up.
      </p>
      {ticket.vendorCompletionNotes ? (
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Vendor note: {ticket.vendorCompletionNotes}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <form action={tenantConfirmRepairFixedAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="feedback"
            rows={3}
            placeholder="Optional feedback for the landlord and vendor"
            className="w-full rounded-3xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
          />
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300"
          >
            Yes, fixed
          </button>
        </form>
        <form action={tenantReportRepairStillBrokenAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="feedback"
            rows={3}
            placeholder="Tell the landlord what still is not working"
            className="w-full rounded-3xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
          />
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300"
          >
            No, still not fixed
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function TenantDashboardPage({
  searchParams,
}: TenantDashboardPageProps) {
  const session = await getSession();
  console.log("tenant session loaded", {
    hasSession: Boolean(session),
    role: session?.role,
  });

  if (!session) {
    redirect("/login?role=tenant");
  }

  if (session.role !== "tenant") {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const tenantId = session.id;
  const tenantName = session.name?.trim() || session.email || "Tenant";
  const property = session.propertyId ? findPropertyById(session.propertyId) : null;
  const savedAddressRecord = getSavedTenantAddress({
    savedStreetAddress: session.savedStreetAddress,
    savedCity: session.savedCity,
    savedState: session.savedState,
    savedZip: session.savedZip,
    savedPropertyType: session.savedPropertyType,
    unitNumber: session.unitNumber,
    buildingNumber: session.buildingNumber,
  });
  const savedAddress = savedAddressRecord ? formatTenantAddress(savedAddressRecord) : "";
  const savedAddressMatch =
    !property && savedAddressRecord ? findPropertyBySavedAddress(savedAddressRecord) : null;
  const joinCodeProperty = params.joinCode ? findPropertyByJoinCode(params.joinCode) : null;
  const closeJoinCodeMatch =
    params.joinError === "close-address-mismatch" &&
    savedAddressRecord &&
    joinCodeProperty &&
    isClosePropertyAddressMatch(joinCodeProperty, savedAddressRecord)
      ? joinCodeProperty
      : null;
  const membershipStatus = session.membershipStatus ?? (property ? "Pending" : null);
  const isApproved = membershipStatus === "Approved";
  const isPending = membershipStatus === "Pending";
  const canJoinProperty = !property;
  const ticketsData = tenantId ? getTicketsForTenant(tenantId) : [];
  const tickets = Array.isArray(ticketsData) ? ticketsData : [];
  console.log("tenant tickets loaded", { count: tickets.length });
  const activeTickets = tickets.filter(isActiveTicket);
  const tenantConfirmationTickets = tickets.filter(
    (ticket) => ticket.status === "Waiting for tenant confirmation",
  );
  const openTickets = activeTickets.length;
  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "Closed" ||
      ticket.status === "Ready for landlord payment approval" ||
      ticket.status === "Tenant confirmed fixed",
  ).length;
  const membershipMessage =
    getMembershipActionMessage(params.membership) ??
    (canJoinProperty
      ? savedAddress
        ? savedAddressMatch
          ? "Your address is saved and we found a matching property. The landlord join code is the last step before approval review."
          : "Your address is saved. You can keep your profile moving now and return for join-code verification when the landlord creates the property."
        : null
      : isPending
      ? "Your property access request is pending landlord approval. You can review the property details below while you wait."
      : membershipStatus === "Denied"
        ? "This property request was denied. If you were given updated access details, you can try again with the correct property."
        : membershipStatus === "Removed"
          ? "This property access was removed by the landlord. Join a different property to restore private tenant tools."
          : membershipStatus === "Left Property"
            ? "You’re no longer attached to a property. Join another property whenever you’re ready."
            : null);
  const joinErrorMessage = getJoinErrorMessage(params.joinError);
  const residenceLabel =
    property && propertyTypeRequiresUnit(property.propertyType)
      ? session.unitNumber
        ? `Unit ${session.unitNumber}`
        : "Unit not set"
      : "Single residence";

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            console.log("tenant dashboard mounted");
            console.log("tenant session found on dashboard", { sessionFound: true });
          `,
        }}
      />
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.30),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(255,138,101,0.18),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Tenant maintenance workspace</p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/60 backdrop-blur md:block">
              Signed in as {roleLabels[session.role]}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              >
                Log Out
              </button>
            </form>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-2 sm:px-6 sm:pb-16 lg:px-8">
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-7 lg:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
                  Tenant dashboard
                </p>
                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  Welcome, {tenantName}
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                  Keep your repair history in one clean place, join the right property without extra friction, and see exactly when private tenant actions unlock.
                </p>
                <SupportEntryButtons className="mt-6" />
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-white/10 px-4 py-2 text-white/80">
                    {property ? getPropertyDisplayName(property) : "No property linked yet"}
                  </span>
                  {membershipStatus ? (
                    <span className={`rounded-full border px-4 py-2 ${getStatusTone(membershipStatus)}`}>
                      {membershipStatus}
                    </span>
                  ) : savedAddress ? (
                    <span className="rounded-full bg-white/10 px-4 py-2 text-white/80">
                      Address saved
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-4 py-2 text-white/80">
                      Ready to join
                    </span>
                  )}
                  {savedAddress && !property ? (
                    <span className="rounded-full bg-white/10 px-4 py-2 text-white/80">
                      {savedAddressMatch
                        ? "Waiting for join code verification"
                        : "Waiting for landlord property match"}
                    </span>
                  ) : null}
                  {property ? (
                    <span className="rounded-full bg-white/10 px-4 py-2 text-white/80">
                      {residenceLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <a href="#active-tickets" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Open tickets</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{openTickets}</p>
                </a>
                <a href="#tenant-confirmation" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Confirm</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                    {tenantConfirmationTickets.length}
                  </p>
                </a>
                <a href="#ticket-history" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Resolved</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{resolvedTickets}</p>
                </a>
              </div>
            </div>
          </div>

          {params.submitted === "1" ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              Repair request submitted successfully.
            </div>
          ) : null}

          {params.repair === "confirmed" ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              Thanks for confirming the repair worked. The landlord can now review the completed job before payment approval is added later.
            </div>
          ) : null}

          {params.repair === "follow-up" ? (
            <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 shadow-sm">
              Follow-up requested. The ticket stays open so the landlord and vendor can review what still needs attention.
            </div>
          ) : null}

          {membershipMessage ? (
            <div className={`mt-6 rounded-[28px] border px-5 py-4 text-sm font-medium shadow-sm ${getStatusTone(membershipStatus)}`}>
              {membershipMessage}
            </div>
          ) : null}

          {joinErrorMessage ? (
            <div className="mt-6 rounded-[28px] border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
              {joinErrorMessage}
            </div>
          ) : null}

          {params.error === "missing-ticket-fields" ? (
            <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
              Add a category, short title, and detailed description before submitting your repair request.
            </div>
          ) : null}

          {params.error === "attachment-too-large" ? (
            <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
              Photo is too large. Please choose a smaller image or retake the photo.
            </div>
          ) : null}

          {params.error === "unsupported-attachment" ? (
            <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
              Upload a JPG, PNG, HEIC, HEIF, or PDF file for this repair ticket.
            </div>
          ) : null}

          {tenantConfirmationTickets.length > 0 ? (
            <section id="tenant-confirmation" className="mt-6 scroll-mt-4 target:ring-4 target:ring-amber-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Repair confirmation
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                    Confirm completed work
                  </h2>
                </div>
                <span className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-800">
                  {tenantConfirmationTickets.length} waiting
                </span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {tenantConfirmationTickets.slice(0, 2).map((ticket) => (
                  <TenantConfirmationCard key={`confirm-${ticket.id}`} ticket={ticket} />
                ))}
              </div>
            </section>
          ) : null}

          {activeTickets.length > 0 ? (
            <section id="active-tickets" className="mt-6 scroll-mt-4 target:ring-4 target:ring-sky-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Active tickets
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                    Repairs in motion
                  </h2>
                </div>
                <a
                  href="#maintenance-request"
                  className="min-h-[48px] rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  New request
                </a>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {activeTickets.slice(0, 2).map((ticket) => (
                  <ActiveTicketSummary key={`priority-${ticket.id}`} ticket={ticket} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section
              id="maintenance-request"
              className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 backdrop-blur sm:rounded-[32px] sm:p-7"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {canJoinProperty ? "Join a property" : "Private tenant tools"}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {canJoinProperty
                      ? "Connect your account to the right address"
                      : isApproved
                        ? "Report an issue with confidence"
                        : "Waiting for landlord approval"}
                  </h2>
                </div>
                <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                  {canJoinProperty
                    ? savedAddress
                      ? "Address saved plus join code"
                      : "Save address, then verify"
                    : isApproved
                      ? "Private actions unlocked"
                      : "Approval required"}
                </div>
              </div>

              {canJoinProperty ? (
                <>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    Save your rental address to your tenant profile first, even if the landlord has
                    not created the property yet. Then use the landlord join code as the second
                    verification step when you have it.
                  </p>
                  {closeJoinCodeMatch && savedAddressRecord ? (
                    <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                      <p className="font-semibold">
                        Your address is close, but does not exactly match the landlord’s property.
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[20px] border border-amber-200 bg-white/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                            Landlord property
                          </p>
                          <p className="mt-2 text-slate-800">
                            {getPropertyServiceAddress(closeJoinCodeMatch)}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-amber-200 bg-white/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                            Your saved address
                          </p>
                          <p className="mt-2 text-slate-800">{formatTenantAddress(savedAddressRecord)}</p>
                        </div>
                      </div>
                      <p className="mt-3">
                        You can use the landlord’s saved address if this is your home.
                      </p>
                      <form action={requestTenantPropertyJoinAction} className="mt-4">
                        <input type="hidden" name="intent" value="use-landlord-address" />
                        <input type="hidden" name="joinCode" value={params.joinCode ?? ""} />
                        <button
                          type="submit"
                          className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
                        >
                          Use landlord’s address
                        </button>
                      </form>
                    </div>
                  ) : null}
                  <TenantJoinForm
                    initialSavedAddress={savedAddressRecord}
                    initialJoinCode={params.joinCode}
                    requestTenantPropertyJoinAction={requestTenantPropertyJoinAction}
                  />
                </>
              ) : isApproved ? (
                <form action={submitTenantRepairRequest} className="mt-8 space-y-5">
                  <div className="grid gap-5 md:grid-cols-[0.42fr_0.58fr]">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Category</span>
                      <select
                        name="category"
                        defaultValue="AC"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      >
                        <option>AC</option>
                        <option>Plumbing</option>
                        <option>Pest</option>
                        <option>Electrical</option>
                        <option>Appliance</option>
                        <option>Other</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Short title</span>
                      <input
                        type="text"
                        name="title"
                        placeholder="Bedroom AC not cooling"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Detailed description</span>
                    <textarea
                      name="description"
                      rows={6}
                      placeholder="Describe what’s happening, when it started, and anything the landlord or vendor should know before arriving."
                      required
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>

                  <div className="grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
                    <label className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <span className="block text-sm font-semibold text-slate-700">Urgent</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">
                          Mark issues affecting safety or essential living conditions.
                        </span>
                      </div>
                      <span className="relative inline-flex items-center">
                        <input type="checkbox" name="urgent" className="peer sr-only" />
                        <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-ink" />
                        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                      </span>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Photo or file upload</span>
                      <TenantRepairUploadFields />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="min-h-[50px] w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
                  >
                    Submit Request
                  </button>
                </form>
              ) : (
                <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-500">
                  {property
                    ? "Your landlord still needs to approve this property membership before ticket submission and landlord messaging unlock."
                    : "Join a property first to start the approval process."}
                </div>
              )}
            </section>

            <section id="ticket-history" className="scroll-mt-4 rounded-[26px] border border-slate-200 bg-gradient-to-b from-sky-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-sky-200 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Activity and property
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                Stay clear on access, tickets, and history
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Your dashboard keeps property access and maintenance requests in one calm, easy-to-read view.
              </p>

              <div className="mt-8 space-y-4">
                {property ? (
                  <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Linked property
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                      {getPropertyDisplayName(property)}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {getPropertyServiceAddress(property, session.unitNumber)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {property.propertyType}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {residenceLabel}
                      </span>
                    </div>
                  </article>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-500">
                    No property is linked to this account yet. Once you submit a join request, the landlord approval status will appear here.
                  </div>
                )}

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Message landlord
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Use this placeholder for future direct messaging around scheduling, access, or follow-up questions.
                  </p>
                  <button
                    type="button"
                    disabled={!isApproved}
                    className="mt-5 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApproved ? "Message Landlord" : "Await Approval"}
                  </button>
                </div>

                {tickets.map((ticket) => (
                  <article
                    key={`${ticket.id}-${ticket.submittedAt}`}
                    className="rounded-[28px] border border-white/80 bg-white p-5 shadow-md shadow-slate-200/60"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                          {ticket.issueTitle}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {ticket.category}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {ticket.status}
                          </span>
                          {ticket.unitNumber ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                              Unit {ticket.unitNumber}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                        ticket.urgent
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : ticket.status === "Resolved" ||
                              ticket.status === "Closed" ||
                              ticket.status === "Ready for landlord payment approval" ||
                              ticket.status === "Tenant confirmed fixed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-sky-200 bg-sky-50 text-sky-700"
                      }`}>
                        {ticket.urgent ? "Urgent" : "Standard"}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>Submitted</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {ticket.submittedAt}
                      </span>
                      {property ? (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{getPropertyServiceAddress(property, ticket.unitNumber)}</span>
                        </>
                      ) : null}
                        {ticket.vendorBusinessName ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Vendor assigned: {ticket.vendorBusinessName}</span>
                          </>
                        ) : null}
                        {ticket.landlordVendorName ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Vendor assigned: {ticket.landlordVendorName} (Landlord’s vendor)</span>
                          </>
                        ) : null}
                    </div>

                    {ticket.landlordVendorName ? (
                      <div className="mt-5 rounded-[24px] border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                        <span className="font-semibold">
                          Vendor assigned: {ticket.landlordVendorName} (Landlord’s vendor).
                        </span>
                        {ticket.landlordVendorScheduledFor
                          ? ` Scheduled for ${ticket.landlordVendorScheduledFor}.`
                          : ""}
                        {ticket.landlordVendorTenantNote
                          ? ` Note from landlord: ${ticket.landlordVendorTenantNote}`
                          : ""}
                      </div>
                    ) : null}

                    {ticket.status === "Waiting for tenant confirmation" ? (
                      <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                        This repair is waiting for your confirmation near the top of the dashboard.
                        <a href="#tenant-confirmation" className="ml-1 font-semibold text-amber-950 underline decoration-amber-300 underline-offset-4">
                          Jump to confirmation.
                        </a>
                      </div>
                    ) : null}

                    {ticket.status === "Vendor arrived" || ticket.arrivedAt ? (
                      <div className="mt-5 rounded-[24px] border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                        {ticket.vendorBusinessName
                          ? `${ticket.vendorBusinessName} has arrived`
                          : ticket.landlordVendorName
                            ? `Landlord’s vendor ${ticket.landlordVendorName} has arrived`
                            : "Your vendor has arrived"}
                        {ticket.arrivedAt
                          ? ` at ${formatStatusTimestamp(ticket.arrivedAt)}.`
                          : "."}{" "}
                        You can now use the landlord contact flow if building access or follow-up communication is needed while the visit is happening.
                      </div>
                    ) : null}

                    {ticket.status === "Ready for landlord payment approval" ? (
                      <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                        You confirmed this repair was fixed. The landlord has been notified that the job is ready for final review.
                        {ticket.tenantFeedback ? ` Your note: ${ticket.tenantFeedback}` : ""}
                      </div>
                    ) : null}

                    {ticket.status === "Follow-up needed" ? (
                      <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                        Follow-up is needed on this repair. The landlord and vendor can review what still needs to be addressed.
                        {ticket.tenantFeedback ? ` Your latest note: ${ticket.tenantFeedback}` : ""}
                      </div>
                    ) : null}

                    <TicketMessageThread
                      ticketId={ticket.id}
                      currentRole="tenant"
                      sendMessageAction={tenantSendTicketMessageAction}
                    />
                  </article>
                ))}

                {tickets.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-500">
                    No repair tickets yet. Once you’re approved and submit a request, it will appear here.
                  </div>
                ) : null}

                {property ? (
                  <form action={tenantLeavePropertyAction}>
                    <button
                      type="submit"
                      className="w-full rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300"
                    >
                      Leave Property
                    </button>
                  </form>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
