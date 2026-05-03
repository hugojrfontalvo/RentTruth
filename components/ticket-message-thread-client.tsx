"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import type { TicketMessage } from "@/lib/demo-data";

type TicketMessageThreadClientProps = {
  ticketId: string;
  currentRole: "tenant" | "landlord";
  initialMessages: TicketMessage[];
  sendMessageAction: (formData: FormData) => Promise<TicketMessage | null>;
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

export function TicketMessageThreadClient({
  ticketId,
  currentRole,
  initialMessages,
  sendMessageAction,
}: TicketMessageThreadClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text || isPending) {
      return;
    }

    console.log("message send started", { ticketId, senderRole: currentRole });
    setError(null);
    setDraft("");

    const optimisticMessage: TicketMessage = {
      id: `optimistic-${Date.now()}`,
      ticketId,
      senderUserId: "current-user",
      senderRole: currentRole,
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", ticketId);
      formData.set("message", text);

      try {
        const savedMessage = await sendMessageAction(formData);

        if (!savedMessage) {
          throw new Error("Message could not be saved.");
        }

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === optimisticMessage.id ? savedMessage : message,
          ),
        );
        console.log("message send successful", { ticketId, messageId: savedMessage.id });
      } catch (sendError) {
        setMessages((currentMessages) =>
          currentMessages.filter((message) => message.id !== optimisticMessage.id),
        );
        setDraft(text);
        setError("Message could not be sent. Try again.");
        console.error("message send failed", sendError);
      }
    });
  }

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

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        data-no-page-reload="true"
        className="mt-4 space-y-3"
      >
        <textarea
          name="message"
          rows={3}
          required
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message about this ticket"
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={!draft.trim() || isPending}
          className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </section>
  );
}
