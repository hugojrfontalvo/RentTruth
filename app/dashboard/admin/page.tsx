import Link from "next/link";
import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  markFeedbackResolvedAction,
  updateFeedbackStatusAction,
  updateVendorVerificationAction,
} from "@/app/actions/admin";
import { getSession, logoutAction } from "@/app/actions/auth";
import { isAdminSession } from "@/lib/admin-access";
import {
  type AppUser,
  type Property,
  type RepairTicket,
  type SupportTicket,
  type VendorProfile,
  getActivityEvents,
  getNotifications,
  getPropertyDisplayName,
  getPropertyFullAddress,
  getPropertyServiceAddress,
  getRepairTickets,
  getSupportTicketStatuses,
  getSupportTickets,
  getTenantJoinableProperties,
  getUsers,
  getVendorPerformanceMetrics,
  getVendorProfiles,
  isDemoDataEnabled,
  isDemoProperty,
  isDemoRepairTicket,
  isDemoSupportTicket,
  isDemoUser,
  isDemoVendorProfile,
  propertyTypeRequiresUnit,
} from "@/lib/demo-data";

type AdminDashboardProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    ticketStatus?: string;
    vendorVerification?: string;
    feedbackStatus?: string;
    admin?: string;
    adminError?: string;
  }>;
};

const verificationOptions = [
  "Identity Verified",
  "Verification Pending",
  "Not Verified",
] as const;

const backgroundOptions = [
  "Background Check Complete",
  "Verification Pending",
  "Not Verified",
] as const;

const complianceOptions = [
  "Verified on file",
  "Self-reported",
  "Verification Pending",
  "Expired",
  "No documents on file",
] as const;

function norm(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function includesQuery(values: Array<string | undefined | null>, query: string) {
  if (!query) {
    return true;
  }

  return values.some((value) => norm(value).includes(query));
}

function statusTone(status?: string | null) {
  if (
    status === "Approved" ||
    status === "Closed" ||
    status === "Resolved" ||
    status === "Identity Verified" ||
    status === "Background Check Complete" ||
    status === "Verified on file"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    status === "Pending" ||
    status === "Open" ||
    status === "New" ||
    status === "Vendor interested" ||
    status === "Pending landlord approval" ||
    status === "Verification Pending"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    status === "Denied" ||
    status === "Removed" ||
    status === "Not Verified" ||
    status === "Expired" ||
    status === "No documents on file"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone ?? "border-slate-200 bg-white text-slate-600"}`}>
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "Not on file"}</p>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4 rounded-[28px] border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function completionCount(tickets: RepairTicket[]) {
  return tickets.filter((ticket) =>
    ["Closed", "Resolved", "Ready for landlord payment approval", "Tenant confirmed fixed"].includes(ticket.status),
  ).length;
}

function openCount(tickets: RepairTicket[]) {
  return tickets.filter((ticket) =>
    !["Closed", "Resolved", "Ready for landlord payment approval", "Tenant confirmed fixed"].includes(ticket.status),
  ).length;
}

function averageCompletionLabel(properties: Array<{ averageCompletionTime: string }>) {
  return properties[0]?.averageCompletionTime ?? "Not enough data";
}

function isClosedTicket(ticket: RepairTicket) {
  return ["Closed", "Resolved", "Ready for landlord payment approval", "Tenant confirmed fixed"].includes(ticket.status);
}

function getTicketLandlord(
  ticket: RepairTicket,
  findVisiblePropertyById: (propertyId: string) => Property | null,
  findVisibleUserById: (userId: string) => AppUser | null,
) {
  const property = findVisiblePropertyById(ticket.propertyId);
  return property ? findVisibleUserById(property.landlordId) : null;
}

function vendorVerificationBucket(profile: VendorProfile) {
  const complete =
    profile.identityVerificationStatus === "Identity Verified" &&
    profile.backgroundCheckStatus === "Background Check Complete" &&
    profile.licenseStatus === "Verified on file" &&
    profile.insuranceStatus === "Verified on file";

  if (complete) {
    return "verified";
  }

  if (
    profile.identityVerificationStatus === "Verification Pending" ||
    profile.backgroundCheckStatus === "Verification Pending" ||
    profile.licenseStatus === "Verification Pending" ||
    profile.insuranceStatus === "Verification Pending"
  ) {
    return "pending";
  }

  return "incomplete";
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login?role=admin");
  }

  if (!isAdminSession(session)) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const query = norm(params.q);
  const roleFilter = params.role ?? "all";
  const ticketStatusFilter = params.ticketStatus ?? "all";
  const vendorVerificationFilter = params.vendorVerification ?? "all";
  const feedbackStatusFilter = params.feedbackStatus ?? "all";
  const includeDemoData = isDemoDataEnabled();
  const users = includeDemoData ? getUsers() : getUsers().filter((user) => !isDemoUser(user));
  const visibleUserIds = new Set(users.map((user) => user.id));
  const properties = (includeDemoData ? getTenantJoinableProperties() : getTenantJoinableProperties().filter((property) => !isDemoProperty(property)))
    .filter((property) => visibleUserIds.has(property.landlordId));
  const visiblePropertyIds = new Set(properties.map((property) => property.id));
  const tickets = (includeDemoData ? getRepairTickets() : getRepairTickets().filter((ticket) => !isDemoRepairTicket(ticket)))
    .filter((ticket) => visiblePropertyIds.has(ticket.propertyId));
  const supportTickets = includeDemoData ? getSupportTickets() : getSupportTickets().filter((ticket) => !isDemoSupportTicket(ticket));
  const vendorProfiles = (includeDemoData ? getVendorProfiles() : getVendorProfiles().filter((profile) => !isDemoVendorProfile(profile)))
    .filter((profile) => visibleUserIds.has(profile.userId));
  const findVisibleUserById = (userId: string) => users.find((user) => user.id === userId) ?? null;
  const findVisiblePropertyById = (propertyId: string) => properties.find((property) => property.id === propertyId) ?? null;
  const getVisibleApprovedTenantsForProperty = (propertyId: string) =>
    users.filter((user) => user.role === "tenant" && user.propertyId === propertyId && user.membershipStatus === "Approved");
  const landlords = users.filter((user) => user.role === "landlord");
  const tenants = users.filter((user) => user.role === "tenant");
  const vendorUsers = users.filter((user) => user.role === "vendor");
  const vendorRequests = tickets.flatMap((ticket) =>
    (ticket.vendorRequests ?? []).map((request) => ({
      ticket,
      request,
      property: findVisiblePropertyById(ticket.propertyId),
    })),
  );
  const approvals = tickets.filter((ticket) => ticket.repairApprovalRequest);
  const activityFeed = getActivityEvents()
    .filter((event) => {
      if (includeDemoData) return true;
      if (event.actorUserId && !visibleUserIds.has(event.actorUserId)) return false;
      if (event.entityType === "property" && event.entityId && !visiblePropertyIds.has(event.entityId)) return false;
      if (event.entityType === "ticket" && event.entityId && !tickets.some((ticket) => ticket.id === event.entityId)) return false;
      return true;
    })
    .slice(0, 16);
  const notifications = getNotifications().filter((notification) => {
    if (includeDemoData) return true;
    if (notification.userId && !visibleUserIds.has(notification.userId)) return false;
    return true;
  });
  const filteredLandlords = landlords.filter((landlord) => {
    if (roleFilter !== "all" && roleFilter !== "landlord") return false;
    const ownedProperties = properties.filter((property) => property.landlordId === landlord.id);
    return includesQuery(
      [landlord.name, landlord.email, ...ownedProperties.map(getPropertyFullAddress)],
      query,
    );
  });
  const filteredTenants = tenants.filter((tenant) => {
    if (roleFilter !== "all" && roleFilter !== "tenant") return false;
    const property = tenant.propertyId ? findVisiblePropertyById(tenant.propertyId) : null;
    return includesQuery([tenant.name, tenant.email, tenant.savedAddress, property && getPropertyFullAddress(property)], query);
  });
  const filteredVendors = vendorUsers.filter((vendor) => {
    if (roleFilter !== "all" && roleFilter !== "vendor") return false;
    const profile = vendorProfiles.find((entry) => entry.userId === vendor.id);
    if (vendorVerificationFilter !== "all" && profile && vendorVerificationBucket(profile) !== vendorVerificationFilter) return false;
    if (vendorVerificationFilter !== "all" && !profile) return false;
    return includesQuery([vendor.name, vendor.email, profile?.businessName, profile?.legalContactName, profile?.serviceArea], query);
  });
  const filteredProperties = properties.filter((property) =>
    includesQuery([property.name, getPropertyFullAddress(property), property.joinCode, findVisibleUserById(property.landlordId)?.email], query),
  );
  const filteredTickets = tickets.filter((ticket) => {
    const property = findVisiblePropertyById(ticket.propertyId);
    const tenant = findVisibleUserById(ticket.tenantUserId);
    const landlord = property ? findVisibleUserById(property.landlordId) : null;
    if (ticketStatusFilter !== "all" && ticket.status !== ticketStatusFilter) return false;
    return includesQuery(
      [ticket.issueTitle, ticket.tenantEmail, property && getPropertyFullAddress(property), tenant?.name, landlord?.email, ticket.vendorBusinessName, ticket.landlordVendorName],
      query,
    );
  });
  const filteredFeedback = supportTickets.filter((ticket) => {
    if (feedbackStatusFilter !== "all" && ticket.status !== feedbackStatusFilter) return false;
    return includesQuery([ticket.subject, ticket.description, ticket.userEmail, ticket.userName, ticket.userRole], query);
  });
  const summaryCards = [
    ["Real landlords", landlords.length, "#landlords"],
    ["Real tenants", tenants.length, "#tenants"],
    ["Real vendors", vendorUsers.length, "#vendors"],
    ["Real properties", properties.length, "#properties"],
    ["Open tickets", openCount(tickets), "#tickets"],
    ["Closed tickets", tickets.filter(isClosedTicket).length, "#tickets"],
    ["Feedback/help requests", supportTickets.length, "#feedback"],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">RT</div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Platform Admin</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/hq/support" className="hidden rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200/60 sm:block">
              Support HQ
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400">
                Log Out
              </button>
            </form>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-2 sm:px-6 sm:pb-20 sm:pt-4 lg:px-8">
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">Platform admin dashboard</p>
                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  Full platform overview for safe tester operations
                </h1>
                <p className="mt-4 text-sm leading-6 text-white/72 sm:text-lg sm:leading-8">
                  Admin-only visibility across accounts, properties, repair workflow, vendor compliance, feedback, notifications, and activity.
                </p>
              </div>
              <div className="rounded-[24px] bg-white/8 p-4 sm:rounded-[32px] sm:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-white/55">Admin access</p>
                <p className="mt-3 break-words font-display text-2xl font-semibold">{session.email}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Locked to configured admin email. Normal tenants, landlords, and vendors are redirected away.
                </p>
              </div>
            </div>
          </div>

          {(params.admin || params.adminError) ? (
            <div className={`mt-6 rounded-[24px] border px-5 py-4 text-sm font-semibold ${params.adminError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {params.adminError ? "Admin update failed. Check the selected values and try again." : "Admin update saved."}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map(([title, value, href]) => (
              <a key={title} href={href} className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 transition hover:-translate-y-0.5 sm:rounded-[30px] sm:p-5">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
              </a>
            ))}
          </div>

          <form className="mt-6 rounded-[28px] border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Search and filters</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input name="q" defaultValue={params.q ?? ""} placeholder="Search name, email, address" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
              <select name="role" defaultValue={roleFilter} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300">
                <option value="all">All roles</option>
                <option value="landlord">Landlords</option>
                <option value="tenant">Tenants</option>
                <option value="vendor">Vendors</option>
              </select>
              <select name="ticketStatus" defaultValue={ticketStatusFilter} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300">
                <option value="all">All ticket statuses</option>
                {[...new Set(tickets.map((ticket) => ticket.status))].map((status) => <option key={status}>{status}</option>)}
              </select>
              <select name="vendorVerification" defaultValue={vendorVerificationFilter} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300">
                <option value="all">All vendor verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="incomplete">Incomplete</option>
              </select>
              <select name="feedbackStatus" defaultValue={feedbackStatusFilter} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300">
                <option value="all">All feedback statuses</option>
                {getSupportTicketStatuses().map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <button className="mt-4 min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white sm:w-auto">
              Apply filters
            </button>
          </form>

          <div className="mt-6 grid gap-6">
            <Section id="activity" eyebrow="Recent activity" title="Latest platform events">
              {activityFeed.map((event) => (
                <article key={event.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{event.message}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.type} · {new Date(event.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </Section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section id="landlords" eyebrow="Landlords" title="All landlord accounts">
                {filteredLandlords.map((landlord) => {
                  const ownedProperties = properties.filter((property) => property.landlordId === landlord.id);
                  const landlordTickets = tickets.filter((ticket) => ownedProperties.some((property) => property.id === ticket.propertyId));
                  const activeTenants = ownedProperties.reduce((count, property) => count + getVisibleApprovedTenantsForProperty(property.id).length, 0);
                  const propertyAddresses = ownedProperties.map(getPropertyFullAddress).join("; ");
                  return (
                    <article key={landlord.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-display text-xl font-semibold text-ink">{landlord.name ?? landlord.email}</h3>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Field label="Email" value={landlord.email} />
                        <Field label="Phone" value={null} />
                        <Field label="Created" value={landlord.createdAt} />
                        <Field label="Property address" value={propertyAddresses} />
                        <Field label="Properties" value={ownedProperties.length} />
                        <Field label="Active tenants" value={activeTenants} />
                        <Field label="Open tickets" value={openCount(landlordTickets)} />
                        <Field label="Avg completion" value={averageCompletionLabel(ownedProperties)} />
                      </div>
                      <div className="mt-3"><Pill tone={statusTone("Approved")}>Active</Pill></div>
                    </article>
                  );
                })}
              </Section>

              <Section id="tenants" eyebrow="Tenants" title="All tenant accounts">
                {filteredTenants.map((tenant) => {
                  const property = tenant.propertyId ? findVisiblePropertyById(tenant.propertyId) : null;
                  const tenantTickets = tickets.filter((ticket) => ticket.tenantUserId === tenant.id);
                  return (
                    <article key={tenant.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-display text-xl font-semibold text-ink">{tenant.name ?? tenant.email}</h3>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Field label="Email" value={tenant.email} />
                        <Field label="Phone" value={null} />
                        <Field label="Saved address" value={tenant.savedAddress} />
                        <Field label="Linked property" value={property ? getPropertyDisplayName(property) : null} />
                        <Field label="Open tickets" value={openCount(tenantTickets)} />
                        <Field label="Completed tickets" value={completionCount(tenantTickets)} />
                      </div>
                      <div className="mt-3"><Pill tone={statusTone(tenant.membershipStatus)}>{tenant.membershipStatus ?? "No approval status"}</Pill></div>
                    </article>
                  );
                })}
              </Section>
            </div>

            <Section id="vendors" eyebrow="Vendors" title="Vendor profiles and admin verification controls">
              {filteredVendors.map((vendor) => {
                const profile = vendorProfiles.find((entry) => entry.userId === vendor.id);
                const metrics = getVendorPerformanceMetrics(vendor.id);
                return (
                  <article key={vendor.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink">{profile?.businessName ?? vendor.name ?? vendor.email}</h3>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="Contact" value={profile?.legalContactName ?? vendor.name} />
                          <Field label="Email" value={profile?.email ?? vendor.email} />
                          <Field label="Phone" value={profile?.phone} />
                          <Field label="Service area" value={profile?.serviceArea} />
                          <Field label="Trades" value={profile?.serviceCategories.join(", ")} />
                          <Field label="Jobs accepted" value={metrics.jobsAccepted} />
                          <Field label="Jobs completed" value={metrics.jobsCompleted} />
                          <Field label="Avg arrival" value={metrics.averageArrivalTime} />
                          <Field label="Avg completion" value={metrics.averageCompletionTime} />
                        </div>
                        {profile ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Pill tone={statusTone(profile.identityVerificationStatus)}>{profile.identityVerificationStatus}</Pill>
                            <Pill tone={statusTone(profile.licenseStatus)}>License: {profile.licenseStatus}</Pill>
                            <Pill tone={statusTone(profile.insuranceStatus)}>Insurance: {profile.insuranceStatus}</Pill>
                            <Pill tone={statusTone(profile.backgroundCheckStatus)}>{profile.backgroundCheckStatus}</Pill>
                          </div>
                        ) : null}
                      </div>
                      {profile ? (
                        <form action={updateVendorVerificationAction} className="rounded-[22px] border border-orange-100 bg-white p-4">
                          <input type="hidden" name="vendorUserId" value={vendor.id} />
                          <p className="text-sm font-semibold text-slate-900">Admin verification controls</p>
                          <div className="mt-3 grid gap-3">
                            <select name="identityVerificationStatus" defaultValue={profile.identityVerificationStatus} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                              {verificationOptions.map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <select name="licenseStatus" defaultValue={profile.licenseStatus} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                              {complianceOptions.map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <select name="insuranceStatus" defaultValue={profile.insuranceStatus} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                              {complianceOptions.map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <select name="backgroundCheckStatus" defaultValue={profile.backgroundCheckStatus} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                              {backgroundOptions.map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <button className="min-h-[48px] rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">Save verification</button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </Section>

            <Section id="properties" eyebrow="Properties" title="All properties">
              {filteredProperties.map((property) => {
                const landlord = findVisibleUserById(property.landlordId);
                const propertyTickets = tickets.filter((ticket) => ticket.propertyId === property.id);
                return (
                  <article key={property.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-display text-xl font-semibold text-ink">{getPropertyDisplayName(property)}</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Address" value={getPropertyFullAddress(property)} />
                      <Field label="Landlord" value={landlord?.email} />
                      <Field label="Property type" value={property.propertyType} />
                      <Field label="Unit info" value={propertyTypeRequiresUnit(property.propertyType) ? property.unitNumber ? `Unit ${property.unitNumber}` : "Tenant unit captured during approval" : "Single residence"} />
                      <Field label="Join code" value={property.joinCode} />
                      <Field label="Active tenants" value={getVisibleApprovedTenantsForProperty(property.id).length} />
                      <Field label="Tickets" value={propertyTickets.length} />
                      <Field label="Avg completion" value={property.averageCompletionTime} />
                      <Field label="History status" value={property.repairHistorySummary} />
                    </div>
                  </article>
                );
              })}
            </Section>

            <Section id="tickets" eyebrow="Tickets" title="All repair tickets">
              {filteredTickets.map((ticket) => {
                const property = findVisiblePropertyById(ticket.propertyId);
                const tenant = findVisibleUserById(ticket.tenantUserId);
                const landlord = getTicketLandlord(ticket, findVisiblePropertyById, findVisibleUserById);
                return (
                  <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-display text-xl font-semibold text-ink">{ticket.issueTitle}</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Property" value={property ? getPropertyServiceAddress(property, ticket.unitNumber) : ticket.propertyId} />
                      <Field label="Tenant" value={tenant?.email ?? ticket.tenantEmail} />
                      <Field label="Landlord" value={landlord?.email} />
                      <Field label="Vendor assigned" value={ticket.vendorBusinessName ?? ticket.landlordVendorName} />
                      <Field label="Created" value={ticket.submittedAt} />
                      <Field label="Completed" value={ticket.completedAt} />
                      <Field label="Tenant confirmation" value={ticket.tenantConfirmationStatus} />
                      <Field label="Attachment" value={ticket.attachment ? ticket.attachment.fileName : "No attachment"} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone={statusTone(ticket.status)}>{ticket.status}</Pill>
                      <Pill tone={ticket.urgent ? "border-rose-200 bg-rose-50 text-rose-700" : undefined}>{ticket.urgent ? "Urgent" : "Standard"}</Pill>
                    </div>
                  </article>
                );
              })}
            </Section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section id="vendor-requests" eyebrow="Vendor requests" title="Vendor interest and selections">
                {vendorRequests.map(({ ticket, request, property }) => (
                  <article key={`${ticket.id}-${request.vendorUserId}`} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{request.vendorBusinessName}</p>
                    <p className="mt-1 text-sm text-slate-500">{ticket.issueTitle} · {property ? getPropertyDisplayName(property) : ticket.propertyId}</p>
                    <div className="mt-3"><Pill tone={statusTone(request.status)}>{request.status}</Pill></div>
                  </article>
                ))}
              </Section>

              <Section id="approvals" eyebrow="Approvals" title="Repair approval requests">
                {approvals.map((ticket) => (
                  <article key={`approval-${ticket.id}`} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{ticket.repairApprovalRequest?.summary ?? ticket.issueTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{ticket.issueTitle}</p>
                    <div className="mt-3"><Pill tone={statusTone(ticket.repairApprovalRequest?.status)}>{ticket.repairApprovalRequest?.status ?? "No status"}</Pill></div>
                  </article>
                ))}
              </Section>
            </div>

            <Section id="feedback" eyebrow="Feedback and help" title="Feedback / Support Requests">
              {filteredFeedback.map((ticket: SupportTicket) => (
                <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink">{ticket.subject}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Field label="User" value={ticket.userName ?? ticket.userEmail} />
                        <Field label="Role" value={ticket.userRole} />
                        <Field label="Email" value={ticket.userEmail} />
                        <Field label="Created" value={ticket.createdAt} />
                        <Field label="Admin notes" value={ticket.adminNotes} />
                      </div>
                      <div className="mt-3"><Pill tone={statusTone(ticket.status)}>{ticket.status}</Pill></div>
                    </div>
                    <form action={updateFeedbackStatusAction} className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <p className="text-sm font-semibold text-slate-900">Admin handling</p>
                      <select name="status" defaultValue={ticket.status} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                        {getSupportTicketStatuses().map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <textarea name="adminNotes" defaultValue={ticket.adminNotes} rows={3} placeholder="Admin notes" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button className="min-h-[48px] rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">Save</button>
                        <button formAction={markFeedbackResolvedAction} className="min-h-[48px] rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Mark resolved</button>
                      </div>
                    </form>
                  </div>
                </article>
              ))}
            </Section>

            <Section id="notifications" eyebrow="Notifications" title="Internal notification records">
              {notifications.slice(0, 10).map((notification) => (
                <article key={notification.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{notification.message}</p>
                  <p className="mt-1 text-sm text-slate-500">{notification.role ?? "platform"} · {new Date(notification.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </Section>
          </div>
        </section>
      </div>
    </main>
  );
}
