"use client";

import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ALERTS_COPY, COLUMN_LABELS } from "@/content/alerts";
import { severityRank } from "@/lib/alerts";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types";
import {
  ActionsCell,
  AssigneeCell,
  EntitiesCell,
  FirstSeenCell,
  TitleCell,
} from "./AlertCells";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic },
});

const helper = createColumnHelper<typeof features, Alert>();

const columns = helper.columns([
  helper.accessor((a) => severityRank(a.severity), {
    id: "severity",
    header: COLUMN_LABELS.severity,
    sortFn: "basic",
    cell: (ctx) => <SeverityBadge severity={ctx.row.original.severity} />,
  }),
  helper.display({
    id: "alert",
    header: COLUMN_LABELS.alert,
    enableSorting: false,
    cell: (ctx) => <TitleCell alert={ctx.row.original} />,
  }),
  helper.display({
    id: "entities",
    header: COLUMN_LABELS.entities,
    enableSorting: false,
    cell: (ctx) => <EntitiesCell alert={ctx.row.original} />,
  }),
  helper.accessor((a) => new Date(a.createdAt).getTime(), {
    id: "firstSeen",
    header: COLUMN_LABELS.firstSeen,
    sortFn: "basic",
    sortDescFirst: true,
    cell: (ctx) => <FirstSeenCell alert={ctx.row.original} />,
  }),
  helper.display({
    id: "status",
    header: COLUMN_LABELS.status,
    enableSorting: false,
    cell: (ctx) => <StatusBadge status={ctx.row.original.status} />,
  }),
  helper.display({
    id: "assignee",
    header: COLUMN_LABELS.assignee,
    enableSorting: false,
    cell: (ctx) => <AssigneeCell alert={ctx.row.original} />,
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">{COLUMN_LABELS.actions}</span>,
    enableSorting: false,
    cell: (ctx) => <ActionsCell alert={ctx.row.original} />,
  }),
]);

const DEFAULT_SORTING = [
  { id: "severity", desc: false },
  { id: "firstSeen", desc: true },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, select, textarea, a, button") !== null;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="size-3.5" aria-hidden="true" />;
  if (direction === "desc") return <ArrowDown className="size-3.5" aria-hidden="true" />;
  return <ArrowUpDown className="size-3.5 text-muted-fg" aria-hidden="true" />;
}

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const table = useTable({
    features,
    columns,
    data: alerts,
    getRowId: (alert) => alert.id,
    initialState: { sorting: DEFAULT_SORTING },
  });

  const rows = table.getRowModel().rows;
  const ids = useMemo(() => rows.map((row) => row.id), [rows]);
  const activeIndex = activeId ? ids.indexOf(activeId) : -1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "j" || event.key === "k") {
        if (isTypingTarget(event.target) || ids.length === 0) return;
        event.preventDefault();
        const step = event.key === "j" ? 1 : -1;
        const next = Math.min(ids.length - 1, Math.max(0, activeIndex + step));
        setActiveId(ids[next]);
        return;
      }
      if (event.key === "Enter" && activeIndex >= 0) {
        if (isTypingTarget(event.target)) return;
        event.preventDefault();
        router.push(`/investigate/${ids[activeIndex]}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ids, activeIndex, router]);

  useEffect(() => {
    if (activeId) {
      document.getElementById(`alert-row-${activeId}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeId]);

  return (
    <table aria-label={ALERTS_COPY.tableLabel} className="w-full border-collapse text-left">
      <thead className="sticky top-0 z-10 bg-panel">
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id} className="border-b border-border">
            {group.headers.map((header) => {
              const sorted = header.column.getIsSorted();
              const canSort = header.column.getCanSort();
              return (
                <th
                  key={header.id}
                  scope="col"
                  aria-sort={
                    sorted === "asc"
                      ? "ascending"
                      : sorted === "desc"
                        ? "descending"
                        : canSort
                          ? "none"
                          : undefined
                  }
                  className="h-9 px-3 text-[12px] font-medium text-muted-fg"
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={ALERTS_COPY.sortBy(
                        typeof header.column.columnDef.header === "string"
                          ? header.column.columnDef.header
                          : header.column.id,
                      )}
                      className="inline-flex items-center gap-1 rounded-sm hover:text-text"
                    >
                      <table.FlexRender header={header} />
                      <SortIcon direction={sorted} />
                    </button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            id={`alert-row-${row.id}`}
            data-active={index === activeIndex}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => router.push(`/investigate/${row.id}`)}
            className={cn(
              "group h-12 cursor-pointer scroll-mt-10 border-b border-border hover:bg-surface",
              index === activeIndex && "bg-surface outline-2 -outline-offset-2 outline-accent",
            )}
          >
            {row.getAllCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  "px-3 py-1.5 align-middle",
                  cell.column.id === "actions" &&
                    "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[active=true]:opacity-100",
                )}
                onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
              >
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
