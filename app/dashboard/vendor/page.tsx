import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, logoutAction } from "@/app/actions/auth";
import {
  vendorRequestAssignmentAction,
  vendorDeclineAssignmentAction,
  vendorMarkArrivedAction,
  vendorMarkCompletedAction,
  vendorSubmitRepairApprovalRequestAction,
} from "@/app/actions/vendor";
import { SupportEntryButtons } from "@/components/support-entry-buttons";
import { VendorProfileForm } from "@/components/vendor-profile-form";
import { roleLabels } from "@/lib/auth";
import {
  type RepairTicketAttachment,
  findPropertyById,
  findVendorProfileByUserId,
  getAvailableVendorJobs,
  getPropertyDisplayName,
  getPropertyServiceAddress,
  getPropertyTicketHistory,
  propertyTypeRequiresUnit,
  type Property,
  getVendorAssignedJobs,
  getVendorCompletedJobs,
  getVendorInterestedJobs,
  getVendorPerformanceMetrics,
  getVendorPrimaryAssignedJob,
  getCommonRepairPricingItems,
} from "@/lib/demo-data";
import { getComplianceBadgeTone, getVendorSummaryBadges } from "@/lib/vendor";

type VendorDashboardPageProps = {
  searchParams?: Promise<{ error?: string; saved?: string; job?: string }>;
};

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

function TenantPhotoPreview({
  attachment,
  photoLabel,
  compact = false,
}: {
  attachment?: RepairTicketAttachment | null;
  photoLabel?: string;
  compact?: boolean;
}) {
  const resolvedAttachment =
    attachment ??
    (photoLabel && photoLabel !== "No photo uploaded"
      ? {
          fileName: photoLabel,
          kind: photoLabel.toLowerCase().endsWith(".pdf")
            ? "pdf"
            : /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(photoLabel)
              ? "image"
              : "file",
        }
      : null);
  const hasAttachment = Boolean(resolvedAttachment);
  const isImage = resolvedAttachment?.kind === "image";
  const isPdf = resolvedAttachment?.kind === "pdf";
  const actionLabel = isImage ? "Open image" : isPdf ? "Open PDF" : "Open file";
  const kindLabel = isImage ? "Image" : isPdf ? "PDF" : "File";

  return (
    <div
      className={`rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white ${
        compact ? "min-h-[170px]" : "min-h-[240px]"
      }`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Ticket attachment
          </p>
          <div
            className={`mt-4 rounded-[18px] border border-white/10 bg-white/5 ${
              compact ? "p-5" : "p-6"
            }`}
          >
            {isImage && resolvedAttachment?.dataUrl ? (
              <a
                href={resolvedAttachment.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={resolvedAttachment.dataUrl}
                  alt={resolvedAttachment.fileName}
                  className={`w-full rounded-[16px] border border-white/10 object-cover ${
                    compact ? "h-28" : "h-40"
                  }`}
                />
              </a>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-semibold uppercase">
                    {hasAttachment ? kindLabel : "--"}
                  </div>
                  <div className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    {hasAttachment ? "Click to open" : "No upload"}
                  </div>
                </div>
                <div
                  className={`mt-5 rounded-[16px] border border-dashed border-white/15 bg-black/15 ${
                    compact ? "h-20" : "h-28"
                  }`}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-white/90">
            {resolvedAttachment?.fileName ?? "No file uploaded"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {hasAttachment
              ? `${kindLabel} · Click to open`
              : "No attachment is on file for this ticket yet."}
          </p>
          {resolvedAttachment?.dataUrl ? (
            <a
              href={resolvedAttachment.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              {actionLabel}
            </a>
          ) : hasAttachment ? (
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
              {isImage ? "Image uploaded in demo data" : actionLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getVendorErrorMessage(error?: string) {
  if (error === "missing-profile-fields") {
    return "Add the business name, legal contact, phone, service area, and at least one service category before saving your vendor profile.";
  }

  return null;
}

function getVendorJobMessage(job?: string) {
  if (job === "requested") {
    return "Interest submitted. The landlord can now compare your profile with other interested vendors before choosing the final assignment.";
  }

  if (job === "declined") {
    return "You passed on this job. It has been removed from your active request queue.";
  }

  if (job === "selected") {
    return "You were selected for the job. Arrival and completion milestones are now active on your dashboard.";
  }

  if (job === "arrived") {
    return "Arrival logged. The dashboard will now track progress from the on-site milestone.";
  }

  if (job === "in-progress") {
    return "Work marked in progress.";
  }

  if (job === "completed") {
    return "Work completion recorded. The tenant now needs to confirm whether the problem is actually fixed before the landlord does the final review.";
  }

  if (job === "approval-requested") {
    return "Repair approval request sent. The landlord can now review parts cost, labor impact, and your notes before authorizing follow-up work.";
  }

  if (job === "approval-missing") {
    return "Add a repair summary and labor impact before sending an approval request.";
  }

  return null;
}

function UnitContextMessage({
  property,
  unitNumber,
}: {
  property: Property;
  unitNumber?: string;
}) {
  if (!propertyTypeRequiresUnit(property.propertyType)) {
    return (
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
        House selected. No apartment or unit number is required.
      </p>
    );
  }

  return (
    <p
      className={`mt-2 text-xs font-semibold uppercase tracking-[0.12em] ${
        unitNumber ? "text-orange-800" : "text-rose-700"
      }`}
    >
      Unit number is required for this property type.
      {unitNumber ? ` Unit on ticket: ${unitNumber}.` : " Unit missing from this ticket."}
    </p>
  );
}

export default async function VendorDashboardPage({
  searchParams,
}: VendorDashboardPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "vendor") {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const profile = findVendorProfileByUserId(session.id);
  const metrics = getVendorPerformanceMetrics(session.id);
  const availableJobs = getAvailableVendorJobs(session.id);
  const interestedJobs = getVendorInterestedJobs(session.id);
  const assignedJobs = getVendorAssignedJobs(session.id);
  const primaryAssignedJob = getVendorPrimaryAssignedJob(session.id);
  const primaryAssignedProperty = primaryAssignedJob
    ? findPropertyById(primaryAssignedJob.propertyId)
    : null;
  const completedJobs = getVendorCompletedJobs(session.id);
  const errorMessage = getVendorErrorMessage(params.error);
  const jobMessage = getVendorJobMessage(params.job);
  const profileBadges = profile ? getVendorSummaryBadges(profile) : [];

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(255,179,71,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(111,232,255,0.18),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#fff8ef_55%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Vendor operations workspace</p>
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
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-200">
                  Vendor dashboard
                </p>
                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  Welcome back, {profile?.businessName ?? session.name ?? session.email}
                </h1>
                <p className="mt-4 text-sm leading-6 text-white/72 sm:text-lg sm:leading-8">
                  Manage active assignments, keep your compliance profile up to date, and show landlords neutral, document-backed trust signals instead of promises.
                </p>
                <SupportEntryButtons className="mt-6" />
                {profile ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {profileBadges.map((badge, index) => (
                      <span
                        key={`${badge}-${index}`}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getComplianceBadgeTone(badge)}`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900">
                    Finish your vendor profile setup to appear in landlord assignment panels.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <a href="#available-jobs" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Available jobs</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{availableJobs.length}</p>
                </a>
                <a href="#interest-queue" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Interest submitted</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{interestedJobs.length}</p>
                </a>
                <a href="#completed-jobs" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Completed jobs</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{metrics.completedJobs}</p>
                </a>
                <a href="#active-assignment" className="rounded-2xl bg-white/8 p-3 transition hover:bg-white/12 sm:rounded-3xl sm:p-5">
                  <p className="text-sm text-white/55">Active job</p>
                  <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{primaryAssignedJob ? "1" : "0"}</p>
                </a>
              </div>
            </div>
          </div>

          {params.saved === "1" ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              Vendor profile saved. Compliance and verification statuses are now visible to landlords in assignment comparisons.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {jobMessage ? (
            <div className="mt-6 rounded-[28px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-medium text-sky-800 shadow-sm">
              {jobMessage}
            </div>
          ) : null}

          {primaryAssignedJob ? (
            <section id="active-assignment" className="mt-6 scroll-mt-4 rounded-[26px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-orange-200 sm:mt-8 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
                    Active assignment
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Keep the selected job front and center
                  </h2>
                </div>
                <div className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-800">
                  {primaryAssignedJob.status}
                </div>
              </div>

              <article className="mt-5 rounded-[24px] border border-white/80 bg-white p-4 shadow-md shadow-slate-200/50 sm:mt-8 sm:rounded-[28px] sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {primaryAssignedJob.category}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                        primaryAssignedJob.urgent
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}>
                        {primaryAssignedJob.urgent ? "Urgent" : "Standard"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                      {primaryAssignedJob.issueTitle}
                    </h3>
                    {primaryAssignedProperty ? (
                      <div className="mt-2 rounded-[18px] border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold leading-6 text-orange-900">
                        <p>
                          Service location:{" "}
                          {getPropertyServiceAddress(primaryAssignedProperty, primaryAssignedJob.unitNumber)}
                        </p>
                        <UnitContextMessage
                          property={primaryAssignedProperty}
                          unitNumber={primaryAssignedJob.unitNumber}
                        />
                      </div>
                    ) : null}
                    <p className="mt-3 text-base leading-7 text-slate-600">
                      {primaryAssignedJob.description}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <TenantPhotoPreview
                        attachment={primaryAssignedJob.attachment}
                        compact
                        photoLabel={primaryAssignedJob.photoUploadPlaceholder}
                      />
                      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">Prior property history</p>
                        <div className="mt-2 space-y-2">
                          {getPropertyTicketHistory(primaryAssignedJob.propertyId, primaryAssignedJob.id)
                            .slice(0, 2)
                            .map((historyTicket) => (
                              <div key={`hero-${historyTicket.id}`} className="text-sm leading-6 text-slate-600">
                                {historyTicket.issueTitle} · {historyTicket.status}
                              </div>
                            ))}
                          {getPropertyTicketHistory(primaryAssignedJob.propertyId, primaryAssignedJob.id).length === 0 ? (
                            <p className="text-sm leading-6 text-slate-500">
                              No prior property history is on file yet.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <details className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                        Open full ticket details
                      </summary>
                      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <TenantPhotoPreview
                          attachment={primaryAssignedJob.attachment}
                          photoLabel={primaryAssignedJob.photoUploadPlaceholder}
                        />
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Full job context
                          </p>
                          <dl className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                            <div>
                              <dt className="font-semibold text-slate-900">Title</dt>
                              <dd>{primaryAssignedJob.issueTitle}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">Description</dt>
                              <dd>{primaryAssignedJob.description}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">Service location</dt>
                              <dd>
                                {primaryAssignedProperty
                                  ? getPropertyServiceAddress(primaryAssignedProperty, primaryAssignedJob.unitNumber)
                                  : "Property details unavailable"}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">Urgency</dt>
                              <dd>{primaryAssignedJob.urgent ? "Urgent" : "Standard"}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">Arrival</dt>
                              <dd>
                                {primaryAssignedJob.arrivedAt
                                  ? `Arrived ${formatStatusTimestamp(primaryAssignedJob.arrivedAt)}`
                                  : "Not marked arrived yet"}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </details>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[330px]">
                    <form action={vendorMarkArrivedAction}>
                      <input type="hidden" name="ticketId" value={primaryAssignedJob.id} />
                      <button type="submit" className="min-h-[48px] w-full rounded-full border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:-translate-y-0.5 hover:border-sky-300">
                        Mark arrived
                      </button>
                    </form>
                    <form action={vendorMarkCompletedAction}>
                      <input type="hidden" name="ticketId" value={primaryAssignedJob.id} />
                      <input type="hidden" name="completionNotes" value="Work completed and waiting for tenant confirmation." />
                      <button type="submit" className="min-h-[48px] w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300">
                        Mark work completed
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div id="available-jobs" className="scroll-mt-4 rounded-[26px] border border-slate-200 bg-gradient-to-b from-orange-50 via-white to-white p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-orange-200 sm:rounded-[32px] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Available jobs
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Local work you can request right now
                  </h2>
                </div>
                <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
                  {availableJobs.length} matching jobs
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {availableJobs.map((ticket) => {
                  const property = findPropertyById(ticket.propertyId);
                  return (
                    <article key={ticket.id} className="rounded-[22px] border border-white bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                              {ticket.category}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                              {ticket.urgent ? "Urgent" : "Standard"}
                            </span>
                          </div>
                          <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                            {ticket.issueTitle}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {property
                              ? `${getPropertyDisplayName(property)} · ${getPropertyServiceAddress(property, ticket.unitNumber)}`
                              : "Property details unavailable"}
                          </p>
                          {property ? (
                            <UnitContextMessage property={property} unitNumber={ticket.unitNumber} />
                          ) : null}
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {ticket.description}
                          </p>
                          <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            <TenantPhotoPreview
                              attachment={ticket.attachment}
                              compact
                              photoLabel={ticket.photoUploadPlaceholder}
                            />
                            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-700">Prior property history</p>
                              <div className="mt-2 space-y-2">
                                {getPropertyTicketHistory(ticket.propertyId, ticket.id)
                                  .slice(0, 2)
                                  .map((historyTicket) => (
                                    <div key={`available-${ticket.id}-${historyTicket.id}`} className="text-sm leading-6 text-slate-600">
                                      {historyTicket.issueTitle} · {historyTicket.status}
                                    </div>
                                  ))}
                                {getPropertyTicketHistory(ticket.propertyId, ticket.id).length === 0 ? (
                                  <p className="text-sm leading-6 text-slate-500">
                                    No prior property history is on file yet.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <details className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                              Open full ticket details
                            </summary>
                            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                              <TenantPhotoPreview
                                attachment={ticket.attachment}
                                photoLabel={ticket.photoUploadPlaceholder}
                              />
                              <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Full job context
                                </p>
                                <dl className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                  <div>
                                    <dt className="font-semibold text-slate-900">Title</dt>
                                    <dd>{ticket.issueTitle}</dd>
                                  </div>
                                  <div>
                                    <dt className="font-semibold text-slate-900">Description</dt>
                                    <dd>{ticket.description}</dd>
                                  </div>
                                  <div>
                                    <dt className="font-semibold text-slate-900">Service location</dt>
                                    <dd>
                                      {property
                                        ? getPropertyServiceAddress(property, ticket.unitNumber)
                                        : "Property details unavailable"}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="font-semibold text-slate-900">Category</dt>
                                    <dd>{ticket.category}</dd>
                                  </div>
                                  <div>
                                    <dt className="font-semibold text-slate-900">Urgency</dt>
                                    <dd>{ticket.urgent ? "Urgent" : "Standard"}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </details>
                        </div>
                        <div className="grid gap-3">
                          <form action={vendorRequestAssignmentAction}>
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <button type="submit" className="min-h-[48px] w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                              Request assignment
                            </button>
                          </form>
                          <form action={vendorDeclineAssignmentAction}>
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <button type="submit" className="min-h-[48px] w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50">
                              Not available
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {availableJobs.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500">
                    <span className="font-semibold text-slate-700">No available jobs.</span>{" "}
                    No currently active tickets match your service categories and configured service area.
                  </div>
                ) : null}
              </div>
            </div>

            <div id="interest-queue" className="scroll-mt-4 rounded-[26px] border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-orange-200 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Request queue
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Interest you’ve already submitted
              </h2>
              <div className="mt-6 space-y-4">
                {interestedJobs.map((ticket) => (
                  <article key={`${ticket.id}-interest`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {ticket.category}
                          </span>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                            Waiting on landlord selection
                          </span>
                        </div>
                        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                          {ticket.issueTitle}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Your request is visible to the landlord alongside other interested vendors. Final assignment only happens after the landlord selects one vendor.
                        </p>
                      </div>
                      <form action={vendorDeclineAssignmentAction}>
                        <input type="hidden" name="ticketId" value={ticket.id} />
                        <button type="submit" className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50">
                          Withdraw request
                        </button>
                      </form>
                    </div>
                  </article>
                ))}

                {interestedJobs.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500">
                    No open requests are waiting on landlord selection right now.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="rounded-[26px] border border-white/80 bg-white/92 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Vendor profile setup
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Business, compliance, and trust profile
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                These fields are shown to landlords as self-reported details, uploaded documents, and verification statuses on file. They should not imply a guarantee of work quality or personal safety.
              </p>
              <VendorProfileForm profile={profile} errorMessage={errorMessage} />
            </section>

            <section className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Timing metrics
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Avg. acceptance</p>
                    <p className="mt-2 font-display text-3xl font-semibold text-ink">{metrics.averageAcceptanceTime}</p>
                  </article>
                  <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Avg. arrival</p>
                    <p className="mt-2 font-display text-3xl font-semibold text-ink">{metrics.averageArrivalTime}</p>
                  </article>
                  <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Avg. completion</p>
                    <p className="mt-2 font-display text-3xl font-semibold text-ink">{metrics.averageCompletionTime}</p>
                  </article>
                </div>
              </div>

              <div id="completed-jobs" className="scroll-mt-4 rounded-[32px] border border-slate-200 bg-gradient-to-b from-orange-50 via-white to-white p-7 shadow-lg shadow-slate-200/60 target:ring-4 target:ring-orange-200">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Selected and completed jobs
                </p>
                <div className="mt-5 space-y-4">
                  {assignedJobs.filter((ticket) => ticket.id !== primaryAssignedJob?.id).map((ticket) => {
                    const property = findPropertyById(ticket.propertyId);

                    return (
                    <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                              {ticket.category}
                            </span>
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                              {ticket.status}
                            </span>
                          </div>
                          <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                            {ticket.issueTitle}
                          </h3>
                          {property ? (
                            <div className="mt-2 rounded-[18px] border border-orange-100 bg-white px-4 py-3 text-sm font-semibold leading-6 text-orange-900">
                              <p>Service location: {getPropertyServiceAddress(property, ticket.unitNumber)}</p>
                              <UnitContextMessage property={property} unitNumber={ticket.unitNumber} />
                            </div>
                          ) : null}
                          {ticket.vendorCompletionNotes ? (
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              Latest vendor note: {ticket.vendorCompletionNotes}
                            </p>
                          ) : null}
                          {ticket.arrivedAt ? (
                            <div className="mt-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                              Arrived {formatStatusTimestamp(ticket.arrivedAt)}
                            </div>
                          ) : null}
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:w-[330px]">
                          <form action={vendorMarkArrivedAction}>
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <button type="submit" className="w-full rounded-full border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:-translate-y-0.5 hover:border-sky-300">
                              Mark arrived
                            </button>
                          </form>
                          <form action={vendorMarkCompletedAction}>
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <input type="hidden" name="completionNotes" value="Work completed and waiting for tenant confirmation." />
                            <button type="submit" className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300">
                              Mark work completed
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Prior property history
                          </p>
                          <div className="mt-4 grid gap-3">
                            {getPropertyTicketHistory(ticket.propertyId, ticket.id)
                              .slice(0, 3)
                              .map((historyTicket) => (
                                <article
                                  key={`${ticket.id}-${historyTicket.id}`}
                                  className="rounded-[18px] border border-slate-200 bg-slate-50 p-3"
                                >
                                  <p className="text-sm font-semibold text-slate-900">
                                    {historyTicket.issueTitle}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {historyTicket.category} · {historyTicket.status}
                                  </p>
                                  {historyTicket.vendorCompletionNotes ? (
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {historyTicket.vendorCompletionNotes}
                                    </p>
                                  ) : null}
                                </article>
                              ))}
                            {getPropertyTicketHistory(ticket.propertyId, ticket.id).length === 0 ? (
                              <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-500">
                                No prior property history is on file for this address yet.
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <form
                          action={vendorSubmitRepairApprovalRequestAction}
                          className="rounded-[22px] border border-slate-200 bg-white p-4"
                        >
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Ask for approval
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Use this when diagnosis shows extra parts or cost before moving forward. Extra charges should wait for landlord approval before the added work proceeds.
                          </p>
                          <div className="mt-4 grid gap-3">
                            <select
                              name="pricingItem"
                              defaultValue=""
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            >
                              <option value="">Pick the main repair item</option>
                              {getCommonRepairPricingItems().map((entry) => (
                                <option key={entry.item} value={entry.item}>
                                  {entry.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              name="summary"
                              placeholder="Compressor likely needs replacement"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />
                            <input
                              type="number"
                              min="0"
                              step="1"
                              name="partCost"
                              placeholder="Part cost"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />
                            <input
                              type="text"
                              name="laborImpact"
                              placeholder="Adds 2 more labor hours and a return visit"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />
                            <textarea
                              name="notes"
                              rows={3}
                              placeholder="Share findings and another option if one exists."
                              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />
                            <button
                              type="submit"
                              className="rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:-translate-y-0.5 hover:border-amber-300"
                            >
                              Submit repair approval request
                            </button>
                          </div>
                        </form>
                      </div>
                    </article>
                    );
                  })}

                  {assignedJobs.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500">
                      No selected assignments are currently in your active queue.
                    </div>
                  ) : null}

                  {completedJobs.map((ticket) => {
                    const property = findPropertyById(ticket.propertyId);

                    return (
                    <article key={`${ticket.id}-completed`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                            {ticket.issueTitle}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Completed milestone recorded. Status: {ticket.status}
                          </p>
                          {property ? (
                            <div className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                              <p>{getPropertyServiceAddress(property, ticket.unitNumber)}</p>
                              <UnitContextMessage property={property} unitNumber={ticket.unitNumber} />
                            </div>
                          ) : null}
                          {ticket.tenantFeedback ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Tenant feedback: {ticket.tenantFeedback}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                          {ticket.status}
                        </span>
                      </div>
                    </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
