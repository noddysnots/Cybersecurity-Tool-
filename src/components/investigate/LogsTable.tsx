"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Columns3, Rows3 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTable } from "@tanstack/react-table";
import { LOG_TYPE_LABELS, TABLE_COPY } from "@/content/investigate";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Density, LogRecord, LogType } from "@/types";
import {
  columnsForType,
  logTableFeatures,
  type CellActionHandlers,
} from "./columns";
import type { TimezoneMode } from "@/lib/time";

interface LogsTableProps {
  type: LogType;
  rows: LogRecord[];
  timezone: TimezoneMode;
  density: Density;
  activeId: string | null;
  onActiveId: (id: string | null) => void;
  onOpen: (log: LogRecord) => void;
  actions: CellActionHandlers;
}

export function LogsTable({
  type,
  rows,
  timezone,
  density,
  activeId,
  onActiveId,
  onOpen,
  actions,
}: LogsTableProps) {
  const columnVisibility = useAppStore((s) => s.columnVisibility);
  const columnSizing = useAppStore((s) => s.columnSizing);
  const setColumnVisible = useAppStore((s) => s.setColumnVisible);
  const setColumnWidth = useAppStore((s) => s.setColumnWidth);
  const setDensity = useAppStore((s) => s.setDensity);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const menuId = useId();
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => columnsForType(type, { timezone, actions }),
    [type, timezone, actions],
  );

  const visibilityState = useMemo(() => {
    const state: Record<string, boolean> = {};
    for (const col of columns) {
      const key = `${type}.${col.id}`;
      if (columnVisibility[key] === false) state[col.id!] = false;
    }
    return state;
  }, [columns, columnVisibility, type]);

  const table = useTable({
    features: logTableFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: {
      columnVisibility: visibilityState,
      columnSizing,
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(visibilityState) : updater;
      for (const [id, visible] of Object.entries(next)) {
        if (typeof visible === "boolean") setColumnVisible(`${type}.${id}`, visible);
      }
    },
    onColumnSizingChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnSizing) : updater;
      for (const [id, width] of Object.entries(next)) {
        if (typeof width === "number") setColumnWidth(id, width);
      }
    },
    columnResizeMode: "onChange",
    defaultColumn: { minSize: 64, size: 140 },
  });

  const rowHeight = density === "compact" ? 32 : 40;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const activeIndex = activeId ? rows.findIndex((r) => r.id === activeId) : -1;

  useEffect(() => {
    if (activeIndex >= 0) virtualizer.scrollToIndex(activeIndex, { align: "auto" });
  }, [activeIndex, virtualizer]);

  const totalSize = table.getTotalSize();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-1.5">
        <p className="text-[12px] text-muted-fg">
          {TABLE_COPY.rowCount(rows.length)}
          <span className="mx-2 text-border">|</span>
          {TABLE_COPY.keyboardHint}
        </p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={TABLE_COPY.density} className="flex rounded-md border border-border">
            <button
              type="button"
              aria-pressed={density === "compact"}
              onClick={() => setDensity("compact")}
              className={cn(
                "px-2 py-1 text-[12px]",
                density === "compact" ? "bg-surface text-accent" : "text-muted-fg",
              )}
            >
              {TABLE_COPY.compact}
            </button>
            <button
              type="button"
              aria-pressed={density === "comfortable"}
              onClick={() => setDensity("comfortable")}
              className={cn(
                "border-l border-border px-2 py-1 text-[12px]",
                density === "comfortable" ? "bg-surface text-accent" : "text-muted-fg",
              )}
            >
              {TABLE_COPY.comfortable}
            </button>
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label={TABLE_COPY.columnsLabel}
              aria-expanded={columnsOpen}
              aria-controls={menuId}
              onClick={() => setColumnsOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-muted-fg hover:text-text"
            >
              <Columns3 className="size-3.5" aria-hidden="true" />
              {TABLE_COPY.columns}
            </button>
            {columnsOpen ? (
              <ul
                id={menuId}
                className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-lg border border-border bg-panel py-1 shadow-[var(--shadow-float)]"
              >
                {table.getAllLeafColumns().map((column) => (
                  <li key={column.id}>
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        disabled={!column.getCanHide()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Rows3 className="size-3.5 text-muted-fg" aria-hidden="true" />
        </div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div style={{ width: Math.max(totalSize, 800) }} className="relative">
          <div
            role="row"
            className="sticky top-0 z-10 flex border-b border-border bg-panel"
            style={{ width: totalSize }}
          >
            {table.getHeaderGroups().map((group) =>
              group.headers.map((header) => (
                <div
                  key={header.id}
                  role="columnheader"
                  className="relative shrink-0 border-r border-border px-2 py-2 text-[12px] font-medium text-muted-fg last:border-r-0"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                  {header.column.getCanResize() ? (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={TABLE_COPY.resizeColumn(
                        typeof header.column.columnDef.header === "string"
                          ? header.column.columnDef.header
                          : header.column.id,
                      )}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-accent/40",
                        header.column.getIsResizing() && "bg-accent",
                      )}
                    />
                  ) : null}
                </div>
              )),
            )}
          </div>

          <div
            role="table"
            aria-label={TABLE_COPY.tableLabel(LOG_TYPE_LABELS[type])}
            style={{ height: virtualizer.getTotalSize(), width: totalSize }}
            className="relative"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const log = rows[virtualRow.index];
              const row = table.getRowModel().rows[virtualRow.index];
              const isActive = log.id === activeId;
              return (
                <div
                  key={log.id}
                  id={`log-row-${log.id}`}
                  role="row"
                  data-index={virtualRow.index}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => {
                    onActiveId(log.id);
                    onOpen(log);
                  }}
                  className={cn(
                    "absolute left-0 flex cursor-pointer border-b border-border hover:bg-surface",
                    isActive && "bg-surface outline-2 -outline-offset-2 outline-accent",
                  )}
                  style={{
                    height: rowHeight,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: totalSize,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      role="cell"
                      className="flex shrink-0 items-center overflow-hidden border-r border-border/60 px-2 text-[13px] last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                      onClick={
                        cell.column.id === "srcIp" ||
                        cell.column.id === "dstIp" ||
                        cell.column.id === "srcUser" ||
                        cell.column.id === "rule"
                          ? (event) => event.stopPropagation()
                          : undefined
                      }
                    >
                      <table.FlexRender cell={cell} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
