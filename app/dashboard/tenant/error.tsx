"use client";

export default function TenantDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-6 text-slate-900">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            console.error("tenant dashboard client error boundary", {
              message: ${JSON.stringify(error.message)},
              digest: ${JSON.stringify(error.digest ?? null)}
            });
          `,
        }}
      />
      <section className="mx-auto max-w-3xl rounded-[28px] bg-ink p-5 text-white shadow-glow sm:rounded-[36px] sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
          RentTruth
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          Loading your dashboard…
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
          RentTruth hit a temporary dashboard load issue. Try again without refreshing the whole
          browser.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-[48px] rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          Retry dashboard
        </button>
      </section>
    </main>
  );
}
