import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sideTitle: string;
  sideDescription: string;
  sideStats: Array<{ label: string; value: string }>;
  sideHighlights?: Array<{ title: string; description: string }>;
  sideCaption?: string;
  sideExample?: {
    eyebrow: string;
    title: string;
    items: Array<{ label: string; value: string }>;
    note?: string;
  };
  children: React.ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  sideTitle,
  sideDescription,
  sideStats,
  sideHighlights = [],
  sideCaption,
  sideExample,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.28),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(255,138,101,0.20),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-grid bg-[size:42px_42px] opacity-40" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">
                RentTruth
              </p>
              <p className="text-sm text-slate-500">Trust infrastructure for rentals</p>
            </div>
          </Link>

          <div className="hidden rounded-full border border-white/60 bg-white/75 px-5 py-3 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/60 backdrop-blur md:block">
            Secure access for tenants, landlords, and vendors
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-12 pt-2 sm:gap-8 sm:px-6 sm:pb-16 sm:pt-4 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-24 lg:pt-8">
          <div className="order-2 flex flex-col justify-between rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-7 lg:order-1 lg:p-9">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
                {eyebrow}
              </p>
              <h1 className="mt-4 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/72">
                {description}
              </p>
            </div>

            <div className="mt-6 rounded-[24px] bg-white/8 p-4 sm:mt-8 sm:rounded-[28px] sm:p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan">
                {sideTitle}
              </p>
              <p className="mt-3 text-base leading-7 text-white/72">{sideDescription}</p>

              {sideHighlights.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:mt-6">
                  {sideHighlights.map((highlight) => (
                    <article
                      key={highlight.title}
                      className="rounded-[20px] border border-white/10 bg-white/8 p-3.5 sm:rounded-[24px] sm:p-4"
                    >
                      <p className="text-sm font-semibold text-white">{highlight.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/65">
                        {highlight.description}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
                {sideStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/8 p-3 sm:rounded-3xl sm:p-4">
                    <p className="font-display text-xl font-semibold sm:text-3xl">{stat.value}</p>
                    <p className="mt-2 text-[11px] leading-4 text-white/55 sm:text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              {sideExample ? (
                <div className="mt-5 rounded-[22px] border border-white/12 bg-gradient-to-br from-white/12 to-white/6 p-4 sm:mt-6 sm:rounded-[24px] sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                    {sideExample.eyebrow}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white">
                    {sideExample.title}
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                    {sideExample.items.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[16px] border border-white/10 bg-black/10 p-3 sm:rounded-[18px] sm:p-4"
                      >
                        <p className="font-display text-lg font-semibold text-white sm:text-2xl">{item.value}</p>
                        <p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {sideExample.note ? (
                    <p className="mt-4 text-sm leading-6 text-white/65">{sideExample.note}</p>
                  ) : null}
                </div>
              ) : null}

              {sideCaption ? (
                <p className="mt-5 text-sm leading-6 text-white/55">{sideCaption}</p>
              ) : null}
            </div>
          </div>

          <div className="order-1 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-glow backdrop-blur sm:rounded-[36px] sm:p-8 lg:order-2 lg:p-10">
            {children}
            <p className="mt-8 text-center text-sm text-slate-500">
              {footerText}{" "}
              <Link href={footerLinkHref} className="font-semibold text-ink transition hover:text-slate-700">
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
