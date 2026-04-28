type PostAuthBridgeShellProps = {
  role: "tenant" | "landlord";
  targetPath: string;
  sessionConfirmed: boolean;
  retryPath: string;
};

export function PostAuthBridgeShell({
  role,
  targetPath,
  sessionConfirmed,
  retryPath,
}: PostAuthBridgeShellProps) {
  const isTenant = role === "tenant";
  const title = sessionConfirmed
    ? isTenant
      ? "Opening your tenant dashboard..."
      : "Opening your landlord dashboard..."
    : "Confirming your session...";
  const description = sessionConfirmed
    ? "Your session is saved. RentTruth is opening your dashboard now."
    : "RentTruth is waiting for Safari to expose the saved session cookie. This should continue automatically.";
  const nextPath = sessionConfirmed ? targetPath : retryPath;
  const refreshDelay = sessionConfirmed ? "0" : "1";

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-6 text-slate-900">
      <meta httpEquiv="refresh" content={`${refreshDelay};url=${nextPath}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            console.log(${JSON.stringify(`${role} post-auth bridge mounted`)});
            console.log(${JSON.stringify(
              sessionConfirmed
                ? `${role} post-auth session confirmed`
                : `${role} post-auth waiting for session`,
            )});
            window.setTimeout(function () {
              console.log(${JSON.stringify(`${role} post-auth redirect starting`)});
              window.location.replace(${JSON.stringify(nextPath)});
            }, ${sessionConfirmed ? 0 : 1000});
          `,
        }}
      />
      <section
        className={`mx-auto max-w-3xl rounded-[28px] p-5 shadow-glow sm:rounded-[36px] sm:p-7 ${
          isTenant ? "bg-ink text-white" : "border border-slate-200 bg-white text-slate-900"
        }`}
      >
        <p
          className={`text-sm font-semibold uppercase tracking-[0.24em] ${
            isTenant ? "text-cyan" : "text-sky-700"
          }`}
        >
          {isTenant ? "Tenant dashboard" : "Landlord dashboard"}
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p
          className={`mt-3 text-sm leading-6 sm:text-base sm:leading-7 ${
            isTenant ? "text-white/72" : "text-slate-600"
          }`}
        >
          {description}
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
