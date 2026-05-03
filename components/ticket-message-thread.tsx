import { TicketMessageThreadClient } from "@/components/ticket-message-thread-client";
import { getTicketMessages, type TicketMessage } from "@/lib/demo-data";

type TicketMessageThreadProps = {
  ticketId: string;
  currentRole: "tenant" | "landlord";
  sendMessageAction: (formData: FormData) => Promise<TicketMessage | null>;
};

export function TicketMessageThread({
  ticketId,
  currentRole,
  sendMessageAction,
}: TicketMessageThreadProps) {
  const messages = getTicketMessages(ticketId);

  return (
    <TicketMessageThreadClient
      ticketId={ticketId}
      currentRole={currentRole}
      initialMessages={messages}
      sendMessageAction={sendMessageAction}
    />
  );
}
