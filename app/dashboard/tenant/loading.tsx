export default function TenantDashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-6 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
          Tenant dashboard
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          Loading your workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
          RentTruth is getting your account, saved address, membership, and ticket data ready.
        </p>
      </section>

      <section className="mx-auto mt-6 max-w-3xl rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 sm:rounded-[32px] sm:p-7">
        <div className="h-4 w-32 rounded-full bg-slate-100" />
        <div className="mt-5 h-8 w-3/4 rounded-full bg-slate-100" />
        <div className="mt-4 space-y-3">
          <div className="h-12 rounded-2xl bg-slate-100" />
          <div className="h-12 rounded-2xl bg-slate-100" />
          <div className="h-12 rounded-2xl bg-slate-100" />
        </div>
      </section>
    </main>
  );
}
