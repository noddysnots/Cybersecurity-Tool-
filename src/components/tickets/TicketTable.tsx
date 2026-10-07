import { Link } from "react-router-dom";

import { SlaRing } from "@/components/home/SlaRing";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { ticketsCopy } from "@/content/tickets";
import { initials, type TicketListItem } from "@/lib/tickets-view";
import { formatAbsolute } from "@/lib/time";

type TicketTableProps = {
  items: TicketListItem[];
};

export function TicketTable({ items }: TicketTableProps) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-border">
      <table className="w-full min-w-[960px] border-collapse text-sm" data-testid="tickets-table">
        <thead className="bg-surface-2 text-left text-text-muted">
          <tr>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.pageTitle}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.subject}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.priority}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.sla}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.status}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.product}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.assignee}</th>
            <th className="border-b border-border px-3 py-2 font-medium">{ticketsCopy.lastUpdate}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.ticket.id}
              className="border-b border-border bg-surface-1 hover:bg-surface-2"
              data-testid={`ticket-row-${item.ticket.id}`}
            >
              <td className="px-3 py-2">
                <Link
                  to={`/tickets/${item.ticket.id}`}
                  className="font-mono text-accent hover:underline"
                >
                  {item.ticket.id}
                </Link>
              </td>
              <td className="max-w-[280px] truncate px-3 py-2 text-text">
                {item.ticket.subject}
              </td>
              <td className="px-3 py-2">
                <PriorityBadge priority={item.ticket.priority} />
              </td>
              <td className="px-3 py-2">
                <SlaRing sla={item.sla} priority={item.ticket.priority} size={40} />
              </td>
              <td className="px-3 py-2 capitalize text-text-muted">{item.statusLabel}</td>
              <td className="px-3 py-2 text-text-muted">{item.productLabel}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-3 font-mono text-[10px]">
                    {initials(item.assigneeName)}
                  </span>
                  <span className="text-text">{item.assigneeName}</span>
                </span>
              </td>
              <td
                className="px-3 py-2 font-mono text-xs text-text-muted"
                title={formatAbsolute(new Date(item.lastUpdateAt), "UTC")}
              >
                {formatAbsolute(new Date(item.lastUpdateAt), "IST")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
