import { LayoutGrid, Table2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { TicketCard, TicketTable } from "@/components/tickets";
import { Button } from "@/components/ui";
import { ticketsCopy } from "@/content/tickets";
import { tickets } from "@/data";
import { useCaseEngine } from "@/lib/case-engine";
import {
  filterTicketsByTab,
  getTicketListItems,
  parseTicketTab,
  type TicketTab,
  type TicketViewMode,
} from "@/lib/tickets-view";
import { cn } from "@/lib/utils";

const TABS: { id: TicketTab; label: string }[] = [
  { id: "active", label: ticketsCopy.tabActive },
  { id: "waiting", label: ticketsCopy.tabWaiting },
  { id: "resolved", label: ticketsCopy.tabResolved },
  { id: "all", label: ticketsCopy.tabAll },
];

function emptyCopy(tab: TicketTab): string {
  switch (tab) {
    case "active":
      return ticketsCopy.emptyActive;
    case "waiting":
      return ticketsCopy.emptyWaiting;
    case "resolved":
      return ticketsCopy.emptyResolved;
    case "all":
      return ticketsCopy.emptyAll;
  }
}

export function TicketsPage() {
  const [params, setParams] = useSearchParams();
  // Subscribe so status/SLA labels refresh when case engine changes.
  useCaseEngine((s) => s.tickets);

  const tab = parseTicketTab(params.get("tab"));
  const view: TicketViewMode = params.get("view") === "table" ? "table" : "grid";
  const filterEntries = [...params.entries()];
  const items = filterTicketsByTab(getTicketListItems(), tab);
  const allCount = tickets.length;

  function setTab(next: TicketTab) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  }

  function setView(next: TicketViewMode) {
    const nextParams = new URLSearchParams(params);
    if (next === "grid") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", next);
    }
    setParams(nextParams, { replace: true });
  }

  return (
    <div className="h-full overflow-auto px-5 py-4" data-testid="tickets-page">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium tracking-tight text-text">
            {ticketsCopy.pageTitle}
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">{ticketsCopy.pageSubtitle}</p>
          <p
            className="mt-1 text-xs text-text-faint"
            data-testid="seeded-summary"
            data-annotation="seeded-summary"
          >
            {allCount} {ticketsCopy.seededLabel}
            {items.some((i) => i.ticket.id === "TKT-24817")
              ? " · TKT-24817"
              : items[0]
                ? ` · ${items[0].ticket.id}`
                : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-control)] border border-border bg-surface-1 p-0.5">
          <Button
            type="button"
            size="sm"
            variant={view === "grid" ? "default" : "ghost"}
            aria-label={ticketsCopy.viewGrid}
            aria-pressed={view === "grid"}
            data-testid="tickets-view-grid"
            data-annotation="tickets-view-grid"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            {ticketsCopy.viewGrid}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "ghost"}
            aria-label={ticketsCopy.viewTable}
            aria-pressed={view === "table"}
            data-testid="tickets-view-table"
            data-annotation="tickets-view-table"
            onClick={() => setView("table")}
          >
            <Table2 className="h-4 w-4" aria-hidden />
            {ticketsCopy.viewTable}
          </Button>
        </div>
      </div>

      {filterEntries.length > 0 ? (
        <div
          className="mb-3 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2"
          data-testid="active-filters"
        >
          <p className="text-xs text-text-faint">{ticketsCopy.filtersApplied}</p>
          <ul className="mt-1 flex flex-wrap gap-2 font-mono text-xs text-text-muted">
            {filterEntries.map(([key, value]) => (
              <li key={`${key}-${value}`}>
                {key}={value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className="mb-4 flex flex-wrap gap-1 border-b border-border pb-2"
        role="tablist"
        aria-label="Ticket status tabs"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`tickets-tab-${t.id}`}
            data-annotation={t.id === "active" ? "tickets-tab-active" : undefined}
            className={cn(
              "rounded-[var(--radius-control)] px-3 py-1.5 text-sm transition-colors",
              tab === t.id
                ? "bg-surface-3 text-text"
                : "text-text-muted hover:bg-surface-2 hover:text-text",
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 px-4 py-10 text-center text-sm text-text-muted"
          data-testid="tickets-empty"
        >
          {emptyCopy(tab)}
        </div>
      ) : view === "grid" ? (
        <div
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
          data-testid="tickets-grid"
        >
          {items.map((item) => (
            <TicketCard key={item.ticket.id} item={item} />
          ))}
        </div>
      ) : (
        <TicketTable items={items} />
      )}
    </div>
  );
}
