"use client";

import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import type { RepairTicketAttachment, TicketMessage } from "@/lib/demo-data";
import { isSupportedRepairAttachment, normalizeRepairAttachmentMimeType } from "@/lib/repair-attachment-validation";

type TicketMessageThreadClientProps = {
  ticketId: string;
  currentRole: "tenant" | "landlord";
  ticketTitle: string;
  ticketStatus: string;
  ticketCreatedAt?: string;
  vendorLabel?: string;
  initialMessages: TicketMessage[];
  sendMessageAction: (formData: FormData) => Promise<TicketMessage | null>;
  markReadAction: (formData: FormData) => Promise<{ markedCount: number }>;
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

function getAttachmentLabel(attachment: RepairTicketAttachment) {
  if (attachment.kind === "image") {
    return "Photo";
  }

  if (attachment.kind === "pdf") {
    return "PDF";
  }

  return "File";
}

export function TicketMessageThreadClient({
  ticketId,
  currentRole,
  ticketTitle,
  ticketStatus,
  ticketCreatedAt,
  vendorLabel,
  initialMessages,
  sendMessageAction,
  markReadAction,
}: TicketMessageThreadClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(
    initialMessages.filter(
      (message) =>
        message.senderRole !== currentRole &&
        !(message.readByRoles ?? []).includes(currentRole),
    ).length,
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (unreadCount === 0) {
      return;
    }

    const formData = new FormData();
    formData.set("ticketId", ticketId);
    markReadAction(formData)
      .then((result) => {
        if (result.markedCount > 0) {
          setUnreadCount(0);
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.senderRole === currentRole
                ? message
                : {
                    ...message,
                    readByRoles: Array.from(
                      new Set([...(message.readByRoles ?? []), currentRole]),
                    ),
                  },
            ),
          );
        }
      })
      .catch((readError) => {
        console.error("message read tracking failed", readError);
      });
  }, [currentRole, markReadAction, ticketId, unreadCount]);

  function handleFileChange(file?: File) {
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    console.log("message attachment selected", {
      name: file.name,
      type: normalizeRepairAttachmentMimeType(file.type) || "unknown",
      size: file.size,
    });

    if (!isSupportedRepairAttachment({ fileName: file.name, mimeType: file.type })) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setError("Attach a JPG, PNG, HEIC, HEIF, or PDF file.");
      return;
    }

    setSelectedFile(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if ((!text && !selectedFile) || isPending) {
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
      readByRoles: [currentRole],
      attachment: selectedFile
        ? {
            fileName: selectedFile.name || "message-photo",
            mimeType: selectedFile.type || undefined,
            kind: normalizeRepairAttachmentMimeType(selectedFile.type).startsWith("image/")
              ? "image"
              : selectedFile.name.toLowerCase().endsWith(".pdf")
                ? "pdf"
                : "file",
          }
        : null,
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", ticketId);
      formData.set("message", text);
      if (selectedFile) {
        formData.set("attachment", selectedFile);
      }

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
    <section id={`messages-${ticketId}`} className="mt-5 scroll-mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 target:ring-4 target:ring-sky-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Ticket chat
          </p>
          <h4 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
            {ticketTitle}
          </h4>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              {ticketStatus}
            </span>
            {unreadCount > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                {unreadCount} unread
              </span>
            ) : null}
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 rounded-[20px] border border-sky-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Timeline</p>
        <div className="mt-2 space-y-1">
          <p>Ticket created{ticketCreatedAt ? `: ${ticketCreatedAt}` : ""}</p>
          <p>Tenant submitted request</p>
          {messages.some((message) => message.senderRole === "landlord") ? (
            <p>Landlord replied</p>
          ) : null}
          {vendorLabel ? <p>{vendorLabel}</p> : null}
        </div>
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
                {message.attachment ? (
                  <a
                    href={message.attachment.dataUrl ?? "#"}
                    target={message.attachment.dataUrl ? "_blank" : undefined}
                    rel={message.attachment.dataUrl ? "noreferrer" : undefined}
                    className="mt-3 block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {getAttachmentLabel(message.attachment)}: {message.attachment.fileName}
                  </a>
                ) : null}
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
        <label className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
          {selectedFile ? `Attached: ${selectedFile.name || "Photo"}` : "Attach photo or PDF"}
          <input
            ref={fileInputRef}
            type="file"
            name="attachment"
            accept="image/*,.jpg,.jpeg,.png,.heic,.heif,.pdf"
            className="sr-only"
            onChange={(event) => handleFileChange(event.currentTarget.files?.[0])}
          />
        </label>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={(!draft.trim() && !selectedFile) || isPending}
          className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </section>
  );
}
