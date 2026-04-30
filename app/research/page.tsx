import Link from "next/link";
import {
  getPropertyDisplayName,
  getPropertyFullAddress,
  getPropertyTrustSignal,
  hydratePersistentStore,
  searchPropertiesByAddress,
} from "@/lib/demo-data";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ address?: string }>;
}) {
  await hydratePersistentStore();
  const params = (await searchParams) ?? {};
  const query = params.address?.trim() ?? "";
  const matches = searchPropertiesByAddress(query);

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.28),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(255,138,101,0.20),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Public property research</p>
            </div>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:px-5"
          >
            Active Tenant Login
          </Link>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-2 sm:px-6 sm:pb-20 sm:pt-4 lg:px-8">
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
              Pre-tenant public research
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Search a property by address before you rent
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-lg sm:leading-8">
              Explore trust scores, maintenance trends, and repair responsiveness without creating an account.
            </p>

            <form className="mt-6 grid gap-3 rounded-[24px] bg-white/8 p-4 sm:mt-8 sm:gap-4 sm:rounded-[28px] sm:p-5 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                name="address"
                defaultValue={query}
                placeholder="Search by street address, city, or ZIP"
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan focus:ring-4 focus:ring-cyan/20"
              />
              <button
                type="submit"
                className="min-h-[50px] rounded-full bg-cyan px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Search Property
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5">
            {matches.map((property) => {
                const trustSignal = getPropertyTrustSignal(property);

                return (
                  <article
                    key={property.id}
                    className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/70 backdrop-blur sm:rounded-[30px] sm:p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {getPropertyDisplayName(property)}
                        </p>
                        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                          {getPropertyFullAddress(property)}
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Trust score {trustSignal.landlordTrustScore}
                          </span>
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                            Confidence {trustSignal.confidenceLevel}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Avg. completion {property.averageCompletionTime}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            On-time {property.ticketsCompletedOnTimeRate}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          {trustSignal.trustTransparencyMessage}
                        </p>
                      </div>

                      <Link
                        href={`/properties/${property.id}`}
                        className="min-h-[48px] rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        View Public Profile
                      </Link>
                    </div>
                  </article>
                );
              })}

            {matches.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500 sm:rounded-[30px] sm:p-8">
                No properties matched that address yet. Try a different street, city, or ZIP search.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
