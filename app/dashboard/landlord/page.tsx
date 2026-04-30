import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, logoutAction } from "@/app/actions/auth";
import {
  createPropertyAction,
  landlordCloseTicketAction,
  updatePropertyAction,
} from "@/app/actions/landlord";
import {
  assignLandlordVendorAction,
  assignVendorAction,
  declineVendorRequestAction,
  landlordMarkOwnVendorArrivedAction,
  landlordMarkOwnVendorCompletedAction,
  landlordApproveRepairRequestAction,
  landlordDeclineRepairRequestAction,
  landlordRequestRepairFollowUpAction,
} from "@/app/actions/vendor";
import {
  approveTenantAction,
  denyTenantAction,
  markTenantMovedOutAction,
  removeTenantAction,
  resetJoinCodeAction,
} from "@/app/actions/membership";
import { LandlordPropertyForm } from "@/components/landlord-property-form";
import { PropertyShareTools } from "@/components/property-share-tools";
import { ClipboardButton } from "@/components/clipboard-button";
import { ShareButton } from "@/components/share-button";
import { SupportEntryButtons } from "@/components/support-entry-buttons";
import { getAbsoluteAppUrl } from "@/lib/app-url";
import { roleLabels } from "@/lib/auth";
import {
  getAddressSuggestions,
  getApprovedTenantsForProperty,
  getPendingTenantsForProperty,
  getPropertiesForLandlord,
  findPropertyById,
  getVendorPerformanceMetrics,
  getVendorProfilesForAssignment,
  getPropertyAccessInstructions,
  getPropertyDisplayName,
  getPropertyFullAddress,
  getPropertyServiceAddress,
  getPropertyTrustSignal,
  getPropertyTypes,
  getTicketsForProperty,
  propertyTypeRequiresUnit,
} from "@/lib/demo-data";
import { getVendorStatusSummary } from "@/lib/vendor";
import { VendorSelectionPanel } from "@/components/vendor-selection-panel";
import { getMembershipActionMessage } from "@/lib/membership";

type LandlordDashboardPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    membership?: string;
    property?: string;
    vendor?: string;
    ticket?: string;
    assignedVendor?: string;
    updated?: string;
    code?: string;
    edit?: string;
    repair?: string;
    review?: string;
  }>;
};

function getResidenceLabel(propertyType: string, unitNumber?: string) {
  if (propertyType === "House") {
    return "Single residence";
  }

  return unitNumber ? `Unit ${unitNumber}` : "Unit pending";
}

function getTicketVendorLabel(ticket: { vendorBusinessName?: string; landlordVendorName?: string }) {
  if (ticket.vendorBusinessName) {
    return `Assigned vendor: ${ticket.vendorBusinessName}`;
  }

  if (ticket.landlordVendorName) {
    return `Landlord vendor: ${ticket.landlordVendorName}`;
  }

  return "Vendor selection needed";
}

function getCreatePropertyErrorMessage(error?: string) {
  if (error === "property-not-found") {
    return "We couldn’t find that property to update. Refresh the dashboard and try again.";
  }

  if (error === "property-type-required") {
    return "Choose a property type before creating the property.";
  }

  if (error === "street-required") {
    return "Enter the full street address to create the property.";
  }

  if (error === "city-required") {
    return "Enter the city for this property.";
  }

  if (error === "state-required") {
    return "Enter the state for this property.";
  }

  if (error === "zip-required") {
    return "Enter the ZIP code for this property.";
  }

  if (error === "zip-invalid") {
    return "Enter a valid 5-digit ZIP code. ZIP+4 is okay; RentTruth will save only the first 5 digits.";
  }

  return null;
}

function getVendorActionMessage(vendor?: string) {
  if (vendor === "assigned") {
    return "Vendor selected successfully. The tenant can now see that a vendor has been assigned, and dispatch milestones will track from this point forward.";
  }

  if (vendor === "declined") {
    return "Vendor request declined. The comparison panel still keeps the rest of the interested vendors available for review.";
  }

  if (vendor === "assign-failed") {
    return "We couldn’t assign that vendor to the selected ticket.";
  }

  if (vendor === "own-vendor-assigned") {
    return "Your outside vendor was assigned to the ticket. The tenant can now see the landlord vendor details and scheduling note.";
  }

  if (vendor === "own-vendor-arrived") {
    return "Your outside vendor was marked arrived. The tenant can now see the arrival status and timestamp.";
  }

  if (vendor === "own-vendor-completed") {
    return "Your outside vendor was marked completed. The tenant will now see the repair confirmation card near the top of their dashboard.";
  }

  if (vendor === "own-vendor-status-failed") {
    return "We couldn’t update that outside-vendor status. Confirm this ticket still has your own vendor assigned and try again.";
  }

  if (vendor === "own-vendor-missing") {
    return "Add a vendor name before saving your own vendor assignment.";
  }

  return null;
}

function getRepairActionMessage(repair?: string, review?: string) {
  if (repair === "approved") {
    return "Repair approval granted. The vendor can move forward on the approved scope.";
  }

  if (repair === "declined") {
    return "Repair request declined. The ticket stays open so the vendor can revise scope or propose another option.";
  }

  if (repair === "follow-up") {
    return "Follow-up requested. The vendor can review your notes and return with another option.";
  }

  if (review === "closed") {
    return "Payment method captured and the job was marked ready/sent for this MVP workflow. No real payment was processed.";
  }

  if (review === "payment-method-required") {
    return "Choose a payment method before marking this job ready or sent for payment.";
  }

  return null;
}

function getPropertyUpdateMessage(updated?: string, code?: string) {
  if (updated === "1") {
    return code === "preserved"
      ? "Property updated successfully. The active join code stayed the same."
      : "Property updated successfully.";
  }

  return null;
}

function formatStatusTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getVendorCardsForTicket(ticket: {
  category: string;
  vendorRequests?: Array<{
    vendorUserId: string;
    status: "Vendor interested" | "Vendor selected" | "Vendor declined";
    requestedAt: string;
  }>;
  vendorUserId?: string;
  vendorBusinessName?: string;
}, property: {
  city: string;
  state: string;
}) {
  const vendorProfiles = getVendorProfilesForAssignment({
    category: ticket?.category ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
  });

  return (Array.isArray(vendorProfiles) ? vendorProfiles : []).map((vendorProfile) => {
    const metrics = getVendorPerformanceMetrics(vendorProfile.userId);
    const summary = getVendorStatusSummary(vendorProfile, ticket?.category ?? "");
    const matchingRequest = (ticket.vendorRequests ?? []).find(
      (request) => request.vendorUserId === vendorProfile.userId,
    );

    return {
      userId: vendorProfile.userId,
      businessName: vendorProfile.businessName,
      serviceCategories: vendorProfile.serviceCategories ?? [],
      hourlyRate: vendorProfile.hourlyRate ?? 0,
      emergencyRate: vendorProfile.emergencyRate ?? 0,
      tripFee: vendorProfile.tripFee ?? 0,
      pricingNotes: vendorProfile.pricingNotes ?? "",
      commonRepairCosts: vendorProfile.commonRepairCosts ?? "",
      baselineRepairPricing: vendorProfile.baselineRepairPricing ?? [],
      jobsAssigned: metrics?.jobsAssigned ?? 0,
      jobsAccepted: metrics?.jobsAccepted ?? 0,
      jobsCompleted: metrics?.jobsCompleted ?? 0,
      jobsDropped: metrics?.jobsDropped ?? 0,
      completionRate: metrics?.completionRate ?? "0%",
      dropRate: metrics?.dropRate ?? "0%",
      averageAcceptanceTime: metrics?.averageAcceptanceTime ?? "Not enough data",
      averageArrivalTime: metrics?.averageArrivalTime ?? "Not enough data",
      averageCompletionTime: metrics?.averageCompletionTime ?? "Not enough data",
      completionHistoryCount: vendorProfile.completionHistoryCount ?? 0,
      ratingPlaceholder: vendorProfile.ratingPlaceholder ?? "No rating yet",
      complianceBadge: summary?.complianceBadge ?? "Not verified",
      verificationBadges: summary?.verificationBadges ?? [],
      occupiedHomeEligibilityStatus: vendorProfile.occupiedHomeEligibilityStatus ?? "Verification Pending",
      licenseStatus: vendorProfile.licenseStatus ?? "Verification Pending",
      insuranceStatus: vendorProfile.insuranceStatus ?? "Verification Pending",
      requestStatus: matchingRequest?.status ?? null,
      requestedAt: matchingRequest?.requestedAt,
      warnings: summary?.warnings ?? [],
    };
  });
}

export default async function LandlordDashboardPage({
  searchParams,
}: LandlordDashboardPageProps) {
  const session = await getSession();
  console.log("landlord session loaded", {
    hasSession: Boolean(session),
    role: session?.role,
  });

  if (!session) {
    redirect("/login?role=landlord");
  }

  if (session.role !== "landlord") {
    redirect(session.role === "tenant" ? "/dashboard/tenant" : "/dashboard");
  }

  const params = (await searchParams) ?? {};
  const propertiesData = getPropertiesForLandlord(session.id);
  const properties = Array.isArray(propertiesData) ? propertiesData : [];
  console.log("landlord properties loaded", { count: properties.length });
  const createdProperty = params.property ? findPropertyById(params.property) : null;
  const propertyTypesData = getPropertyTypes();
  const propertyTypes = Array.isArray(propertyTypesData) ? propertyTypesData : [];
  const suggestionsData = getAddressSuggestions();
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData : [];
  const createPropertyError = getCreatePropertyErrorMessage(params.error);
  const vendorActionMessage = getVendorActionMessage(params.vendor);
  const repairActionMessage = getRepairActionMessage(params.repair, params.review);
  const propertyUpdateMessage = getPropertyUpdateMessage(params.updated, params.code);
  const propertyGroups = properties.map((property) => {
    const ticketsData = getTicketsForProperty(property.id);
    const pendingTenantsData = getPendingTenantsForProperty(property.id);
    const approvedTenantsData = getApprovedTenantsForProperty(property.id);
    const tickets = Array.isArray(ticketsData) ? ticketsData : [];
    const pendingTenants = Array.isArray(pendingTenantsData) ? pendingTenantsData : [];
    const approvedTenants = Array.isArray(approvedTenantsData) ? approvedTenantsData : [];
    const trustSignal = getPropertyTrustSignal(property);
    const signupUrl = getAbsoluteAppUrl("/signup?role=tenant");
    const shareText = `${getPropertyAccessInstructions(property)}\nSignup link: ${signupUrl}`;
    const smsPreview = `RentTruth access for ${getPropertyDisplayName(property)}. Sign up at ${signupUrl} with name, email, and password, then log in and join ${getPropertyFullAddress(property)} using code ${property.joinCode}.${propertyTypeRequiresUnit(property.propertyType) ? " Add your unit number too." : " No unit number is required for this house."}`;

    return {
      property,
      tickets,
      pendingTenants,
      approvedTenants,
      trustSignal,
      shareText,
      smsPreview,
    };
  });
  console.log("landlord property groups loaded", { count: propertyGroups.length });
  const averageTrustScore =
    propertyGroups.length === 0
      ? 0
      : Math.round(
          propertyGroups.reduce((sum, group) => sum + group.trustSignal.landlordTrustScore, 0) /
            propertyGroups.length,
        );
  const lowConfidenceProperties = propertyGroups.filter(
    (group) => group.trustSignal.confidenceLevel === "Low",
  ).length;
  const allTickets = propertyGroups.flatMap((group) => group.tickets);
  console.log("landlord tickets loaded", { count: allTickets.length });
  const openTickets = allTickets.filter(
    (ticket) =>
      ticket.status !== "Resolved" &&
      ticket.status !== "Closed" &&
      ticket.status !== "Ready for landlord payment approval",
  );
  const urgentTickets = openTickets.filter((ticket) => ticket.urgent);
  const totalPendingApprovals = propertyGroups.reduce(
    (count, group) => count + group.pendingTenants.length,
    0,
  );
  const totalApprovedTenants = propertyGroups.reduce(
    (count, group) => count + group.approvedTenants.length,
    0,
  );
  const featuredPropertyGroup =
    totalApprovedTenants === 0
      ? (createdProperty
          ? propertyGroups.find((group) => group.property.id === createdProperty.id)
          : null) ??
        propertyGroups[0] ??
        null
      : null;
  const pendingApprovalQueue = propertyGroups.flatMap((group) =>
    group.pendingTenants.map((tenant) => ({
      property: group.property,
      tenant,
    })),
  );
  const activeTenantQueue = propertyGroups.flatMap((group) =>
    group.approvedTenants.map((tenant) => ({
      property: group.property,
      tenant,
    })),
  );
  const openTicketQueue = propertyGroups.flatMap((group) =>
    group.tickets
      .filter(
        (ticket) =>
          ticket.status !== "Resolved" &&
          ticket.status !== "Closed" &&
          ticket.status !== "Ready for landlord payment approval",
      )
      .map((ticket) => ({
        property: group.property,
        ticket,
      })),
  );
  const vendorInterestQueue = propertyGroups.flatMap((group) =>
    group.tickets
      .map((ticket) => {
        const interestedRequests = (ticket.vendorRequests ?? []).filter(
          (request) => request.status === "Vendor interested",
        );

        if (interestedRequests.length === 0) {
          return null;
        }

        return {
          property: group.property,
          ticket,
          interestedRequests,
        };
      })
      .filter((entry) => entry !== null),
  );
  const tenantConfirmationQueue = propertyGroups.flatMap((group) =>
    group.tickets
      .filter((ticket) => ticket.status === "Ready for landlord payment approval")
      .map((ticket) => ({
        property: group.property,
        ticket,
      })),
  );
  const repairApprovalQueue = propertyGroups.flatMap((group) =>
    group.tickets
      .filter((ticket) => ticket.repairApprovalRequest?.status === "Pending landlord approval")
      .map((ticket) => ({
        property: group.property,
        ticket,
      })),
  );
  const vendorArrivalQueue = propertyGroups.flatMap((group) =>
    group.tickets
      .filter((ticket) => ticket.status === "Vendor arrived" || Boolean(ticket.arrivedAt))
      .map((ticket) => ({
        property: group.property,
        ticket,
      })),
  );
  const primaryActiveTicket =
    openTicketQueue.find(({ ticket }) =>
      (ticket.vendorRequests ?? []).some((request) => request.status === "Vendor interested"),
    ) ??
    openTicketQueue.find(({ ticket }) => ticket.urgent) ??
    openTicketQueue[0] ??
    null;
  const summaryCards = [
    {
      title: "Open tickets",
      value: String(openTickets.length),
      detail: `Across ${properties.length} active properties`,
      href: "#open-tickets",
    },
    {
      title: "Urgent tickets",
      value: String(urgentTickets.length),
      detail: "Needs same-day attention",
      href: "#urgent-tickets",
    },
    {
      title: "Vendor selection",
      value: String(vendorInterestQueue.length),
      detail: "Needs landlord decision",
      href: "#vendor-selection-needed",
    },
    {
      title: "Payment review",
      value: String(tenantConfirmationQueue.length),
      detail: "Ready after tenant confirmation",
      href: "#payment-review",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            console.log("landlord dashboard mounted");
            console.log("landlord session found on dashboard", { sessionFound: true });
          `,
        }}
      />
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.26),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Landlord repair operations</p>
            </div>
          </Link>

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

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-2 sm:px-6 sm:pb-20 sm:pt-4 lg:px-8">
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-8 lg:p-10">
            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
                  Landlord dashboard
                </p>
                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  Welcome back, {session.name ?? session.email}
                </h1>
                <p className="mt-4 text-sm leading-6 text-white/72 sm:text-lg sm:leading-8">
                  Create properties with clearer setup, share access cleanly with residents, and keep approvals and repair routing tied to the right address.
                </p>
                <SupportEntryButtons className="mt-6" />
              </div>

              <div className="rounded-[24px] bg-white/8 p-4 sm:rounded-[32px] sm:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-white/55">
                  Portfolio signal
                </p>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-4xl font-semibold">{averageTrustScore || "—"}</p>
                    <p className="mt-2 text-sm text-white/60">Current trust score</p>
                  </div>
                  <a
                    href="#pending-approvals"
                    className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/25"
                  >
                    {totalPendingApprovals} pending approvals
                  </a>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan via-sky-400 to-emerald-400" />
                </div>
                <p className="mt-4 text-sm leading-6 text-white/55">
                  {lowConfidenceProperties > 0
                    ? `${lowConfidenceProperties} propert${
                        lowConfidenceProperties === 1 ? "y has" : "ies have"
                      } limited independent tenant data.`
                    : "Trust scoring is weighted toward independent tenant confirmations."}
                </p>
              </div>
            </div>
          </div>

          {params.created === "1" && createdProperty ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              Property created successfully: {getPropertyDisplayName(createdProperty)}. Join code{" "}
              <span className="font-semibold">{createdProperty.joinCode}</span> is ready to share, and the new property card is highlighted below.
            </div>
          ) : null}

          {primaryActiveTicket ? (
            <section className="mt-6 rounded-[28px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-xl shadow-slate-200/70 sm:rounded-[34px] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                    Active ticket needs attention
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {primaryActiveTicket.ticket.issueTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {getPropertyServiceAddress(
                      primaryActiveTicket.property,
                      primaryActiveTicket.ticket.unitNumber,
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                    <span className={`rounded-full border px-3 py-1 ${
                      primaryActiveTicket.ticket.urgent
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}>
                      {primaryActiveTicket.ticket.urgent ? "Urgent" : "Standard"}
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                      {primaryActiveTicket.ticket.status}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      {getTicketVendorLabel(primaryActiveTicket.ticket)}
                    </span>
                  </div>
                </div>

                <a
                  href={`#ticket-${primaryActiveTicket.ticket.id}`}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 lg:w-auto"
                >
                  View ticket
                </a>
              </div>
            </section>
          ) : null}

          {featuredPropertyGroup ? (
            <section className="mt-5 rounded-[26px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 sm:mt-6 sm:rounded-[32px] sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Tenant access code
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Share this code for {getPropertyDisplayName(featuredPropertyGroup.property)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getPropertyFullAddress(featuredPropertyGroup.property)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Tenants use this code after signup to request access. This shortcut stays near the top so you do not have to dig through the property list on mobile.
                  </p>
                </div>

                <div className="rounded-[24px] border border-emerald-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Active code
                  </p>
                  <p className="mt-2 select-all font-display text-4xl font-semibold tracking-[0.14em] text-emerald-950">
                    {featuredPropertyGroup.property.joinCode}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <ClipboardButton
                      value={featuredPropertyGroup.property.joinCode}
                      label="Copy Code"
                      copiedLabel="Code copied"
                      className="min-h-[52px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    />
                    <ShareButton
                      title="RentTruth tenant access"
                      text={featuredPropertyGroup.shareText}
                      label="Share Code"
                      fallbackLabel="Copy details below"
                      className="min-h-[52px] w-full rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {propertyUpdateMessage ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              {propertyUpdateMessage}
            </div>
          ) : null}

          {getMembershipActionMessage(params.membership) ? (
            <div className="mt-6 rounded-[28px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-medium text-sky-800 shadow-sm">
              {getMembershipActionMessage(params.membership)}
            </div>
          ) : null}

          {vendorActionMessage ? (
            <div className="mt-6 rounded-[28px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-medium text-sky-800 shadow-sm">
              {vendorActionMessage}
            </div>
          ) : null}

          {repairActionMessage ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              {repairActionMessage}
            </div>
          ) : null}

          {properties.length === 0 ? (
            <section
              id="create-property"
              className="mt-6 scroll-mt-4 rounded-[26px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-xl shadow-slate-200/70 target:ring-4 target:ring-emerald-200 sm:mt-8 sm:rounded-[34px] sm:p-7"
            >
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="rounded-[24px] bg-ink p-5 text-white sm:rounded-[30px] sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
                    First landlord step
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    Create your first property
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
                    Add the rental address first so you can generate a tenant join code, approve residents, and track repair tickets.
                  </p>
                  <a
                    href="#create-property-form"
                    className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:w-auto"
                  >
                    Create Property
                  </a>
                </div>

                <div
                  id="create-property-form"
                  className="scroll-mt-4 rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-lg shadow-slate-200/60 sm:rounded-[30px] sm:p-6"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Property setup
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Start with the address
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    This creates the property record and the tenant access code your residents will use after signup.
                  </p>
                  <LandlordPropertyForm
                    createPropertyAction={createPropertyAction}
                    propertyTypes={propertyTypes}
                    suggestions={suggestions}
                    errorMessage={createPropertyError}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80 sm:rounded-[30px] sm:p-6"
              >
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{card.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:mt-3 sm:text-sm sm:leading-6">{card.detail}</p>
              </a>
            ))}
          </div>

          {openTicketQueue.length > 0 ? (
            <section id="urgent-tickets" className="mt-6 scroll-mt-4 rounded-[26px] border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-rose-200 sm:mt-8 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Active ticket shortcuts
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Open repairs that need attention
                  </h2>
                </div>
                <a
                  href="#open-tickets"
                  className="min-h-[44px] rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400"
                >
                  View all tickets
                </a>
              </div>

              <div className="mt-5 grid gap-3 sm:mt-6 lg:grid-cols-2">
                {openTicketQueue.slice(0, 4).map(({ property, ticket }) => (
                  <a
                    key={`top-open-${ticket.id}`}
                    href={`#ticket-${ticket.id}`}
                    className="block rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:rounded-[28px] sm:p-5"
                  >
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                      <span className={`rounded-full border px-3 py-1 ${
                        ticket.urgent
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}>
                        {ticket.urgent ? "Urgent" : "Standard"}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink">
                      {ticket.issueTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {getPropertyServiceAddress(property, ticket.unitNumber)}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {getTicketVendorLabel(ticket)}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {vendorInterestQueue.length > 0 ? (
            <section id="vendor-selection-needed" className="mt-6 scroll-mt-4 rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-amber-200 sm:mt-8 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Vendor selection needed
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Choose the final vendor before this job stalls
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Interested vendors are surfaced here first whenever landlord review is the current bottleneck. Compare fit, review warnings, and make the assignment without digging through the full ticket list.
                  </p>
                </div>
                <div className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-800">
                  {vendorInterestQueue.length} active decision{vendorInterestQueue.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6">
                {vendorInterestQueue.slice(0, 2).map(({ property, ticket, interestedRequests }) => (
                  <article
                    key={`priority-${ticket.id}`}
                    className="rounded-[24px] border border-white/80 bg-white p-4 shadow-md shadow-slate-200/50 sm:rounded-[28px] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                            Vendor selection needed
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                            {getPropertyDisplayName(property)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                            {ticket.category}
                          </span>
                          <span className={`rounded-full border px-3 py-1 ${
                            ticket.urgent
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}>
                            {ticket.urgent ? "Urgent" : "Standard"}
                          </span>
                        </div>

                        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                          {ticket.issueTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {ticket.tenantEmail} submitted this issue {ticket.submittedAt} for {getPropertyServiceAddress(property, ticket.unitNumber)}. {interestedRequests.length} vendor{interestedRequests.length === 1 ? "" : "s"} already requested the job and are waiting for your decision.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {interestedRequests.map((request) => (
                            <span
                              key={`priority-${ticket.id}-${request.vendorUserId}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                            >
                              {request.vendorBusinessName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 xl:w-[280px]">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Current stage
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">Landlord decision required</p>
                        <p className="mt-2 leading-6">
                          Review pricing, reliability, and compliance signals below. Selecting one vendor will close this decision stage for the rest of the queue.
                        </p>
                      </div>
                    </div>

                    <VendorSelectionPanel
                      approveVendorAction={assignVendorAction}
                      declineVendorAction={declineVendorRequestAction}
                      assignLandlordVendorAction={assignLandlordVendorAction}
                      ticketId={ticket.id}
                      category={ticket.category}
                      currentVendorUserId={ticket.vendorUserId}
                      currentVendorBusinessName={ticket.vendorBusinessName}
                      ticketStatus={ticket.status}
                      vendors={getVendorCardsForTicket(ticket, property)}
                    />
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {repairApprovalQueue.length > 0 ? (
            <section className="mt-6 rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 sm:mt-8 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Repair approval needed
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Vendors are asking for scope or cost approval
                  </h2>
                </div>
                <div className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-800">
                  {repairApprovalQueue.length} decision{repairApprovalQueue.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6">
                {repairApprovalQueue.map(({ property, ticket }) => (
                  <article
                    key={`approval-${ticket.id}`}
                    className="rounded-[24px] border border-white/80 bg-white p-4 shadow-md shadow-slate-200/50 sm:rounded-[28px] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                            Approval needed
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                            {getPropertyDisplayName(property)}
                          </span>
                        </div>
                        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                          {ticket.issueTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {ticket.vendorBusinessName} requested approval for additional work at {getPropertyServiceAddress(property, ticket.unitNumber)}.
                        </p>
                        {ticket.repairApprovalRequest ? (
                          <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {ticket.repairApprovalRequest.summary}
                            </p>
                            {ticket.repairApprovalRequest.pricingItem ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Requested item: {ticket.repairApprovalRequest.pricingItem}
                              </p>
                            ) : null}
                            <p className="mt-2 text-sm text-slate-600">
                              Parts: ${ticket.repairApprovalRequest.partCost} · Labor impact: {ticket.repairApprovalRequest.laborImpact}
                            </p>
                            {typeof ticket.repairApprovalRequest.baselinePrice === "number" ? (
                              <p className="mt-2 text-sm text-slate-600">
                                Vendor baseline: ${ticket.repairApprovalRequest.baselinePrice}
                                {typeof ticket.repairApprovalRequest.priceDeltaPercent === "number"
                                  ? ` · ${ticket.repairApprovalRequest.priceDeltaPercent}% change`
                                  : ""}
                              </p>
                            ) : null}
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {ticket.repairApprovalRequest.notes}
                            </p>
                            <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                              Additional parts or charges should not proceed until you approve this repair request.
                            </div>
                            {ticket.repairApprovalRequest.exceedsBaselineWarning ? (
                              <div className="mt-3 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                                {ticket.repairApprovalRequest.exceedsBaselineWarning}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-3 xl:w-[320px]">
                        <form action={landlordApproveRepairRequestAction}>
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <button type="submit" className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                            Approve repair
                          </button>
                        </form>
                        <form action={landlordDeclineRepairRequestAction}>
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <button type="submit" className="w-full rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300">
                            Decline repair
                          </button>
                        </form>
                        <form action={landlordRequestRepairFollowUpAction}>
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <button type="submit" className="w-full rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:-translate-y-0.5 hover:border-amber-300">
                            Request follow-up
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {vendorArrivalQueue.length > 0 ? (
            <section className="mt-6 rounded-[26px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 sm:mt-8 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Vendor arrival updates
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    On-site visits are underway
                  </h2>
                </div>
                <div className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800">
                  {vendorArrivalQueue.length} active arrival{vendorArrivalQueue.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:mt-8">
                {vendorArrivalQueue.map(({ property, ticket }) => (
                  <article
                    key={`arrival-${ticket.id}`}
                    className="rounded-[28px] border border-white/80 bg-white p-5 shadow-md shadow-slate-200/50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                            Vendor arrived
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                            {getPropertyDisplayName(property)}
                          </span>
                        </div>
                        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                          {ticket.issueTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {ticket.vendorBusinessName ?? "Assigned vendor"} is on site for {ticket.tenantEmail}
                          {ticket.arrivedAt ? ` as of ${formatStatusTimestamp(ticket.arrivedAt)}` : ""} at {getPropertyServiceAddress(property, ticket.unitNumber)}.
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 lg:w-[320px]">
                        Keep an eye on this ticket for extra-cost approval requests, tenant follow-up,
                        or completion confirmation.
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tenantConfirmationQueue.length > 0 ? (
            <section id="payment-review" className="mt-6 scroll-mt-4 rounded-[26px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-emerald-200 sm:mt-8 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Tenant confirmed fixed
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Final landlord review is ready
                  </h2>
                </div>
                <div className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  {tenantConfirmationQueue.length} ready for review
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6">
                {tenantConfirmationQueue.map(({ property, ticket }) => (
                  <article
                    key={`tenant-confirmed-${ticket.id}`}
                    className="rounded-[24px] border border-white/80 bg-white p-4 shadow-md shadow-slate-200/50 sm:rounded-[28px] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                            Tenant confirmed fixed
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                            {getPropertyDisplayName(property)}
                          </span>
                        </div>
                        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                          {ticket.issueTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          Tenant satisfaction is on file for {getPropertyServiceAddress(property, ticket.unitNumber)}. This is the point where payment approval can be added later.
                        </p>
                        {ticket.tenantFeedback ? (
                          <p className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                            Tenant feedback: {ticket.tenantFeedback}
                          </p>
                        ) : null}
                      </div>

                      <form action={landlordCloseTicketAction} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 xl:w-[320px]">
                        <input type="hidden" name="ticketId" value={ticket.id} />
                        <p className="text-sm font-semibold text-slate-900">Payment method</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          MVP only. Choose how this payment will happen before marking it ready/sent.
                        </p>
                        {ticket.paymentMethod ? (
                          <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                            Payment method selected: {ticket.paymentMethod}
                          </p>
                        ) : null}
                        <select
                          name="paymentMethod"
                          defaultValue={ticket.paymentMethod ?? ""}
                          required
                          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        >
                          <option value="">Select payment method</option>
                          <option>Apple Pay</option>
                          <option>Cash App</option>
                          <option>Zelle</option>
                          <option>Credit / Debit Card</option>
                          <option>Other / Manual payment</option>
                        </select>
                        <textarea
                          name="reviewNotes"
                          rows={3}
                          placeholder="Optional payment or final review note"
                          className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                        <button type="submit" className="mt-3 min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                          Mark payment ready/sent
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6 rounded-[26px] border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:mt-8 sm:rounded-[32px] sm:p-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Action needed
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Run the portfolio like an operations command center
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Highest-priority landlord work appears here first: membership approvals, active tenants, open issues, and vendor interest that needs a final selection.
                </p>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                Act first, admin second
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 xl:grid-cols-2">
              <section
                id="pending-approvals"
                className="scroll-mt-4 rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-md shadow-slate-200/60 target:ring-4 target:ring-amber-200 sm:rounded-[28px] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Pending approvals
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                      {totalPendingApprovals} waiting for review
                    </h3>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Approval queue
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {pendingApprovalQueue.slice(0, 3).map(({ property, tenant }) => (
                    <article key={tenant.id} className="rounded-[22px] border border-white bg-white p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tenant.name ?? tenant.email}</p>
                          <p className="mt-1 text-sm text-slate-500">{tenant.email}</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {getPropertyDisplayName(property)} · {getResidenceLabel(property.propertyType, tenant.unitNumber)}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <form action={approveTenantAction}>
                            <input type="hidden" name="tenantUserId" value={tenant.id} />
                            <button
                              type="submit"
                          className="min-h-[46px] w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                            >
                              Approve
                            </button>
                          </form>
                          <form action={denyTenantAction}>
                            <input type="hidden" name="tenantUserId" value={tenant.id} />
                            <button
                              type="submit"
                              className="min-h-[46px] w-full rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300"
                            >
                              Deny
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  ))}
                  {pendingApprovalQueue.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-4 text-sm leading-7 text-slate-500">
                      No tenant approvals need attention right now.
                    </div>
                  ) : null}
                </div>
              </section>

              <section
                id="active-tenants"
                className="scroll-mt-4 rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-md shadow-slate-200/60 target:ring-4 target:ring-emerald-200 sm:rounded-[28px] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Active tenants
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                      {totalApprovedTenants} approved memberships
                    </h3>
                  </div>
                  <a
                    href="#active-tenants"
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                  >
                    Resident view
                  </a>
                </div>
                <div className="mt-5 grid gap-3">
                  {activeTenantQueue.slice(0, 4).map(({ property, tenant }) => (
                    <article key={tenant.id} className="rounded-[22px] border border-white bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">{tenant.name ?? tenant.email}</p>
                      <p className="mt-1 text-sm text-slate-500">{tenant.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                          {getPropertyDisplayName(property)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                          {getResidenceLabel(property.propertyType, tenant.unitNumber)}
                        </span>
                      </div>
                    </article>
                  ))}
                  {activeTenantQueue.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-4 text-sm leading-7 text-slate-500">
                      No approved tenants are attached yet.
                    </div>
                  ) : null}
                </div>
              </section>

              <section
                id="open-tickets"
                className="scroll-mt-4 rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-md shadow-slate-200/60 target:ring-4 target:ring-rose-200 sm:rounded-[28px] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Open tickets
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                      {openTickets.length} active repair issues
                    </h3>
                  </div>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                    {urgentTickets.length} urgent
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {openTicketQueue.slice(0, 4).map(({ property, ticket }) => (
                    <a key={ticket.id} href={`#ticket-${ticket.id}`} className="block rounded-[22px] border border-white bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md">
                      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                          {ticket.category}
                        </span>
                        <span className={`rounded-full border px-3 py-1 ${
                          ticket.urgent
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}>
                          {ticket.urgent ? "Urgent" : "Standard"}
                        </span>
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{ticket.issueTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {getPropertyServiceAddress(property, ticket.unitNumber)} · Submitted {ticket.submittedAt}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {getTicketVendorLabel(ticket)}
                      </p>
                    </a>
                  ))}
                  {openTicketQueue.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-4 text-sm leading-7 text-slate-500">
                      No open repair issues need triage right now.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-md shadow-slate-200/60 sm:rounded-[28px] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Vendor assignment requests
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                      {vendorInterestQueue.length} tickets need vendor selection
                    </h3>
                  </div>
                  <a href="#vendor-selection-needed" className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100">
                    Compare before assigning
                  </a>
                </div>
                <div className="mt-5 grid gap-3">
                  {vendorInterestQueue.slice(0, 4).map(({ property, ticket, interestedRequests }) => (
                    <article key={ticket.id} className="rounded-[22px] border border-white bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">{ticket.issueTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {getPropertyServiceAddress(property, ticket.unitNumber)} · {interestedRequests.length} interested vendor{interestedRequests.length === 1 ? "" : "s"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {interestedRequests.slice(0, 3).map((request) => (
                          <span
                            key={`${ticket.id}-${request.vendorUserId}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                          >
                            {request.vendorBusinessName}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                  {vendorInterestQueue.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-4 text-sm leading-7 text-slate-500">
                      No vendor requests are waiting on landlord selection yet.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </section>

          {properties.length > 0 ? (
          <section
            id="create-property"
            className="mt-6 scroll-mt-4 grid gap-4 target:ring-4 target:ring-emerald-200 sm:mt-8 sm:gap-6 xl:grid-cols-[0.92fr_1.08fr]"
          >
            <div className="rounded-[26px] border border-white/80 bg-white/92 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Create property
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Set up properties without unit confusion
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Add the rental address, choose the property type, and RentTruth will generate the tenant join code. Google autocomplete fills the manual fields when configured.
              </p>
              <LandlordPropertyForm
                createPropertyAction={createPropertyAction}
                propertyTypes={propertyTypes}
                suggestions={suggestions}
                errorMessage={createPropertyError}
              />
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-gradient-to-b from-emerald-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Portfolio properties
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Join codes, access sharing, and approval visibility
              </h2>

              <div className="mt-8 grid gap-4">
                {propertyGroups.map((group) => (
                  <article
                    key={group.property.id}
                    className={`rounded-[28px] border bg-white p-5 shadow-md shadow-slate-200/60 ${
                      params.created === "1" && params.property === group.property.id
                        ? "border-emerald-300 ring-2 ring-emerald-200"
                        : "border-white/80"
                    }`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-start">
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                          {getPropertyDisplayName(group.property)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {getPropertyFullAddress(group.property)}
                        </p>
                        {params.created === "1" && params.property === group.property.id ? (
                          <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                            Just created
                          </div>
                        ) : null}
                      </div>
                      <div className="min-w-[220px] rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-5 py-4 text-left shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Tenant access code
                        </p>
                        <p className="mt-2 font-display text-3xl font-semibold tracking-[0.12em] text-emerald-900">
                          {group.property.joinCode}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-800">
                          This code is tied to this property only.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                        {group.property.propertyType}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                        {group.property.propertyType === "House"
                          ? "Single residence"
                          : `${group.property.unitCount} residences`}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                        {group.pendingTenants.length} pending approvals
                      </span>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Share tenant access</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Copy or send the exact code and access instructions tenants need for this property.
                      </p>
                      <div className="mt-4 rounded-[20px] border border-emerald-200 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Property access code
                        </p>
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-display text-3xl font-semibold tracking-[0.12em] text-ink">
                            {group.property.joinCode}
                          </p>
                          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                            {group.property.propertyType}
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Tenants should select {getPropertyFullAddress(group.property)} and use this code during the join flow.
                        </p>
                      </div>
                      <PropertyShareTools
                        joinCode={group.property.joinCode}
                        shareText={group.shareText}
                        smsPreview={group.smsPreview}
                      />
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <summary className="cursor-pointer list-none rounded-full border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50">
                          Edit Property
                        </summary>
                        <div className="mt-5">
                          <p className="text-sm leading-7 text-slate-500">
                            Update the property profile without changing the current join code. If you want a new code, use the separate reset button below.
                          </p>
                          <LandlordPropertyForm
                            createPropertyAction={updatePropertyAction}
                            propertyTypes={propertyTypes}
                            suggestions={suggestions}
                            errorMessage={
                              params.edit === "1" && params.property === group.property.id
                                ? createPropertyError
                                : null
                            }
                            submitLabel="Save Property Changes"
                            initialValues={group.property}
                            hideUnitCountField
                          />
                        </div>
                      </details>

                      <form action={resetJoinCodeAction} className="self-start">
                        <input type="hidden" name="propertyId" value={group.property.id} />
                        <button
                          type="submit"
                          className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                        >
                          Regenerate Code
                        </button>
                      </form>
                    </div>
                  </article>
                ))}

                {propertyGroups.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 shadow-sm">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                          No properties yet
                        </p>
                        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                          Your first property will unlock access sharing and routed tickets
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          Once you create a property, this panel will show the live address record,
                          tenant access code, and share tools your renters need to request approval.
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-5 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          What appears here
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
                          <li>Property name and address</li>
                          <li>Tenant join/access code</li>
                          <li>Copy and send-code tools</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
          ) : null}

          <section className="mt-6 rounded-[26px] border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:mt-8 sm:rounded-[32px] sm:p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Incoming repair requests
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Active issues routed to the correct property
                </h2>
              </div>
              <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                Clean triage, faster resolution
              </div>
            </div>

            <div className="mt-8 grid gap-6">
              {propertyGroups.map((group) => (
                <section
                  key={group.property.id}
                  className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-md shadow-slate-200/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        {getPropertyDisplayName(group.property)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {getPropertyFullAddress(group.property)}
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      {group.property.joinCode}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {group.tickets.map((ticket) => (
                      <article
                        key={ticket.id}
                        id={`ticket-${ticket.id}`}
                        className="rounded-[24px] border border-white/80 bg-white p-5"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                {getResidenceLabel(group.property.propertyType, ticket.unitNumber)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                {ticket.category}
                              </span>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                ticket.urgent
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                              }`}>
                                {ticket.urgent ? "Urgent" : "Standard"}
                              </span>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                ticket.status === "Resolved" || ticket.status === "Closed" || ticket.status === "Ready for landlord payment approval"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : ticket.status === "Vendor selected" || ticket.status === "Vendor arrived"
                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                    : ticket.status === "Vendor interested"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>

                            <h4 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                              {ticket.issueTitle}
                            </h4>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span className="font-medium text-slate-700">{ticket.tenantEmail}</span>
                              <span className="text-slate-300">•</span>
                              <span>{getPropertyServiceAddress(group.property, ticket.unitNumber)}</span>
                              <span className="text-slate-300">•</span>
                              <span>Submitted {ticket.submittedAt}</span>
                              {ticket.vendorBusinessName ? (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Vendor {ticket.vendorBusinessName}</span>
                                </>
                              ) : null}
                              {ticket.landlordVendorName ? (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Landlord vendor {ticket.landlordVendorName}</span>
                                </>
                              ) : null}
                              {ticket.landlordVendorScheduledFor ? (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Scheduled {ticket.landlordVendorScheduledFor}</span>
                                </>
                              ) : null}
                              {ticket.arrivedAt ? (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Arrived {formatStatusTimestamp(ticket.arrivedAt)}</span>
                                </>
                              ) : null}
                            </div>

                            {ticket.tenantConfirmationStatus === "Tenant confirmed fixed" ? (
                              <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                                Tenant confirmed this repair was fixed
                                {ticket.tenantConfirmationAt
                                  ? ` at ${formatStatusTimestamp(ticket.tenantConfirmationAt)}`
                                  : ""}
                                .{ticket.tenantFeedback ? ` Feedback: ${ticket.tenantFeedback}` : ""}
                              </div>
                            ) : null}

                            {ticket.tenantConfirmationStatus === "Follow-up needed" ? (
                              <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                Tenant says the repair is still not fixed
                                {ticket.tenantConfirmationAt
                                  ? ` as of ${formatStatusTimestamp(ticket.tenantConfirmationAt)}`
                                  : ""}
                                .{ticket.tenantFeedback ? ` Feedback: ${ticket.tenantFeedback}` : ""}
                              </div>
                            ) : null}
                          </div>

                          <div className="w-full max-w-full min-w-0 xl:w-[380px] 2xl:w-[420px]">
                            <VendorSelectionPanel
                              approveVendorAction={assignVendorAction}
                              declineVendorAction={declineVendorRequestAction}
                              assignLandlordVendorAction={assignLandlordVendorAction}
                              ticketId={ticket.id}
                              category={ticket.category}
                              currentVendorUserId={ticket.vendorUserId}
                              currentVendorBusinessName={ticket.vendorBusinessName}
                              ticketStatus={ticket.status}
                              vendors={getVendorCardsForTicket(ticket, group.property)}
                            />

                            {ticket.landlordVendorName && !ticket.vendorUserId ? (
                              <div className="mt-4 rounded-[24px] border border-sky-200 bg-sky-50 p-4">
                                <p className="text-sm font-semibold text-sky-950">
                                  Outside vendor workflow
                                </p>
                                <p className="mt-2 text-sm leading-6 text-sky-800">
                                  Update the visit here when your own vendor arrives or finishes the work. This mirrors the RentTruth vendor workflow without requiring a vendor login.
                                </p>
                                <div className="mt-4 grid gap-3">
                                  <form action={landlordMarkOwnVendorArrivedAction}>
                                    <input type="hidden" name="ticketId" value={ticket.id} />
                                    <button
                                      type="submit"
                                      disabled={Boolean(ticket.arrivedAt) || ticket.status === "Waiting for tenant confirmation" || ticket.status === "Closed"}
                                      className="min-h-[48px] w-full rounded-full border border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-sky-900 transition hover:-translate-y-0.5 hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                      {ticket.arrivedAt
                                        ? `Vendor arrived ${formatStatusTimestamp(ticket.arrivedAt) ?? ""}`
                                        : "Mark vendor arrived"}
                                    </button>
                                  </form>

                                  <form action={landlordMarkOwnVendorCompletedAction} className="space-y-3">
                                    <input type="hidden" name="ticketId" value={ticket.id} />
                                    <textarea
                                      name="completionNotes"
                                      rows={3}
                                      placeholder="Optional note for the tenant, such as what was repaired"
                                      disabled={ticket.status === "Waiting for tenant confirmation" || ticket.status === "Closed"}
                                      className="w-full rounded-3xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <button
                                      type="submit"
                                      disabled={ticket.status === "Waiting for tenant confirmation" || ticket.status === "Closed"}
                                      className="min-h-[48px] w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                      {ticket.status === "Waiting for tenant confirmation"
                                        ? "Waiting for tenant confirmation"
                                        : ticket.status === "Closed"
                                          ? "Tenant confirmed fixed"
                                          : "Mark job completed"}
                                    </button>
                                  </form>

                                  {ticket.tenantConfirmationStatus === "Follow-up needed" ? (
                                    <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                      Tenant says the issue is not fixed yet. Keep this ticket open for follow-up with your vendor.
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}

                    {group.tickets.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500">
                        No tenant requests have been submitted for this property yet.
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60 backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Tenant approval queue
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                  Review who can activate private tenant access
                </h2>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                Landlord approval stays required
              </div>
            </div>

            <div className="mt-8 grid gap-6">
              {propertyGroups.map((group) => (
                <section
                  key={`${group.property.id}-memberships`}
                  className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-md shadow-slate-200/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        {getPropertyDisplayName(group.property)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {getPropertyFullAddress(group.property)}
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      {group.pendingTenants.length} pending
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {group.pendingTenants.map((tenant) => (
                      <article
                        key={tenant.id}
                        className="rounded-[24px] border border-white/80 bg-white p-5"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="max-w-3xl">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                                Pending
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                {getResidenceLabel(group.property.propertyType, tenant.unitNumber)}
                              </span>
                            </div>

                            <h4 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                              {tenant.name ?? tenant.email}
                            </h4>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span>{tenant.email}</span>
                              <span className="text-slate-300">•</span>
                              <span>Requested {tenant.membershipRequestedAt}</span>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <form action={approveTenantAction}>
                              <input type="hidden" name="tenantUserId" value={tenant.id} />
                              <button
                                type="submit"
                                className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={denyTenantAction}>
                              <input type="hidden" name="tenantUserId" value={tenant.id} />
                              <button
                                type="submit"
                                className="w-full rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300"
                              >
                                Deny
                              </button>
                            </form>
                          </div>
                        </div>
                      </article>
                    ))}

                    {group.pendingTenants.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500">
                        No pending tenant requests for this property right now.
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60 backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Active tenant management
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                  Manage approved memberships and move-outs
                </h2>
              </div>
            </div>

            <div className="mt-8 grid gap-6">
              {propertyGroups.map((group) => (
                <section
                  key={`${group.property.id}-approved`}
                  className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-md shadow-slate-200/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        {getPropertyDisplayName(group.property)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {getPropertyFullAddress(group.property)}
                      </p>
                    </div>
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                      {group.approvedTenants.length} approved
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {group.approvedTenants.map((tenant) => (
                      <article
                        key={tenant.id}
                        className="rounded-[24px] border border-white/80 bg-white p-5"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="max-w-3xl">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                Approved
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                {getResidenceLabel(group.property.propertyType, tenant.unitNumber)}
                              </span>
                            </div>

                            <h4 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                              {tenant.name ?? tenant.email}
                            </h4>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span>{tenant.email}</span>
                              <span className="text-slate-300">•</span>
                              <span>Requested {tenant.membershipRequestedAt}</span>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <form action={removeTenantAction}>
                              <input type="hidden" name="tenantUserId" value={tenant.id} />
                              <button
                                type="submit"
                                className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                              >
                                Remove Tenant
                              </button>
                            </form>
                            <form action={markTenantMovedOutAction}>
                              <input type="hidden" name="tenantUserId" value={tenant.id} />
                              <button
                                type="submit"
                                className="w-full rounded-full border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:-translate-y-0.5 hover:border-sky-300"
                              >
                                Mark Moved Out
                              </button>
                            </form>
                          </div>
                        </div>
                      </article>
                    ))}

                    {group.approvedTenants.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500">
                        No approved tenants are currently attached to this property.
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
