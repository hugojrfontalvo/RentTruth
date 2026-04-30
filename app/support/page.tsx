import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { SupportTicketForm } from "@/components/support-ticket-form";
import { SupportEntryButtons } from "@/components/support-entry-buttons";
import { getSupportTicketsForUser } from "@/lib/demo-data";
import { getDashboardPath, roleLabels } from "@/lib/auth";

type SupportPageProps = {
  searchParams?: Promise<{ error?: string; submitted?: string; intent?: string }>;
};

function getSupportErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Add a message before submitting feedback.";
  }

  return null;
}

function getStatusTone(status: string) {
  if (status === "Resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "In progress") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (status === "Open") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "admin") {
    redirect("/dashboard/admin");
  }

  const params = (await searchParams) ?? {};
  const supportTickets = getSupportTicketsForUser(session.id);
  const errorMessage = getSupportErrorMessage(params.error);

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_top_left,_rgba(111,232,255,0.26),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,138,101,0.18),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8">
          <div className="rounded-[36px] bg-ink p-8 text-white shadow-glow lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
                  Support and feedback
                </p>
                <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  Tell RentTruth what needs attention
                </h1>
                <p className="mt-4 text-lg leading-8 text-white/72">
                  File product issues, ask for help, or suggest features with the same calm, structured workflow across tenants, landlords, and vendors.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="rounded-full bg-white/10 px-4 py-2">
                    Logged in as {roleLabels[session.role]}
                  </span>
                  <Link
                    href={getDashboardPath(session.role)}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/55">
                  Quick actions
                </p>
                <SupportEntryButtons className="mt-4" />
              </div>
            </div>
          </div>

          {params.submitted === "1" ? (
            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              Support ticket submitted. The RentTruth team can now triage it in HQ.
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
            <section className="rounded-[32px] border border-white/80 bg-white/92 p-7 shadow-lg shadow-slate-200/60 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                New ticket
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                App Help & Feedback
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Send one clear message to RentTruth. Your role is detected automatically, and your email is prefilled so we can follow up if needed.
              </p>

              <SupportTicketForm
                email={session.email}
                role={session.role}
                defaultCategory={params.intent === "bug" ? "Bug" : params.intent === "feature" ? "Feature Request" : "Support"}
                errorMessage={errorMessage}
              />
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Your recent tickets
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                Track what support has seen
              </h2>
              <div className="mt-6 space-y-4">
                {supportTickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {ticket.category}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {ticket.urgency}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                      {ticket.subject}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{ticket.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span>Created {ticket.createdAt}</span>
                      <span className="text-slate-300">•</span>
                      <span>{ticket.screenshotPlaceholder}</span>
                      <span className="text-slate-300">•</span>
                      <span>Assigned: {ticket.assignedSupportStaff ?? "Unassigned"}</span>
                    </div>
                  </article>
                ))}

                {supportTickets.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                    No support tickets yet. Use the form to send the RentTruth team your first issue or idea.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
