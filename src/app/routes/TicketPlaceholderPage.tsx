import { useParams } from "react-router-dom";

import { PlaceholderPage } from "@/app/routes/PlaceholderPage";

export function TicketPlaceholderPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ?? "unknown";

  return (
    <PlaceholderPage
      title="Ticket workspace"
      path={`/tickets/${ticketId}`}
      description="Playbook workspace arrives in Phase 4. Deep links must survive refresh."
    />
  );
}
