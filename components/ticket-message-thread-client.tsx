"use client";

import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import type { RepairTicketAttachment, TicketMessage } from "@/lib/demo-data";
import { isSupportedRepairAttachment, normalizeRepairAttachmentMimeType } from "@/lib/repair-attachment-validation";

type TicketMessageThreadClientProps = {
  ticketId: string;
  currentRole: "tenant" | "landlord";
  ticketTitle: string;
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
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messageList = messageListRef.current;

    if (!messageList) {
      return;
    }

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

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
    <section
      id={`messages-${ticketId}`}
      data-fixed-chat-container="true"
      className="mt-5 flex h-[680px] max-h-[78vh] scroll-mt-4 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 target:ring-4 target:ring-sky-200"
    >
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
          Repair chat
        </p>
        <h4 className="mt-1 line-clamp-2 font-display text-xl font-semibold tracking-tight text-ink">
          {ticketTitle}
        </h4>
      </div>

      <div
        ref={messageListRef}
        data-internal-message-scroll="true"
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-slate-50 px-3 py-4"
      >
        {messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.senderRole === currentRole;

            return (
              <article
                key={message.id}
                className={`max-w-[84%] rounded-[22px] px-4 py-2.5 shadow-sm ${
                  isCurrentUser
                    ? "ml-auto rounded-br-md bg-ink text-white"
                    : "mr-auto rounded-bl-md bg-white text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {message.text}
                </p>
                {message.attachment ? (
                  <a
                    href={message.attachment.dataUrl ?? "#"}
                    target={message.attachment.dataUrl ? "_blank" : undefined}
                    rel={message.attachment.dataUrl ? "noreferrer" : undefined}
                    className={`mt-2 block rounded-2xl px-3 py-2 text-sm font-semibold ${
                      isCurrentUser
                        ? "bg-white/10 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {getAttachmentLabel(message.attachment)}: {message.attachment.fileName}
                  </a>
                ) : null}
                <p className={`mt-1 text-[11px] leading-4 ${
                  isCurrentUser ? "text-white/55" : "text-slate-400"
                }`}>
                  {getSenderLabel(message)} · {formatMessageTime(message.createdAt)}
                </p>
              </article>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-500">
            No messages yet. Use this thread for ticket-specific access, scheduling, and repair follow-up.
          </div>
        )}
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        data-no-page-reload="true"
        className="sticky bottom-0 shrink-0 space-y-3 border-t border-slate-200 bg-white p-3"
      >
        <textarea
          name="message"
          rows={3}
          required
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message about this ticket"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
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
