import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { getSession, signupAction } from "@/app/actions/auth";
import {
  getDashboardPath,
  roleAccentClasses,
  roleDescriptions,
  roleLabels,
  userRoles,
  type UserRole,
} from "@/lib/auth";

type SignupPageProps = {
  searchParams?: Promise<{ role?: string; error?: string }>;
};

const signupRoleContent: Record<
  UserRole,
  {
    title: string;
    description: string;
    sideTitle: string;
    sideDescription: string;
    highlights: Array<{ title: string; description: string }>;
    stats: Array<{ value: string; label: string }>;
    caption: string;
    example?: {
      eyebrow: string;
      title: string;
      items: Array<{ label: string; value: string }>;
      note?: string;
    };
  }
> = {
  tenant: {
    title: "Know the repair story before and after you move in",
    description:
      "Create your tenant account, save your address, and move into a workflow built around visibility, completion quality, and calmer maintenance follow-up.",
    sideTitle: "Why tenants use RentTruth",
    sideDescription:
      "RentTruth helps renters understand how a repair actually moves from problem to resolution, with less chasing, clearer status updates, and better visibility into who is doing the work.",
    highlights: [
      {
        title: "Track repairs without chasing your landlord",
        description: "Follow the ticket from submission through vendor arrival, completion, and final confirmation.",
      },
      {
        title: "Know who is entering your home",
        description: "See which vendor was assigned and when they arrive, instead of being left guessing.",
      },
      {
        title: "See how fast issues actually get completed",
        description: "Completion time and repair history stay visible, so the workflow feels accountable and real.",
      },
    ],
    stats: [
      { value: "87%", label: "tickets completed on time" },
      { value: "142", label: "active maintenance tickets" },
      { value: "Live", label: "vendor arrival visibility" },
    ],
    example: {
      eyebrow: "Closed ticket example",
      title: "AC not cooling",
      items: [
        { value: "Completed", label: "status" },
        { value: "2.4 days", label: "time to completion" },
        { value: "Atlas Service Group", label: "vendor" },
        { value: "Fixed", label: "tenant confirmation" },
      ],
      note: "A real ticket timeline helps tenants picture what calm, visible repair follow-through looks like in practice.",
    },
    caption: "Built to reduce renter guesswork, follow-up friction, and surprise handoffs.",
  },
  landlord: {
    title: "Rent faster by proving your property is actually well maintained",
    description:
      "Use completion-time performance, visible repair follow-through, and cleaner vendor decisions to reduce vacancy and give future tenants a reason to choose your property faster.",
    sideTitle: "Why landlords use RentTruth",
    sideDescription:
      "High-performing maintenance becomes a leasing advantage. Faster repairs and stronger transparency help properties look more trustworthy, stay occupied, and lose less income to vacancy.",
    highlights: [
      {
        title: "Rent your property faster with visible maintenance performance",
        description: "Vacant units cost money. Strong repair follow-through helps future tenants trust the property sooner and supports faster occupancy.",
      },
      {
        title: "Manage tickets, approvals, and vendors in one place",
        description: "Run the repair workflow from intake to completion without bouncing between scattered messages and spreadsheets.",
      },
      {
        title: "Compare vendors and reduce repeat repair issues",
        description: "Use performance, pricing, and ticket history to make better decisions and fix recurring problems more cleanly.",
      },
      {
        title: "Build trust with current and future tenants",
        description: "Turn repair completion data into a visible signal that your property is run with more accountability than nearby options.",
      },
    ],
    stats: [
      { value: "3.6d", label: "avg. completion time" },
      { value: "92%", label: "tickets completed on time" },
      { value: "Lower", label: "vacancy risk from poor maintenance" },
    ],
    example: {
      eyebrow: "Example property signal",
      title: "Harbor House",
      items: [
        { value: "2.9d", label: "average completion time" },
        { value: "94%", label: "tickets completed on time" },
        { value: "\"Repairs felt organized\"", label: "tenant feedback" },
      ],
      note: "A cleaner repair record becomes a trust signal for future tenants and helps protect occupancy.",
    },
    caption: "Less vacancy means less lost income. RentTruth turns maintenance follow-through into a visible leasing advantage.",
  },
  vendor: {
    title: "Earn more local work by showing performance landlords can trust",
    description:
      "Build a local job pipeline without heavy marketing spend. Show response speed, completion history, and pricing clarity so strong field work turns into repeat income.",
    sideTitle: "Why vendors use RentTruth",
    sideDescription:
      "RentTruth is built for local tradespeople who want to earn more through reliability, tighter routing, and repeat landlord relationships instead of constant lead chasing.",
    highlights: [
      {
        title: "Earn more without buying leads",
        description: "Get local jobs matched to your service area instead of burning margin on marketing spend.",
      },
      {
        title: "Win work based on performance and reliability",
        description: "Landlords can compare your completion rate, arrival speed, and approval clarity directly.",
      },
      {
        title: "Build repeat relationships and stay efficient",
        description: "Local routing and structured pricing help you increase income by staying close, clear, and dependable.",
      },
    ],
    stats: [
      { value: "24", label: "open local vendor requests" },
      { value: "4.7h", label: "avg. arrival benchmark" },
      { value: "Repeat", label: "landlord relationship potential" },
    ],
    example: {
      eyebrow: "Example earnings view",
      title: "Brightline Repairs",
      items: [
        { value: "18", label: "jobs completed this month" },
        { value: "91%", label: "completion rate" },
        { value: "3", label: "repeat landlord accounts" },
      ],
      note: "Strong local performance creates a more durable income stream than one-off lead buying.",
    },
    caption: "The goal is simple: more local jobs, less wasted travel, and more repeat work from landlords who trust your results.",
  },
};

function SignupForm({
  selectedRole,
  error,
}: {
  selectedRole: UserRole;
  error?: string;
}) {
  const errorMessage =
    error === "email-taken"
      ? "That email is already in use. Try logging in instead."
      : error === "missing-fields"
        ? "Enter the required fields to create an account."
        : null;

  return (
    <>
      <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
        Create your account
      </div>
      <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink">
        Pick your role and join RentTruth
      </h2>
      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
        Start with the workflow that fits your side of the platform and get redirected straight into your dashboard.
      </p>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800">
        {selectedRole === "tenant"
          ? "Create your tenant account first. After login, you’ll join the right property with the landlord-provided join code and then wait for approval."
          : "Create your account with the right role and step straight into the matching RentTruth workspace."}
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4">
        {userRoles.map((role) => (
          <Link
            key={role}
            href={`/signup?role=${role}`}
            className={`rounded-[28px] border border-slate-200 bg-gradient-to-b ${roleAccentClasses[role]} p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 ${
              selectedRole === role ? "ring-2 ring-ink" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl font-semibold text-ink">{roleLabels[role]}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{roleDescriptions[role]}</p>
              </div>
              <div
                className={`mt-1 h-5 w-5 rounded-full border ${
                  selectedRole === role ? "border-ink bg-ink" : "border-slate-300 bg-white"
                }`}
              />
            </div>
          </Link>
        ))}
      </div>

      <form action={signupAction} className="mt-8 space-y-5">
        <input type="hidden" name="role" value={selectedRole} />

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Selected role</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700">
            {roleLabels[selectedRole]}
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
          <input
            type="text"
            name="name"
            placeholder={selectedRole === "vendor" ? "Atlas Service Group" : "Maya Chen"}
            required
            autoComplete="name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            placeholder="name@company.com"
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <SubmitButton
          label="Create Account"
          pendingLabel="Creating Account..."
          className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>
    </>
  );
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getDashboardPath(session.role));
  }

  const params = (await searchParams) ?? {};
  const selectedRole = userRoles.includes(params.role as UserRole)
    ? (params.role as UserRole)
    : "tenant";
  const content = signupRoleContent[selectedRole];

  return (
    <AuthShell
      eyebrow="Signup"
      title={content.title}
      description={content.description}
      sideTitle={content.sideTitle}
      sideDescription={content.sideDescription}
      sideHighlights={content.highlights}
      sideStats={content.stats}
      sideExample={content.example}
      sideCaption={content.caption}
      footerText="Already have an account?"
      footerLinkLabel="Log in"
      footerLinkHref="/login"
    >
      <SignupForm selectedRole={selectedRole} error={params.error} />
    </AuthShell>
  );
}
