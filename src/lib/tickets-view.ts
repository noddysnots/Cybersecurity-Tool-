import { getHistoryTicket } from "@/content/history";
import { ticketsCopy } from "@/content/tickets";
import { tickets } from "@/data";
import {
  useCaseEngine,
  type CaseTicketId,
} from "@/lib/case-engine";
import { computeSla, type SlaInfo } from "@/lib/home-metrics";
import { now } from "@/lib/time";
import type { ProductLine, Ticket, TicketStatus } from "@/types";

export type TicketTab = "active" | "waiting" | "resolved" | "all";
export type TicketViewMode = "grid" | "table";

export type TicketListItem = {
  ticket: Ticket;
  sla: SlaInfo;
  status: TicketStatus;
  statusLabel: string;
  lastUpdateAt: string;
  assigneeName: string;
  productLabel: string;
  workable: boolean;
};

export function productLabel(product: ProductLine): string {
  return product === "mobile-users"
    ? ticketsCopy.productMobile
    : ticketsCopy.productRemote;
}

export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case "open":
      return ticketsCopy.statusOpen;
    case "in_progress":
      return ticketsCopy.statusInProgress;
    case "pending_customer":
      return ticketsCopy.statusPending;
    case "resolved":
      return ticketsCopy.statusResolved;
    case "closed":
      return ticketsCopy.statusClosed;
  }
}

function resolveStatus(ticket: Ticket): TicketStatus {
  if (ticket.workable && ticket.caseKey) {
    const caseState = useCaseEngine.getState().tickets[ticket.id as CaseTicketId];
    return caseState?.status ?? ticket.status;
  }
  return ticket.status;
}

function resolveSla(ticket: Ticket, status: TicketStatus): SlaInfo {
  if (status === "resolved" || status === "closed") {
    return {
      totalMinutes: ticket.slaResponseMinutes,
      remainingMinutes: 0,
      fractionLeft: 1,
      label: ticketsCopy.slaMet,
      breached: false,
    };
  }
  return computeSla(ticket, now());
}

function resolveLastUpdate(ticket: Ticket, status: TicketStatus): string {
  if (ticket.workable) {
    const caseState = useCaseEngine.getState().tickets[ticket.id as CaseTicketId];
    const last = caseState?.thread[caseState.thread.length - 1];
    if (last) return last.createdAt;
  }
  const history = getHistoryTicket(ticket.id);
  if (history) {
    const last = history.thread[history.thread.length - 1];
    if (last) return last.createdAt;
  }
  void status;
  return ticket.openedAt;
}

function resolveAssignee(ticket: Ticket): string {
  if (ticket.workable) return "Priya Nair";
  return getHistoryTicket(ticket.id)?.assigneeName ?? "Priya Nair";
}

export function getTicketListItems(): TicketListItem[] {
  useCaseEngine.getState();
  return tickets.map((ticket) => {
    const status = resolveStatus(ticket);
    return {
      ticket: { ...ticket, status },
      status,
      statusLabel: statusLabel(status),
      sla: resolveSla(ticket, status),
      lastUpdateAt: resolveLastUpdate(ticket, status),
      assigneeName: resolveAssignee(ticket),
      productLabel: productLabel(ticket.product),
      workable: ticket.workable,
    };
  });
}

export function filterTicketsByTab(
  items: TicketListItem[],
  tab: TicketTab,
): TicketListItem[] {
  switch (tab) {
    case "active":
      return items.filter(
        (i) => i.status === "open" || i.status === "in_progress",
      );
    case "waiting":
      return items.filter((i) => i.status === "pending_customer");
    case "resolved":
      return items.filter((i) => i.status === "resolved" || i.status === "closed");
    case "all":
      return items;
  }
}

export function parseTicketTab(value: string | null): TicketTab {
  if (value === "waiting" || value === "resolved" || value === "all" || value === "active") {
    return value;
  }
  return "active";
}

export function findSeededTicket(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
