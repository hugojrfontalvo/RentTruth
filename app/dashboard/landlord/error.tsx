"use client";

export default function LandlordDashboardError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-8 text-slate-900">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            console.error("landlord dashboard client error boundary", {
              message: ${JSON.stringify(error.message)},
              digest: ${JSON.stringify(error.digest ?? null)}
            });
          `,
        }}
      />
      <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          RentTruth
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
          Dashboard render interrupted
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The landlord session loaded, but the mobile dashboard hit a client render issue. The
          browser console now includes the exact error details.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          This screen should not appear during a normal landlord login. Check the console log named
          "landlord dashboard client error boundary" for the thrown client error.
        </div>
      </div>
    </main>
  );
}
