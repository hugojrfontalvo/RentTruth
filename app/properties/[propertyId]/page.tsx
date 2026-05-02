import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicPropertyProfile, hydratePersistentStore } from "@/lib/demo-data";

export default async function PropertyProfilePage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  await hydratePersistentStore();
  const { propertyId } = await params;
  const profile = getPublicPropertyProfile(propertyId);

  if (!profile) {
    notFound();
  }

  const totalTrend = profile.ticketTrends.resolved + profile.ticketTrends.unresolved;
  const resolvedWidth = totalTrend === 0 ? 0 : (profile.ticketTrends.resolved / totalTrend) * 100;

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.28),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(255,138,101,0.20),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Public property profile</p>
            </div>
          </Link>

          <Link
            href="/research"
            className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:px-5"
          >
            Back to Search
          </Link>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-2 sm:px-6 sm:pb-20 sm:pt-4 lg:px-8">
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
              Public trust profile
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              {profile.fullAddress}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-lg sm:leading-8">
              Use this public profile to research maintenance reliability before joining as an active tenant.
            </p>
          </div>

          {profile.hasVerifiedMaintenanceHistory ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4">
              <article className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 sm:rounded-[30px] sm:p-6">
                <p className="text-sm font-medium text-slate-500">Trust Score</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{profile.landlordTrustScore}</p>
              </article>
              <article className="rounded-[22px] border border-sky-200 bg-sky-50/90 p-4 shadow-lg shadow-slate-200/70 sm:rounded-[30px] sm:p-6">
                <p className="text-sm font-medium text-sky-700">Confidence Level</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{profile.confidenceLevel}</p>
              </article>
              <article className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 sm:rounded-[30px] sm:p-6">
                <p className="text-sm font-medium text-slate-500">Average completion time</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{profile.averageCompletionTime}</p>
              </article>
              <article className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 sm:rounded-[30px] sm:p-6">
                <p className="text-sm font-medium text-slate-500">Completed on time</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{profile.ticketsCompletedOnTimeRate}</p>
              </article>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/70 sm:mt-8 sm:rounded-[30px] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Maintenance history
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                No verified maintenance history yet.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                RentTruth scores and completion metrics will appear after this property has real completed repair tickets.
              </p>
            </div>
          )}

          <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:mt-8 sm:rounded-[32px] sm:p-7">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Trust confidence
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Independent tenant activity is weighted more heavily
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  {profile.trustTransparencyMessage} Confirmations from unverified accounts have low impact, and confirmations from accounts flagged as linked to the landlord have minimal impact.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Weighted confirmations</p>
                <p className="mt-2 font-display text-4xl font-semibold text-ink">
                  {profile.weightedConfirmationCount}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {profile.independentTenantCount} independent tenants · {profile.verifiedConfirmationCount} verified confirmations
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Address
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {profile.displayName}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{profile.fullAddress}</p>
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Repair history summary
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Maintenance performance snapshot
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{profile.repairHistorySummary}</p>
              {profile.hasVerifiedMaintenanceHistory ? (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                  Average first response currently sits at {profile.averageRepairResponseTime}, but public trust on RentTruth is weighted more heavily toward completion speed and on-time repair follow-through.
                </div>
              ) : (
                <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                  Not enough RentTruth data yet. Completion, response, and on-time metrics will appear after verified repair history exists.
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[26px] border border-slate-200 bg-gradient-to-b from-sky-50 via-white to-white p-5 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Common issue categories
              </p>
              <div className="mt-6 grid gap-4">
                {profile.commonIssueCategories.map((item) => (
                  <div key={item.category} className="rounded-[22px] border border-white/80 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-display text-xl font-semibold text-ink sm:text-2xl">{item.category}</p>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {item.count} logged
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:rounded-[32px] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Resolved vs unresolved ticket trends
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Repair follow-through over time
              </h2>
              <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan"
                  style={{ width: `${resolvedWidth}%` }}
                />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-medium text-emerald-800">Resolved</p>
                  <p className="mt-2 font-display text-4xl font-semibold text-emerald-900">
                    {profile.ticketTrends.resolved}
                  </p>
                </div>
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-medium text-amber-800">Unresolved</p>
                  <p className="mt-2 font-display text-4xl font-semibold text-amber-900">
                    {profile.ticketTrends.unresolved}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
