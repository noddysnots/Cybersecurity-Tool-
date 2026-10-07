import { Link } from "react-router-dom";

import { SlaRing } from "@/components/home/SlaRing";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { ticketsCopy } from "@/content/tickets";
import { initials, type TicketListItem } from "@/lib/tickets-view";
import { formatAbsolute } from "@/lib/time";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  item: TicketListItem;
};

export function TicketCard({ item }: TicketCardProps) {
  const { ticket, sla, statusLabel, lastUpdateAt, assigneeName, productLabel } = item;

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      data-testid={`ticket-card-${ticket.id}`}
      data-annotation={`ticket-card-${ticket.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4",
        "transition-colors hover:border-border-strong hover:bg-surface-2",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-accent">{ticket.id}</span>
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h2 className="mt-1 text-base font-medium text-text">{ticket.subject}</h2>
        </div>
        <SlaRing sla={sla} priority={ticket.priority} size={52} />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-muted">
        <div>
          <dt className="text-text-faint">{ticketsCopy.customer}</dt>
          <dd className="text-text">{ticket.customer}</dd>
        </div>
        <div>
          <dt className="text-text-faint">{ticketsCopy.product}</dt>
          <dd className="text-text">{productLabel}</dd>
        </div>
        <div>
          <dt className="text-text-faint">{ticketsCopy.status}</dt>
          <dd className="capitalize text-text">{statusLabel}</dd>
        </div>
        <div>
          <dt className="text-text-faint">{ticketsCopy.lastUpdate}</dt>
          <dd className="font-mono text-text" title={formatAbsolute(new Date(lastUpdateAt), "UTC")}>
            {formatAbsolute(new Date(lastUpdateAt), "IST")}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-3 font-mono text-[10px] text-text"
          aria-hidden
        >
          {initials(assigneeName)}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-text-faint">{ticketsCopy.assignee}</p>
          <p className="truncate text-sm text-text">{assigneeName}</p>
        </div>
      </div>
    </Link>
  );
}
