import { useVirtualizer } from "@tanstack/react-virtual";
import { Columns3, Copy, Filter, Pin, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";
import { logsCopy } from "@/content/logs";
import { configAudit, logs as allLogs } from "@/data";
import {
  buildHistogram,
  columnToQueryField,
  countByType,
  filterLogs,
  getCellValue,
  LOG_COLUMNS,
  LOG_TYPES,
  windowForPreset,
  type LogColumnId,
  type LogDensity,
  type TimeWindow,
} from "@/lib/log-explorer";
import { QUERY_FIELDS, QUERY_OPERATORS, parseQuery } from "@/lib/query-parser";
import { formatAbsolute, formatBothZones } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { EvidenceSource, LogRecord, LogType } from "@/types";

export type LogExplorerPinHandler = (payload: {
  id: string;
  source: EvidenceSource;
  label: string;
  refId: string;
  note: string;
}) => void;

export type LogExplorerProps = {
  records?: LogRecord[];
  initialQuery?: string;
  initialType?: LogType | "all";
  initialWindow?: TimeWindow;
  scopeWindow?: TimeWindow;
  showConfigStrip?: boolean;
  showSavedQueries?: boolean;
  extraRows?: LogRecord[];
  live?: boolean;
  onPin?: LogExplorerPinHandler;
  className?: string;
  testId?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function safeReadSaved(): string[] {
  try {
    const raw = localStorage.getItem("triage-saved-queries");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, 12);
  } catch {
    return [];
  }
}

function safeWriteSaved(queries: string[]) {
  try {
    localStorage.setItem("triage-saved-queries", JSON.stringify(queries.slice(0, 12)));
  } catch {
    // ignore
  }
}

function evidenceSourceFor(type: LogType): EvidenceSource {
  return type;
}

function defaultVisible(): Set<LogColumnId> {
  return new Set(LOG_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
}

const EMPTY_ROWS: LogRecord[] = [];

export function LogExplorer({
  records = allLogs,
  initialQuery = "",
  initialType = "all",
  initialWindow,
  scopeWindow,
  showConfigStrip = false,
  showSavedQueries = false,
  extraRows: extraRowsProp,
  live = false,
  onPin,
  className,
  testId = "log-explorer",
}: LogExplorerProps) {
  const extraRows = extraRowsProp ?? EMPTY_ROWS;
  const [query, setQuery] = useState(initialQuery);
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [type, setType] = useState<LogType | "all">(initialType);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    () => initialWindow ?? windowForPreset("24h"),
  );
  const [visibleCols, setVisibleCols] = useState<Set<LogColumnId>>(defaultVisible);
  const [density, setDensity] = useState<LogDensity>("comfortable");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    record: LogRecord;
    column: LogColumnId;
    value: string;
  } | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => safeReadSaved());
  const [loading, setLoading] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; startIdx: number; endIdx: number } | null>(
    null,
  );
  const extraKey = extraRows.map((r) => r.id).join(",");

  useEffect(() => {
    setQuery(initialQuery);
    setCommittedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialWindow) setTimeWindow(initialWindow);
  }, [initialWindow]);

  useEffect(() => {
    setLoading(true);
    const delay = prefersReducedMotion() ? 80 : 350;
    const id = globalThis.setTimeout(() => setLoading(false), delay);
    return () => globalThis.clearTimeout(id);
  }, [committedQuery, type, timeWindow.start, timeWindow.end, extraKey]);

  const baseRecords = useMemo(() => {
    if (extraRows.length === 0) return records;
    const ids = new Set(extraRows.map((r) => r.id));
    return [...extraRows, ...records.filter((r) => !ids.has(r.id))];
  }, [records, extraRows]);

  const parseLive = parseQuery(query);
  const queryError = parseLive.ok
    ? null
    : { message: parseLive.error, position: parseLive.position };

  const filtered = useMemo(
    () =>
      filterLogs({
        records: baseRecords,
        type,
        query: committedQuery,
        window: timeWindow,
      }),
    [baseRecords, type, committedQuery, timeWindow],
  );

  const typeCounts = useMemo(() => countByType(baseRecords), [baseRecords]);
  const histogram = useMemo(
    () =>
      buildHistogram(
        filtered.rows.length
          ? filtered.rows
          : baseRecords.filter((r) => {
              const t = Date.parse(r.receiveTime);
              return (
                t >= Date.parse(timeWindow.start) && t <= Date.parse(timeWindow.end)
              );
            }),
        timeWindow,
      ),
    [filtered.rows, baseRecords, timeWindow],
  );
  const maxBucket = Math.max(1, ...histogram.map((b) => b.count));

  const columns = LOG_COLUMNS.filter((c) => visibleCols.has(c.id));
  const rowHeight = density === "compact" ? 28 : 36;

  const virtualizer = useVirtualizer({
    count: filtered.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const selected = filtered.rows.find((r) => r.id === selectedId) ?? null;

  const configInWindow = useMemo(() => {
    if (!showConfigStrip) return [];
    const start = Date.parse(timeWindow.start);
    const end = Date.parse(timeWindow.end);
    return configAudit
      .filter((c) => {
        const t = Date.parse(c.timestamp);
        return t >= start && t <= end;
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [showConfigStrip, timeWindow]);

  const suggestions = useMemo(() => {
    const trimmed = query.trimEnd();
    const parts = trimmed.split(/\s+/);
    const last = parts[parts.length - 1] ?? "";
    const fields = [...QUERY_FIELDS];
    const ops = [...QUERY_OPERATORS];
    if (!last) {
      return fields;
    }
    const fieldHits = fields.filter(
      (f) => f.startsWith(last.toLowerCase()) || f.includes(last),
    );
    if (fieldHits.length && !fields.includes(last as (typeof QUERY_FIELDS)[number])) {
      return fieldHits;
    }
    const prev = parts[parts.length - 2]?.toLowerCase() ?? "";
    if (fields.includes(prev as (typeof QUERY_FIELDS)[number]) || prev.endsWith(")")) {
      return ops.filter((op) => op.startsWith(last.toLowerCase()));
    }
    if (ops.includes(last.toLowerCase() as (typeof QUERY_OPERATORS)[number])) {
      return [];
    }
    return [
      ...fields.filter((f) => f.includes(last.toLowerCase())),
      ...ops.filter((op) => op.startsWith(last.toLowerCase())),
      "and",
      "or",
    ].filter((x, i, arr) => arr.indexOf(x) === i);
  }, [query]);

  const applySuggestion = useCallback(
    (token: string) => {
      const parts = query.trimEnd().split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        setQuery(`${token} `);
      } else {
        parts[parts.length - 1] = token;
        setQuery(`${parts.join(" ")} `);
      }
      setSuggestOpen(false);
    },
    [query],
  );

  const commitQuery = useCallback(() => {
    const parsed = parseQuery(query);
    if (!parsed.ok) return;
    setCommittedQuery(query.trim());
    setSuggestOpen(false);
  }, [query]);

  const pinRecord = useCallback(
    (record: LogRecord, note = "") => {
      if (!onPin) return;
      const labelParts = [
        record.type,
        getCellValue(record, "srcUser") || getCellValue(record, "srcIp"),
        getCellValue(record, "action") || getCellValue(record, "rule"),
        formatAbsolute(new Date(record.receiveTime), "IST"),
      ].filter(Boolean);
      onPin({
        id: `ev-${record.id}-${Date.now()}`,
        source: evidenceSourceFor(record.type),
        label: labelParts.join(" · "),
        refId: record.id,
        note,
      });
    },
    [onPin],
  );

  function toggleCol(id: LogColumnId) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 2) return next;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function onBucketPointerDown(idx: number) {
    dragRef.current = { active: true, startIdx: idx, endIdx: idx };
  }

  function onBucketPointerEnter(idx: number) {
    if (!dragRef.current?.active) return;
    dragRef.current.endIdx = idx;
  }

  function onBucketPointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const a = Math.min(drag.startIdx, drag.endIdx);
    const b = Math.max(drag.startIdx, drag.endIdx);
    const startB = histogram[a];
    const endB = histogram[b];
    if (!startB || !endB) return;
    setTimeWindow({
      start: new Date(startB.startMs).toISOString(),
      end: new Date(endB.endMs).toISOString(),
    });
  }

  function openCellMenu(
    event: ReactMouseEvent,
    record: LogRecord,
    column: LogColumnId,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      record,
      column,
      value: getCellValue(record, column),
    });
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  }

  const underline =
    queryError && query.length > 0
      ? {
          backgroundImage: `linear-gradient(to right, transparent 0, transparent ${queryError.position}ch, var(--danger) ${queryError.position}ch, var(--danger) 100%)`,
          backgroundPosition: "0 100%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 2px",
        }
      : undefined;

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)} data-testid={testId}>
      {live ? (
        <div
          className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-control)] border border-signal/40 bg-[color-mix(in_srgb,var(--signal)_12%,transparent)] px-2 py-1 text-xs text-signal"
          data-testid="live-badge"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          {logsCopy.reproduceLive}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1" data-testid="log-type-tabs">
        {LOG_TYPES.map((t) => {
          const count = t === "all" ? typeCounts.all : typeCounts[t];
          const label = t === "all" ? logsCopy.allTypes : t;
          return (
            <button
              key={t}
              type="button"
              data-testid={`log-type-${t}`}
              onClick={() => setType(t)}
              className={cn(
                "rounded-[var(--radius-control)] border px-2 py-1 text-xs focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent",
                type === t
                  ? "border-accent bg-surface-3 text-text"
                  : "border-border bg-surface-1 text-text-muted hover:text-text",
              )}
            >
              <span className="capitalize">{label}</span>
              <span className="ml-1 font-mono text-text-faint">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <label className="sr-only" htmlFor="log-query">
          Log query
        </label>
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-1 px-2">
          <Search className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
          <input
            id="log-query"
            data-testid="log-query"
            className="h-9 w-full bg-transparent font-mono text-sm text-text outline-none placeholder:text-text-faint"
            style={underline}
            value={query}
            placeholder={logsCopy.queryPlaceholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitQuery();
              }
              if (e.key === "Escape") setSuggestOpen(false);
            }}
            aria-invalid={Boolean(queryError)}
            aria-describedby={queryError ? "log-query-error" : undefined}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="log-query-apply"
            disabled={Boolean(queryError)}
            title={queryError ? queryError.message : undefined}
            onClick={commitQuery}
          >
            Apply
          </Button>
        </div>
        {queryError ? (
          <p id="log-query-error" className="mt-1 text-xs text-danger" data-testid="log-query-error">
            {queryError.message} (at {queryError.position})
          </p>
        ) : (
          <p className="mt-1 text-xs text-text-faint">{logsCopy.queryHint}</p>
        )}
        {suggestOpen && suggestions.length > 0 ? (
          <ul
            className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-[var(--radius-control)] border border-border bg-surface-2 py-1 shadow-lg"
            data-testid="log-query-suggest"
          >
            {suggestions.slice(0, 10).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="block w-full px-3 py-1 text-left font-mono text-xs text-text hover:bg-surface-3"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(s);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2" data-testid="log-time-presets">
        <span className="text-xs text-text-faint">{logsCopy.presetsLabel}</span>
        {(
          [
            ["1h", logsCopy.preset1h],
            ["4h", logsCopy.preset4h],
            ["24h", logsCopy.preset24h],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant="ghost"
            data-testid={`log-preset-${key}`}
            onClick={() => setTimeWindow(windowForPreset(key))}
          >
            {label}
          </Button>
        ))}
        {scopeWindow ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="log-preset-scope"
            onClick={() => setTimeWindow(windowForPreset("scope", scopeWindow))}
          >
            {logsCopy.presetScope}
          </Button>
        ) : null}
        <span className="font-mono text-xs text-text-muted">
          {formatAbsolute(new Date(timeWindow.start), "IST")} to{" "}
          {formatAbsolute(new Date(timeWindow.end), "IST")}
        </span>
      </div>

      <div
        className="rounded-[var(--radius-control)] border border-border bg-surface-1 p-2"
        data-testid="log-histogram"
        onMouseLeave={() => {
          if (dragRef.current?.active) onBucketPointerUp();
        }}
        onMouseUp={onBucketPointerUp}
      >
        <p className="mb-1 text-xs text-text-faint">{logsCopy.histogramLabel}</p>
        <div className="flex h-14 items-end gap-px">
          {histogram.map((bucket, idx) => (
            <button
              key={bucket.startMs}
              type="button"
              aria-label={`Bucket ${idx + 1}, ${bucket.count} events`}
              className="min-w-0 flex-1 rounded-t-[1px] bg-accent/70 hover:bg-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              style={{ height: `${Math.max(4, (bucket.count / maxBucket) * 100)}%` }}
              onMouseDown={() => onBucketPointerDown(idx)}
              onMouseEnter={() => onBucketPointerEnter(idx)}
            />
          ))}
        </div>
      </div>

      {showConfigStrip ? (
        <div
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3"
          data-testid="config-changes-strip"
        >
          <p className="text-sm font-medium text-text">{logsCopy.configStripTitle}</p>
          {configInWindow.length === 0 ? (
            <p className="mt-1 text-xs text-text-faint">{logsCopy.configStripEmpty}</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {configInWindow.map((change) => (
                <li
                  key={change.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  data-testid={`config-strip-${change.changeId}`}
                >
                  <span className="font-mono text-xs text-text">
                    {change.changeId} · {change.summary}
                  </span>
                  <Link
                    className="text-xs text-accent underline-offset-2 hover:underline"
                    to={`/config-audit?change=${encodeURIComponent(change.changeId)}`}
                  >
                    {logsCopy.configStripLink}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <details className="relative">
          <summary
            className="flex cursor-pointer list-none items-center gap-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-1 text-xs text-text-muted"
            data-testid="log-columns-toggle"
          >
            <Columns3 className="h-3.5 w-3.5" aria-hidden />
            {logsCopy.columns}
          </summary>
          <div className="absolute z-20 mt-1 w-48 rounded-[var(--radius-control)] border border-border bg-surface-2 p-2 shadow-lg">
            {LOG_COLUMNS.map((col) => (
              <label
                key={col.id}
                className="flex items-center gap-2 py-0.5 text-xs text-text"
              >
                <input
                  type="checkbox"
                  checked={visibleCols.has(col.id)}
                  onChange={() => toggleCol(col.id)}
                />
                {col.label}
              </label>
            ))}
          </div>
        </details>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid="log-density"
          onClick={() =>
            setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))
          }
        >
          {logsCopy.density}:{" "}
          {density === "comfortable"
            ? logsCopy.densityComfortable
            : logsCopy.densityCompact}
        </Button>
        <span className="font-mono text-xs text-text-muted" data-testid="log-row-count">
          {filtered.rows.length} records
        </span>
        {showSavedQueries ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid="log-save-query"
              disabled={Boolean(queryError) || !committedQuery.trim()}
              title={
                queryError || !committedQuery.trim()
                  ? logsCopy.saveQueryDisabled
                  : undefined
              }
              onClick={() => {
                const next = [committedQuery, ...saved.filter((q) => q !== committedQuery)];
                setSaved(next);
                safeWriteSaved(next);
              }}
            >
              {logsCopy.saveQuery}
            </Button>
            {saved.length === 0 ? (
              <span className="text-xs text-text-faint">{logsCopy.noSavedQueries}</span>
            ) : (
              <div className="flex flex-wrap gap-1" data-testid="log-saved-queries">
                {saved.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="max-w-[180px] truncate rounded-[var(--radius-control)] border border-border px-2 py-0.5 font-mono text-xs text-text-muted hover:text-text"
                    onClick={() => {
                      setQuery(q);
                      setCommittedQuery(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div
          className="flex h-40 items-center justify-center rounded-[var(--radius-panel)] border border-border bg-surface-1 text-sm text-text-muted"
          data-testid="log-loading"
        >
          {logsCopy.loading}
        </div>
      ) : filtered.predicateError ? (
        <div
          className="rounded-[var(--radius-panel)] border border-danger/40 bg-surface-1 p-4"
          data-testid="log-filter-error"
        >
          <p className="text-sm text-danger">{logsCopy.errorTitle}</p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {filtered.predicateError.message}
          </p>
        </div>
      ) : filtered.rows.length === 0 ? (
        <div
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
          data-testid="log-empty"
        >
          <p className="text-sm text-text">{logsCopy.emptyTitle}</p>
          <p className="mt-1 text-xs text-text-muted">{logsCopy.emptyBody}</p>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={parentRef}
            className="h-[320px] min-h-[240px] flex-1 overflow-auto rounded-[var(--radius-panel)] border border-border bg-surface-1"
            data-testid="log-table"
          >
            <div
              className="sticky top-0 z-10 grid border-b border-border bg-surface-2 text-xs text-text-muted"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(96px, 1fr))`,
              }}
            >
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="border-r border-border px-2 py-2 font-medium last:border-r-0"
                >
                  {col.label}
                </div>
              ))}
            </div>
            <div
              style={{ height: virtualizer.getTotalSize(), position: "relative" }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = filtered.rows[virtualRow.index]!;
                const isExtra = extraRows.some((e) => e.id === row.id);
                return (
                  <div
                    key={row.id}
                    data-testid={`log-row-${row.id}`}
                    data-log-id={row.id}
                    className={cn(
                      "absolute left-0 grid w-full cursor-pointer border-b border-border/60 hover:bg-surface-2",
                      selectedId === row.id && "bg-surface-3",
                      isExtra &&
                        "bg-[color-mix(in_srgb,var(--signal)_8%,transparent)] motion-reduce:transition-none",
                    )}
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                      gridTemplateColumns: `repeat(${columns.length}, minmax(96px, 1fr))`,
                    }}
                    onClick={() => setSelectedId(row.id)}
                  >
                    {columns.map((col) => {
                      const value = getCellValue(row, col.id);
                      const display =
                        col.id === "receiveTime"
                          ? formatAbsolute(new Date(value), "IST")
                          : value;
                      const zones =
                        col.id === "receiveTime"
                          ? formatBothZones(new Date(value))
                          : null;
                      return (
                        <div
                          key={col.id}
                          className="truncate border-r border-border/40 px-2 font-mono text-xs leading-[inherit] text-text last:border-r-0"
                          style={{ lineHeight: `${rowHeight}px` }}
                          title={
                            zones
                              ? `${zones.ist} / ${zones.utc}`
                              : value || undefined
                          }
                          onContextMenu={(e) => openCellMenu(e, row, col.id)}
                          onDoubleClick={(e) => openCellMenu(e, row, col.id)}
                        >
                          {display || "-"}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {selected ? (
            <aside
              className="absolute inset-x-0 bottom-0 z-20 max-h-[45%] overflow-y-auto rounded-b-[var(--radius-panel)] border border-t border-border bg-surface-1/95 p-3 backdrop-blur-sm"
              data-testid="log-detail-drawer"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-text">{logsCopy.detailTitle}</h3>
                <div className="flex gap-1">
                  {onPin ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      data-testid="log-detail-pin"
                      onClick={() => pinRecord(selected)}
                      aria-label={logsCopy.pin}
                    >
                      <Pin className="h-3.5 w-3.5" aria-hidden />
                      {logsCopy.pin}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={logsCopy.closeDetail}
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(selected).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-text-faint">{key}</dt>
                    <dd className="break-all font-mono text-xs text-text">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          ) : null}
        </div>
      )}

      {menu ? (
        <div
          className="fixed z-50 min-w-[160px] rounded-[var(--radius-control)] border border-border bg-surface-2 py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          data-testid="log-cell-menu"
          role="menu"
        >
          {columnToQueryField(menu.column) && menu.value ? (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text hover:bg-surface-3"
                onClick={() => {
                  const field = columnToQueryField(menu.column)!;
                  const next = `( ${field} eq ${menu.value} )`;
                  setQuery(next);
                  setCommittedQuery(next);
                  setMenu(null);
                }}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                {logsCopy.filterBy}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text hover:bg-surface-3"
                onClick={() => {
                  const field = columnToQueryField(menu.column)!;
                  const clause = `( ${field} neq ${menu.value} )`;
                  const next = committedQuery.trim()
                    ? `( ${committedQuery} ) and ${clause}`
                    : clause;
                  setQuery(next);
                  setCommittedQuery(next);
                  setMenu(null);
                }}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                {logsCopy.exclude}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text hover:bg-surface-3"
            onClick={() => {
              void copyText(menu.value);
              setMenu(null);
            }}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {logsCopy.copy}
          </button>
          {onPin ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text hover:bg-surface-3"
              data-testid="log-cell-pin"
              onClick={() => {
                pinRecord(menu.record);
                setMenu(null);
              }}
            >
              <Pin className="h-3.5 w-3.5" aria-hidden />
              {logsCopy.pin}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
