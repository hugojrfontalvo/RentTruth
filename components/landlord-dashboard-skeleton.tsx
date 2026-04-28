type LandlordDashboardSkeletonProps = {
  title?: string;
};

export function LandlordDashboardSkeleton({
  title = "Loading your properties...",
}: LandlordDashboardSkeletonProps) {
  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(46,204,113,0.16),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef6ff_66%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-grid bg-[size:42px_42px] opacity-30" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Landlord operations hub</p>
            </div>
          </div>
          <div className="h-11 w-24 rounded-full bg-white/80 shadow-lg shadow-slate-200/60" />
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-7 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="h-3 w-36 rounded-full bg-cyan/70" />
                <div className="mt-5 h-10 w-4/5 rounded-full bg-white/16 sm:h-14" />
                <div className="mt-4 h-4 w-full max-w-xl rounded-full bg-white/12" />
                <div className="mt-3 h-4 w-3/4 max-w-lg rounded-full bg-white/12" />
                <p className="mt-5 text-sm font-medium text-white/72">{title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/8 p-4 sm:rounded-3xl">
                    <div className="h-3 w-20 rounded-full bg-white/14" />
                    <div className="mt-4 h-8 w-12 rounded-full bg-white/18" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
            <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="h-3 w-28 rounded-full bg-slate-100" />
                  <div className="mt-4 h-7 w-56 rounded-full bg-slate-100" />
                </div>
                <div className="h-11 w-28 rounded-full bg-slate-100" />
              </div>

              <div className="mt-5 grid gap-3">
                {[0, 1].map((ticket) => (
                  <div
                    key={ticket}
                    className="rounded-[24px] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="h-4 w-2/3 rounded-full bg-white" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <div className="h-7 w-20 rounded-full bg-white" />
                      <div className="h-7 w-24 rounded-full bg-white" />
                      <div className="h-7 w-28 rounded-full bg-white" />
                    </div>
                    <div className="mt-4 h-12 rounded-2xl bg-white" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/70 sm:p-6">
              <div className="h-3 w-32 rounded-full bg-slate-100" />
              <div className="mt-4 h-7 w-44 rounded-full bg-slate-100" />
              <div className="mt-5 grid gap-3">
                {[0, 1, 2].map((card) => (
                  <div key={card} className="h-16 rounded-2xl bg-slate-50" />
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
