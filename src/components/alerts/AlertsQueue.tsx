"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import alertsData from "@/data/alerts.json";
import { ALERTS_COPY } from "@/content/alerts";
import {
  DEFAULT_FILTERS,
  applyOverrides,
  assigneeOptions,
  countActiveFilters,
  filterAlerts,
  parseFilters,
  serializeFilters,
  severityCounts,
  type AlertFilters,
  type FilterKey,
} from "@/lib/alerts";
import { useAppStore } from "@/lib/store";
import type { Alert } from "@/types";
import { AlertsEmpty } from "./AlertsEmpty";
import { AlertsTable } from "./AlertsTable";
import { FilterBar } from "./FilterBar";
import { FilterChips } from "./FilterChips";
import { SeveritySummary } from "./SeveritySummary";
import { TableSkeleton } from "./TableSkeleton";

const baseAlerts = alertsData as Alert[];
const LOADING_MS = 300;

export function AlertsQueue() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const overrides = useAppStore((s) => s.alertOverrides);
  const hydrated = useAppStore((s) => s.hydrated);

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const filterKey = serializeFilters(filters);

  const latestFilters = useRef(filters);
  useEffect(() => {
    latestFilters.current = filters;
  }, [filters]);

  const update = useCallback(
    (patch: Partial<AlertFilters>) => {
      const next = { ...latestFilters.current, ...patch };
      latestFilters.current = next;
      const qs = serializeFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const [searchKey, setSearchKey] = useState(0);
  const clearAll = useCallback(() => {
    setSearchKey((k) => k + 1);
    update({ ...DEFAULT_FILTERS, severity: undefined, status: undefined, category: undefined, assignee: undefined });
  }, [update]);
  const removeFilter = useCallback(
    (key: FilterKey) => {
      if (key === "q") setSearchKey((k) => k + 1);
      update(key === "range" ? { range: DEFAULT_FILTERS.range } : key === "q" ? { q: "" } : { [key]: undefined });
    },
    [update],
  );

  // Simulated latency: the table shows a skeleton until 300ms after the last filter change.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSettledKey(filterKey), LOADING_MS);
    return () => clearTimeout(timer);
  }, [filterKey]);
  const loading = !hydrated || settledKey !== filterKey;

  const alerts = useMemo(() => applyOverrides(baseAlerts, overrides), [overrides]);
  const visible = useMemo(() => filterAlerts(alerts, filters), [alerts, filters]);
  const counts = useMemo(
    () => severityCounts(filterAlerts(alerts, filters, ["severity"])),
    [alerts, filters],
  );
  const countTotal = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts],
  );
  const assignees = useMemo(() => assigneeOptions(alerts), [alerts]);

  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, select, textarea") !== null)
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section aria-labelledby="page-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h1 id="page-title" className="text-[20px] font-semibold text-text">
          {ALERTS_COPY.title}
        </h1>
        <p className="text-[12px] text-muted-fg">
          <span aria-live="polite">{ALERTS_COPY.count(visible.length, alerts.length)}</span>
          <span className="ml-3">{ALERTS_COPY.keyboardHint}</span>
          <span className="ml-3">{ALERTS_COPY.shortcutsHint}</span>
        </p>
      </div>
      <div data-guide-id="annotate-severity-summary">
        <SeveritySummary
          counts={counts}
          total={countTotal}
          active={filters.severity}
          onChange={(severity) => update({ severity })}
        />
      </div>
      <div data-guide-id="annotate-filter-bar">
        <FilterBar
          filters={filters}
          assignees={assignees}
          searchKey={searchKey}
          searchRef={searchRef}
          onChange={update}
        />
      </div>
      {countActiveFilters(filters) > 0 ? (
        <FilterChips filters={filters} onRemove={removeFilter} onClearAll={clearAll} />
      ) : null}
      <div
        data-guide-id="annotate-alerts-table"
        className="overflow-x-auto rounded-lg border border-border bg-panel"
      >
        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <AlertsEmpty onClear={clearAll} />
        ) : (
          <AlertsTable alerts={visible} />
        )}
      </div>
    </section>
  );
}
