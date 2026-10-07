import { parseISO } from "date-fns";
import { RANGE_OPTIONS } from "@/content/alerts";
import { getDemoClock } from "@/lib/time";
import type { Alert, AlertOverride, AlertStatus, Severity } from "@/types";

export const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low", "info"];
export const STATUSES: readonly AlertStatus[] = [
  "new",
  "investigating",
  "resolved",
  "escalated",
  "false_positive",
];
export const CATEGORIES: readonly Alert["category"][] = [
  "access",
  "connectivity",
  "threat",
  "policy",
];

export type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

/** Sentinel assignee value for alerts with nobody assigned. */
export const UNASSIGNED = "unassigned";

export interface AlertFilters {
  severity?: Severity;
  status?: AlertStatus;
  category?: Alert["category"];
  range: RangeValue;
  assignee?: string;
  q: string;
}

export const FILTER_KEYS = ["severity", "status", "category", "range", "assignee", "q"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export const DEFAULT_FILTERS: AlertFilters = { range: "all", q: "" };

const RANGE_HOURS: Record<Exclude<RangeValue, "all">, number> = {
  "1h": 1,
  "4h": 4,
  "12h": 12,
  "24h": 24,
};

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((item) => item === value);
}

/** Reads filters from URL search params. Unknown values are dropped. */
export function parseFilters(params: URLSearchParams): AlertFilters {
  const range =
    pick(
      params.get("range"),
      RANGE_OPTIONS.map((o) => o.value),
    ) ?? DEFAULT_FILTERS.range;
  const assignee = params.get("assignee")?.trim();
  return {
    severity: pick(params.get("severity"), SEVERITIES),
    status: pick(params.get("status"), STATUSES),
    category: pick(params.get("category"), CATEGORIES),
    range,
    assignee: assignee ? assignee : undefined,
    q: params.get("q")?.trim() ?? "",
  };
}

/** Writes filters to a query string. Defaults are omitted so URLs stay short. */
export function serializeFilters(filters: AlertFilters): string {
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.range !== DEFAULT_FILTERS.range) params.set("range", filters.range);
  if (filters.assignee) params.set("assignee", filters.assignee);
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

export function countActiveFilters(filters: AlertFilters): number {
  return FILTER_KEYS.filter((key) =>
    key === "range" ? filters.range !== DEFAULT_FILTERS.range : Boolean(filters[key]),
  ).length;
}

/** Merges local status and assignee changes from the store into the base alerts. */
export function applyOverrides(
  alerts: readonly Alert[],
  overrides: Record<string, AlertOverride>,
): Alert[] {
  return alerts.map((alert) => {
    const override = overrides[alert.id];
    if (!override) return alert;
    return {
      ...alert,
      status: override.status ?? alert.status,
      assignee: override.assignee ?? alert.assignee,
    };
  });
}

function searchText(alert: Alert): string {
  const { users = [], ips = [], hosts = [], sites = [] } = alert.entities;
  return [alert.id, alert.title, alert.source, alert.assignee ?? "", ...users, ...ips, ...hosts, ...sites]
    .join(" ")
    .toLowerCase();
}

/** Applies every filter except the ones named in `skip`. Used so severity counts ignore the severity filter. */
export function filterAlerts(
  alerts: readonly Alert[],
  filters: AlertFilters,
  skip: readonly FilterKey[] = [],
): Alert[] {
  const cutoff =
    filters.range === "all" || skip.includes("range")
      ? null
      : getDemoClock().getTime() - RANGE_HOURS[filters.range] * 60 * 60 * 1000;
  const query = filters.q.toLowerCase();
  return alerts.filter((alert) => {
    if (filters.severity && !skip.includes("severity") && alert.severity !== filters.severity) {
      return false;
    }
    if (filters.status && !skip.includes("status") && alert.status !== filters.status) return false;
    if (filters.category && !skip.includes("category") && alert.category !== filters.category) {
      return false;
    }
    if (filters.assignee && !skip.includes("assignee")) {
      const match =
        filters.assignee === UNASSIGNED ? !alert.assignee : alert.assignee === filters.assignee;
      if (!match) return false;
    }
    if (cutoff !== null && parseISO(alert.createdAt).getTime() < cutoff) return false;
    if (query && !skip.includes("q") && !searchText(alert).includes(query)) return false;
    return true;
  });
}

export function severityCounts(alerts: readonly Alert[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  alerts.forEach((alert) => {
    counts[alert.severity] += 1;
  });
  return counts;
}

/** Lower rank sorts first. */
export function severityRank(severity: Severity): number {
  return SEVERITIES.indexOf(severity);
}

export function assigneeOptions(alerts: readonly Alert[]): string[] {
  return Array.from(new Set(alerts.flatMap((a) => (a.assignee ? [a.assignee] : [])))).sort();
}

export function entityList(alert: Alert): string[] {
  const { users = [], ips = [], hosts = [], sites = [] } = alert.entities;
  return [...users, ...hosts, ...ips, ...sites];
}
