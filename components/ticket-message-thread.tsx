import { getTicketMessages, type TicketMessage } from "@/lib/demo-data";

type TicketMessageThreadProps = {
  ticketId: string;
  currentRole: "tenant" | "landlord";
  sendMessageAction: (formData: FormData) => Promise<void>;
};

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSenderLabel(message: TicketMessage) {
  return message.senderRole === "tenant" ? "Tenant" : "Landlord";
}

export function TicketMessageThread({
  ticketId,
  currentRole,
  sendMessageAction,
}: TicketMessageThreadProps) {
  const messages = getTicketMessages(ticketId);

  return (
    <section className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Ticket messages
          </p>
          <h4 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
            Tenant and landlord thread
          </h4>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.senderRole === currentRole;

            return (
              <article
                key={message.id}
                className={`rounded-[20px] border px-4 py-3 ${
                  isCurrentUser
                    ? "border-sky-200 bg-white"
                    : "border-slate-200 bg-white/80"
                }`}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {getSenderLabel(message)}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {message.text}
                </p>
              </article>
            );
          })
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-500">
            No messages yet. Use this thread for ticket-specific access, scheduling, and repair follow-up.
          </div>
        )}
      </div>

      <form action={sendMessageAction} className="mt-4 space-y-3">
        <input type="hidden" name="ticketId" value={ticketId} />
        <textarea
          name="message"
          rows={3}
          required
          placeholder="Write a message about this ticket"
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
        <button
          type="submit"
          className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
        >
          Send Message
        </button>
      </form>
    </section>
  );
}
