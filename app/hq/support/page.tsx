import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, logoutAction } from "@/app/actions/auth";
import { isAdminSession } from "@/lib/admin-access";
import {
  getSupportTicketAnalytics,
  getSupportTickets,
  getSupportTicketSummary,
} from "@/lib/demo-data";

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

function getUrgencyTone(urgency: string) {
  if (urgency === "Urgent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (urgency === "High") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default async function SupportHqPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?role=admin");
  }

  if (!isAdminSession(session)) {
    redirect("/dashboard");
  }

  const summary = getSupportTicketSummary();
  const analytics = getSupportTicketAnalytics();
  const tickets = getSupportTickets();
  const urgentTickets = tickets.filter(
    (ticket) => ticket.urgency === "Urgent" || ticket.urgency === "High",
  );
  const summaryCards = [
    { title: "New tickets", value: String(summary.newTickets), detail: "Fresh inbound queue" },
    { title: "Open tickets", value: String(summary.openTickets), detail: "Needs active follow-up" },
    { title: "In progress", value: String(summary.inProgressTickets), detail: "Assigned and moving" },
    { title: "Resolved", value: String(summary.resolvedTickets), detail: "Closed by support" },
    { title: "Urgent queue", value: String(summary.urgentQueue), detail: "High-priority triage" },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f7fbff] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.20),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(111,232,255,0.18),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef6ff_65%,#f7fbff_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid bg-[size:42px_42px] opacity-35" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-white shadow-glow">
              RT
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">RentTruth</p>
              <p className="text-sm text-slate-500">Support HQ</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/60 backdrop-blur md:block">
              Signed in as RentTruth Admin
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              >
                Log Out
              </button>
            </form>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-4 lg:px-8">
          <div className="rounded-[36px] bg-ink p-8 text-white shadow-glow lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-200">
                  Internal support operations
                </p>
                <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  Admin HQ for support, feedback, and platform pain points
                </h1>
                <p className="mt-4 text-lg leading-8 text-white/72">
                  Track user-reported issues from tenants, landlords, and vendors, then prioritize the problems shaping product trust.
                </p>
              </div>

              <div className="rounded-[32px] bg-white/8 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-white/55">
                  Triage focus
                </p>
                <p className="mt-4 font-display text-4xl font-semibold">{summary.urgentQueue}</p>
                <p className="mt-2 text-sm text-white/65">tickets in the urgent queue</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <article key={card.title} className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-200/70 backdrop-blur">
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Urgent queue
                </p>
                <div className="mt-5 space-y-4">
                  {urgentTickets.map((ticket) => (
                    <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getUrgencyTone(ticket.urgency)}`}>
                          {ticket.urgency}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                          {ticket.userRole}
                        </span>
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                        {ticket.subject}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{ticket.description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Analytics
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-700">Most common issue categories</p>
                    <div className="mt-4 space-y-3">
                      {analytics.commonCategories.map((item) => (
                        <div key={item.category} className="flex items-center justify-between text-sm text-slate-600">
                          <span>{item.category}</span>
                          <span className="font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                  <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-700">Most common user pain points</p>
                    <div className="mt-4 space-y-3">
                      {analytics.commonPainPoints.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-4 text-sm text-slate-600">
                          <span>{item.label}</span>
                          <span className="font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-lg shadow-slate-200/60">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                All support tickets
              </p>
              <div className="mt-5 space-y-4">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {ticket.category}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getUrgencyTone(ticket.urgency)}`}>
                        {ticket.urgency}
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                      {ticket.subject}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{ticket.description}</p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
                      <span>User role: {ticket.userRole}</span>
                      <span>User account: {ticket.userName ?? ticket.userEmail}</span>
                      <span>Email: {ticket.userEmail}</span>
                      <span>Created: {ticket.createdAt}</span>
                      <span>Status: {ticket.status}</span>
                      <span>Assigned staff: {ticket.assignedSupportStaff ?? "Unassigned"}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
