import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { getSession, loginAction } from "@/app/actions/auth";
import {
  getDashboardPath,
  isAppRole,
  roleAccentClasses,
  roleDescriptions,
  roleLabels,
  userRoles,
  type AppRole,
  type UserRole,
} from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{ role?: string; error?: string }>;
};

function LoginForm({
  selectedRole,
  error,
}: {
  selectedRole: AppRole;
  error?: string;
}) {
  const errorMessage =
    error === "invalid-credentials"
      ? "We couldn't match that email, password, and role combination."
      : error === "missing-fields"
        ? "Enter an email, password, and role to continue."
        : null;

  function getRoleCardClass(role: UserRole) {
    if (selectedRole === role) {
      return "border-ink bg-ink text-white shadow-lg shadow-slate-200/70 ring-2 ring-ink";
    }

    return `border-slate-200 bg-gradient-to-b ${roleAccentClasses[role]} text-slate-800 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70`;
  }

  return (
    <>
      <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
        Secure login
      </div>
      <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink">
        Access your RentTruth workspace
      </h2>
      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
        Sign in to manage maintenance tickets, monitor trust signals, and keep repairs moving.
      </p>

      {selectedRole === "tenant" ? (
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800">
          Tenants log in first, then join a property if they are not linked yet. Pending approvals can still sign in, but tickets and landlord messaging unlock only after approval.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {userRoles.map((role) => (
          <Link
            key={role}
            href={`/login?role=${role}`}
            className={`min-w-0 rounded-[24px] border p-4 text-left transition ${getRoleCardClass(role)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{roleLabels[role]}</p>
                <p className={`mt-2 text-sm leading-5 ${selectedRole === role ? "text-white/70" : "text-slate-600"}`}>
                  {roleDescriptions[role]}
                </p>
              </div>
              <span
                className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                  selectedRole === role ? "border-white bg-white" : "border-slate-300 bg-white/80"
                }`}
              />
            </div>
            <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.14em] ${selectedRole === role ? "text-white/60" : "text-slate-500"}`}>
              Continue as {roleLabels[role].toLowerCase()}
            </p>
          </Link>
        ))}
      </div>

      {selectedRole === "admin" ? (
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-7 text-violet-800">
          Internal admin access is enabled for the RentTruth HQ workspace.
        </div>
      ) : null}

      <form action={loginAction} className="mt-8 space-y-5">
        <input type="hidden" name="role" value={selectedRole} />

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            placeholder="name@company.com"
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <SubmitButton
          label="Log In"
          pendingLabel="Logging In..."
          className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>
    </>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getDashboardPath(session.role));
  }

  const params = (await searchParams) ?? {};
  const selectedRole = isAppRole(params.role ?? "")
    ? (params.role as AppRole)
    : "tenant";

  return (
    <AuthShell
      eyebrow="Login"
      title="Modern access for every role in the rental repair chain"
      description="Tenants, landlords, and vendors all enter the same premium platform with tools tailored to their side of the workflow."
      sideTitle="Everything in one place"
      sideDescription="Move from intake to resolution with shared visibility, role-aware workflows, and trust metrics built into every handoff."
      sideStats={[
        { value: "3", label: "workspaces" },
        { value: "1", label: "repair timeline" },
        { value: "Live", label: "status visibility" },
      ]}
      sideHighlights={[
        {
          title: "Tenants see what happens next",
          description: "Join a property, submit repair tickets, and confirm whether the work actually fixed the issue.",
        },
        {
          title: "Landlords get an operations view",
          description: "Approve residents, manage open tickets, compare vendors, and keep access codes easy to find.",
        },
        {
          title: "Vendors focus on local jobs",
          description: "Review eligible work, request assignment, and track arrival and completion milestones.",
        },
      ]}
      sideExample={{
        eyebrow: "Login snapshot",
        title: "One account, role-specific dashboard",
        items: [
          { value: "Tickets", label: "repair workflow" },
          { value: "Codes", label: "property access" },
          { value: "Vendors", label: "assignment flow" },
          { value: "Admin", label: "platform visibility" },
        ],
        note: "Admin login still works from this same form when the configured admin email is used.",
      }}
      sideCaption="The login experience mirrors the live marketplace: renters, landlords, vendors, and admin each land in the workspace built for their role."
      footerText="Need an account?"
      footerLinkLabel="Create one"
      footerLinkHref="/signup"
    >
      <LoginForm selectedRole={selectedRole} error={params.error} />
    </AuthShell>
  );
}
