import Link from "next/link";

const audiences = [
  {
    title: "For Renters",
    description:
      "Research a property before you sign, then join privately as an active tenant once you move in.",
    accent: "from-sky-400/20 via-white to-white",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    dotClass: "bg-sky-500",
    points: ["Public property research", "Join by code and unit", "Private repair workflow"],
  },
  {
    title: "For Landlords",
    description:
      "Organize requests, monitor repair performance, and turn reliable operations into public trust.",
    accent: "from-emerald-400/20 via-white to-white",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
    points: ["Centralized ticket queue", "Completion performance analytics", "Trust score visibility"],
  },
  {
    title: "For Vendors",
    description:
      "Accept qualified repair jobs, fill schedules faster, and build a reputation for dependable service.",
    accent: "from-orange-200/55 via-orange-50/30 to-white",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-800",
    dotClass: "bg-orange-300",
    points: ["Qualified job marketplace", "Streamlined dispatch", "Proof of repair speed"],
  },
];

const features = [
  "Submit repair tickets",
  "Track completion performance",
  "Verified landlord reputation",
  "Vendor job marketplace",
];

const stats = [
  { value: "19.4h", label: "average completion time benchmark" },
  { value: "92%", label: "tickets completed on time across top properties" },
  { value: "3-sided", label: "platform for renters, landlords, and vendors" },
  { value: "100%", label: "transparent repair accountability" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.28),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(255,138,101,0.22),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-grid bg-[size:42px_42px] opacity-40" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">
                RentTruth
              </p>
              <p className="text-sm text-slate-500">Trust infrastructure for rentals</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 rounded-full border border-white/60 bg-white/75 px-6 py-3 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/60 backdrop-blur md:flex">
            <Link href="/research" className="transition hover:text-ink">
              Research Properties
            </Link>
            <a href="#audiences" className="transition hover:text-ink">
              Solutions
            </a>
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#trust" className="transition hover:text-ink">
              Trust Scores
            </a>
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Log In
          </Link>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-24 lg:pt-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm backdrop-blur">
              Repair transparency for the modern rental market
            </div>

            <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:mt-8 sm:text-6xl lg:text-7xl">
              Truth for Renters. Tools for Landlords. Jobs for Vendors.
            </h1>

            <p className="mt-4 max-w-xl whitespace-pre-line text-base leading-7 text-slate-600 sm:mt-6 sm:text-xl sm:leading-8">
              {"Track repairs, build trust, and move faster.\nOne platform for renters, landlords, and vendors."}
            </p>

            <div id="cta" className="mt-7 grid gap-3 sm:mt-10 sm:flex sm:flex-row sm:flex-wrap">
              <Link
                href="/research"
                className="min-h-[50px] rounded-full bg-ink px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Research a Property
              </Link>
              <Link
                href="/signup?role=tenant"
                className="min-h-[50px] rounded-full border border-sky-200 bg-sky-100 px-6 py-3.5 text-center text-sm font-semibold text-sky-950 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-200"
              >
                Join as Tenant
              </Link>
              <Link
                href="/signup?role=landlord"
                className="min-h-[50px] rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3.5 text-center text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100"
              >
                Join as Landlord
              </Link>
              <Link
                href="/signup?role=vendor"
                className="min-h-[50px] rounded-full border border-orange-200 bg-orange-100 px-6 py-3.5 text-center text-sm font-semibold text-orange-950 transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-200"
              >
                Join as Vendor
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-4 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:rounded-3xl sm:p-5"
                >
                  <p className="font-display text-2xl font-semibold text-ink sm:text-3xl">{stat.value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 hidden h-28 w-28 rounded-full bg-cyan/60 blur-3xl lg:block" />
            <div className="absolute -right-10 bottom-8 hidden h-36 w-36 rounded-full bg-coral/30 blur-3xl lg:block" />

            <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/85 p-4 shadow-glow backdrop-blur sm:rounded-[32px] sm:p-6">
              <div className="rounded-[24px] bg-ink p-4 text-white sm:rounded-[28px] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-white/60">
                      Live trust dashboard
                    </p>
                    <h2 className="mt-3 font-display text-2xl font-semibold">
                      Repair operations people can actually trust
                    </h2>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-sm text-cyan">
                    Beta
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                  <div className="rounded-2xl bg-white/8 p-4 sm:rounded-3xl sm:p-5">
                    <p className="text-sm text-white/60">Open maintenance tickets</p>
                    <p className="mt-3 font-display text-3xl font-semibold sm:text-4xl">184</p>
                    <p className="mt-2 text-sm text-emerald-300">+18% week over week</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4 sm:rounded-3xl sm:p-5">
                    <p className="text-sm text-white/60">Public landlord trust score</p>
                    <p className="mt-3 font-display text-3xl font-semibold sm:text-4xl">91</p>
                    <p className="mt-2 text-sm text-cyan">Driven by reliable repair completion</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white/8 p-5">
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Average completion time</span>
                    <span>19.4h</span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-cyan via-sky-400 to-emerald-400" />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/70">
                    92% of tickets finish on time, and urgent repairs close in an average of 6.1 hours across leading properties on RentTruth.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Renter experience</p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    Ticket updates without chasing anyone down
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Vendor pipeline</p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    New repair work matched to service quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="audiences" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Built for every side of the repair workflow
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            One platform for accountability, coordination, and trust
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-3">
          {audiences.map((audience) => (
            <article
              key={audience.title}
              className={`rounded-[24px] border border-slate-200 bg-gradient-to-b ${audience.accent} p-5 shadow-lg shadow-slate-200/70 sm:rounded-[30px] sm:p-7`}
            >
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${audience.badgeClass}`}>
                {audience.title}
              </div>
              <p className="mt-5 text-lg leading-8 text-slate-600">{audience.description}</p>
              <div className="mt-8 space-y-3">
                {audience.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full ${audience.dotClass}`} />
                    <p className="text-sm font-medium text-slate-700">{point}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white/80">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Core product features
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              The maintenance operating system rental teams have been missing
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              RentTruth combines repair workflow tooling with public accountability, helping teams resolve issues faster and earn confidence over time.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-slate-200/70 sm:rounded-[28px] sm:p-6"
              >
                <p className="text-sm font-semibold text-slate-400">0{index + 1}</p>
                <h3 className="mt-4 font-display text-2xl font-semibold text-ink">{feature}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature === "Submit repair tickets" &&
                    "Capture maintenance requests quickly with the right context, urgency, and property details from day one."}
                  {feature === "Track completion performance" &&
                    "Measure average completion time, on-time finish rate, and urgent repair closure speed so public trust reflects the outcomes renters actually care about."}
                  {feature === "Verified landlord reputation" &&
                    "Show performance-backed landlord credibility built on actual maintenance outcomes instead of marketing claims."}
                  {feature === "Vendor job marketplace" &&
                    "Connect reliable vendors with active repair demand and make fulfillment speed a competitive advantage."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-[28px] bg-ink px-5 py-8 text-white shadow-glow sm:rounded-[36px] sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
                Public trust scores
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Reputation earned through repair performance
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Repair follow-through becomes measurable proof. RentTruth helps great operators stand out and gives renters better signals before they sign.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-2xl bg-white/10 p-3 sm:rounded-3xl sm:p-5">
                <p className="text-sm text-white/50">Score inputs</p>
                <p className="mt-2 font-display text-lg font-semibold sm:text-3xl">Completion</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 sm:rounded-3xl sm:p-5">
                <p className="text-sm text-white/50">Score inputs</p>
                <p className="mt-2 font-display text-lg font-semibold sm:text-3xl">On-time</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 sm:rounded-3xl sm:p-5">
                <p className="text-sm text-white/50">Score inputs</p>
                <p className="mt-2 font-display text-lg font-semibold sm:text-3xl">Urgent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
