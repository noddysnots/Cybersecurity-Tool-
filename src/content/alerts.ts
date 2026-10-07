import type { AlertStatus, Severity } from "@/types";

export const ALERTS_COPY = {
  title: "Alerts",
  summaryLabel: "Filter by severity",
  summaryAll: "All",
  searchLabel: "Search alerts",
  searchPlaceholder: "Search by title, id, user, IP or host",
  searchHint: "Press / to search",
  filtersLabel: "Filters",
  activeFiltersLabel: "Active filters",
  clearAll: "Clear all",
  clearFilters: "Clear filters",
  tableLabel: "Alerts queue",
  loadingLabel: "Loading alerts",
  guidedBadge: "Guided",
  assignToMe: "Assign to me",
  markFalsePositive: "Mark false positive",
  unassigned: "Unassigned",
  youSuffix: "you",
  moreEntities: (count: number) => `+${count} more`,
  count: (shown: number, total: number) =>
    shown === total ? `${total} alerts` : `${shown} of ${total} alerts`,
  keyboardHint: "j and k move, Enter opens, / searches",
  emptyTitle: "No alerts match these filters",
  emptyBody: "Widen the time range or clear a filter to see more alerts.",
  errorTitle: "Could not load the alerts queue",
  errorBody: "Something went wrong while reading alert data. Try again, or reload the page.",
  retry: "Try again",
  removeFilter: (label: string) => `Remove filter ${label}`,
  sortBy: (label: string) => `Sort by ${label}`,
  shortcutsHint: "Press ? for keyboard shortcuts",
} as const;

export const COLUMN_LABELS = {
  severity: "Severity",
  alert: "Alert",
  entities: "Entities",
  firstSeen: "First seen",
  status: "Status",
  assignee: "Assignee",
  actions: "Quick actions",
} as const;

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export const STATUS_LABELS: Record<AlertStatus, string> = {
  new: "New",
  investigating: "Investigating",
  resolved: "Resolved",
  escalated: "Escalated",
  false_positive: "False positive",
};

export const CATEGORY_LABELS = {
  access: "Access",
  connectivity: "Connectivity",
  threat: "Threat",
  policy: "Policy",
} as const;

export const RANGE_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "1h", label: "Last hour" },
  { value: "4h", label: "Last 4 hours" },
  { value: "12h", label: "Last 12 hours" },
  { value: "24h", label: "Last 24 hours" },
] as const;

export const FILTER_LABELS = {
  severity: "Severity",
  status: "Status",
  category: "Category",
  range: "Time range",
  assignee: "Assignee",
  q: "Search",
} as const;

export const FILTER_ANY = {
  severity: "Any severity",
  status: "Any status",
  category: "Any category",
  assignee: "Any assignee",
} as const;

export const TOASTS = {
  assigned: (id: string) => `Assigned ${id} to you`,
  falsePositive: (id: string) => `Marked ${id} as false positive`,
} as const;
