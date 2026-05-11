import { TicketMessageThreadClient } from "@/components/ticket-message-thread-client";
import { getTicketMessages, type TicketMessage } from "@/lib/demo-data";

type TicketMessageThreadProps = {
  ticketId: string;
  currentRole: "tenant" | "landlord";
  ticketTitle?: string;
  sendMessageAction: (formData: FormData) => Promise<TicketMessage | null>;
  markReadAction: (formData: FormData) => Promise<{ markedCount: number }>;
};

export function TicketMessageThread({
  ticketId,
  currentRole,
  ticketTitle = "Repair ticket",
  sendMessageAction,
  markReadAction,
}: TicketMessageThreadProps) {
  const messages = getTicketMessages(ticketId);

  return (
    <TicketMessageThreadClient
      ticketId={ticketId}
      currentRole={currentRole}
      ticketTitle={ticketTitle}
      initialMessages={messages}
      sendMessageAction={sendMessageAction}
      markReadAction={markReadAction}
    />
  );
}
