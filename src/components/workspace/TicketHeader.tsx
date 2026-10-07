import { Link } from "react-router-dom";

import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { workspaceCopy } from "@/content/workspace";
import type { TicketCaseState } from "@/lib/case-engine";
import { computeSla } from "@/lib/home-metrics";
import { productLabel, statusLabel } from "@/lib/tickets-view";
import type { Ticket, TicketStatus } from "@/types";

type TicketHeaderProps = {
  ticket: Ticket;
  state?: TicketCaseState;
  readOnly?: boolean;
  onStatusChange?: (status: TicketStatus) => void;
};

const STATUS_OPTIONS: TicketStatus[] = [
  "open",
  "in_progress",
  "pending_customer",
  "resolved",
  "closed",
];

export function TicketHeader({
  ticket,
  state,
  readOnly = false,
  onStatusChange,
}: TicketHeaderProps) {
  const status = state?.status ?? ticket.status;
  const sla = computeSla({ ...ticket, status });
  const slaText =
    status === "resolved" || status === "closed"
      ? "met"
      : sla.breached
        ? sla.label
        : `${sla.label} ${workspaceCopy.slaLeftSuffix}`;

  return (
    <header
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface-1 px-4 py-2"
      data-testid="ticket-header"
    >
      <Link
        to="/tickets"
        className="text-sm text-accent hover:underline"
        data-testid="back-to-tickets"
      >
        {workspaceCopy.backToTickets}
      </Link>
      <span className="text-text-faint" aria-hidden>
        ·
      </span>
      <h1 className="font-mono text-sm text-accent" data-testid="ticket-workspace-title">
        {ticket.id}
      </h1>
      <PriorityBadge priority={ticket.priority} />
      <span className="font-mono text-sm text-text" data-testid="ticket-sla">
        {workspaceCopy.slaLeft} {slaText}
      </span>
      {readOnly || !onStatusChange ? (
        <span className="rounded-[var(--radius-control)] border border-border px-2 py-0.5 text-xs capitalize text-text-muted">
          {statusLabel(status)}
        </span>
      ) : (
        <label className="flex items-center gap-1 text-xs text-text-muted">
          <span className="sr-only">{workspaceCopy.statusLabel}</span>
          <select
            value={status}
            data-testid="ticket-status"
            className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-1 text-xs capitalize text-text"
            onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
      )}
      <span className="text-sm text-text-muted">
        {workspaceCopy.customerLabel}{" "}
        <span className="text-text">{ticket.customer}</span>
      </span>
      <span className="text-sm text-text-muted">
        {workspaceCopy.productLabel}{" "}
        <span className="text-text">{productLabel(ticket.product)}</span>
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-text-muted" title={ticket.subject}>
        {ticket.subject}
      </span>
    </header>
  );
}
