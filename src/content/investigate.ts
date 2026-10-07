import type { LogType, StepId } from "@/types";

/**
 * Incident times that differ from when the alert was raised.
 * ALR-1042: the user reported "around 2:20 PM" (PLAN.md section 7).
 * ALR-1037: tunnel went down at 11:42:08 IST. ALR-1049: first beacon at 09:12:05 IST.
 */
export const INCIDENT_TIMES: Record<string, string> = {
  "ALR-1042": "2026-10-06T08:50:00.000Z",
  "ALR-1037": "2026-10-06T06:12:08.000Z",
  "ALR-1049": "2026-10-06T03:42:05.000Z",
};

export const LOG_TYPE_ORDER: readonly LogType[] = [
  "traffic",
  "threat",
  "url",
  "decryption",
  "system",
  "config",
];

export const LOG_TYPE_LABELS: Record<LogType, string> = {
  traffic: "Traffic",
  threat: "Threat",
  url: "URL",
  decryption: "Decryption",
  system: "System",
  config: "Config",
};

export const LOG_TABS_LABEL = "Log types";

export const STEPS: readonly { id: StepId; label: string; hint: string }[] = [
  { id: "scope", label: "Scope time", hint: "Confirm the incident window" },
  { id: "logs", label: "Check logs", hint: "Pin what you find" },
  { id: "console", label: "Verify in console", hint: "Run a diagnostic" },
  { id: "resolve", label: "Resolve", hint: "Close or escalate" },
];

export const WORKSPACE_COPY = {
  stepRailLabel: "Investigation steps",
  stepDone: "Done",
  stepCurrent: "Current step",
  resolve: "Resolve",
  escalate: "Escalate",
  entitiesLabel: "Alert entities",
  copyEntity: (value: string) => `Copy ${value}`,
  alertNotFoundTitle: "Alert not found",
  alertNotFoundBody: "No alert matches this link. Go back to the alerts queue and pick one.",
  backToAlerts: "Back to alerts",
  loadingLabel: "Loading investigation",
} as const;

export const LOGS_COPY = {
  title: "Logs",
  intro: "All logs from the last 24 hours. Narrow with a query or the time window.",
} as const;

export const TIME_COPY = {
  label: "Time scope",
  incident: (time: string) => `Incident around ${time}`,
  unscoped: "Last 24 hours",
  windowLabel: (start: string, end: string) => `${start} to ${end}`,
  presetsLabel: "Window size",
  confirm: "Confirm window",
  confirmed: "Window confirmed",
  histogramLabel: "Events over time. Drag the highlighted window to adjust it.",
  windowMove: "Move window",
  windowStart: "Window start",
  windowEnd: "Window end",
  eventsInWindow: (count: number) => (count === 1 ? "1 event in window" : `${count} events in window`),
} as const;

export interface WindowPreset {
  id: string;
  label: string;
  /** Half width of the window in minutes, centred on the incident. */
  halfMinutes: number;
}

export const ALERT_PRESETS: readonly WindowPreset[] = [
  { id: "5m", label: "+/-5m", halfMinutes: 5 },
  { id: "15m", label: "+/-15m", halfMinutes: 15 },
  { id: "1h", label: "+/-1h", halfMinutes: 60 },
];

export interface UnscopedPreset {
  id: string;
  label: string;
  /** Length of the window in hours, ending at the demo clock. */
  hours: number;
}

export const LOGS_PRESETS: readonly UnscopedPreset[] = [
  { id: "1h", label: "Last 1h", hours: 1 },
  { id: "6h", label: "Last 6h", hours: 6 },
  { id: "24h", label: "Last 24h", hours: 24 },
];

export const TIMELINE_COPY = {
  label: "Correlated timeline",
  rowLabel: (type: string, count: number) => `${type}: ${count} in window`,
  openTab: (type: string) => `Show ${type} logs`,
} as const;

export const QUERY_COPY = {
  label: "Query",
  placeholder: "( addr.src in 10.20.14.37 ) and ( app eq ssl )",
  run: "Run query",
  resetToAlert: "Reset to alert query",
  clear: "Clear query",
  focusHint: "Press / to focus",
  suggestionsLabel: "Query suggestions",
  errorPrefix: "Problem in query",
  invalidBody: "Fix the query to see matching logs.",
  fieldKind: "Field",
  operatorKind: "Operator",
  valueKind: "Value",
  connectorKind: "Connector",
} as const;

export const TABLE_COPY = {
  tableLabel: (type: string) => `${type} logs`,
  loadingLabel: "Loading logs",
  emptyTitle: "No logs in this window",
  emptyBody: "Nothing matches this query in the selected time range.",
  widen: "Widen to +/-1h",
  clearQuery: "Clear query",
  errorTitle: "Could not load logs",
  errorBody: "Something went wrong while reading log data. Try again, or reload the page.",
  retry: "Try again",
  rowCount: (shown: number) => (shown === 1 ? "1 row" : `${shown} rows`),
  keyboardHint: "j and k move, Enter opens, p pins",
  density: "Row density",
  compact: "Compact",
  comfortable: "Comfortable",
  columns: "Columns",
  columnsLabel: "Show or hide columns",
  resizeColumn: (label: string) => `Resize ${label} column`,
  noSeverity: "No severity",
  emptyCell: "-",
} as const;

/** Column headers for the log table. Sentence case. */
export const LOG_COLUMN_LABELS = {
  time: "Time",
  srcIp: "Source IP",
  dstIp: "Destination IP",
  srcUser: "User",
  app: "App",
  rule: "Rule",
  action: "Action",
  dstPort: "Dst port",
  sessionEndReason: "Session end",
  bytesSent: "Bytes sent",
  bytesReceived: "Bytes recv",
  threatName: "Threat",
  severity: "Severity",
  urlCategory: "URL category",
  url: "URL",
  message: "Message",
  device: "Device",
  location: "Location",
} as const;

/** Field labels in the detail drawer. */
export const LOG_FIELD_LABELS: Record<string, string> = {
  id: "Log id",
  type: "Type",
  time: "Time",
  srcIp: "Source IP",
  dstIp: "Destination IP",
  srcUser: "Source user",
  dstPort: "Destination port",
  app: "Application",
  rule: "Rule",
  action: "Action",
  urlCategory: "URL category",
  threatName: "Threat name",
  severity: "Severity",
  sessionEndReason: "Session end reason",
  bytesSent: "Bytes sent",
  bytesReceived: "Bytes received",
  device: "Device",
  location: "Location",
  message: "Message",
  url: "URL",
};

export const CELL_MENU_COPY = {
  filterBy: "Filter by",
  exclude: "Exclude",
  copy: "Copy",
  pin: "Pin",
  unpin: "Unpin",
  menuLabel: (value: string) => `Actions for ${value}`,
} as const;

export const DRAWER_COPY = {
  label: "Log details",
  title: "Log details",
  close: "Close details",
  pin: "Pin as evidence",
  unpin: "Remove from evidence",
  pinUnavailable: "Open an alert to pin evidence",
  copy: "Copy",
  copyField: (label: string) => `Copy ${label}`,
} as const;

export const EVIDENCE_COPY = {
  title: "Evidence",
  count: (n: number) => (n === 1 ? "1 item" : `${n} items`),
  collapse: "Collapse evidence tray",
  expand: "Expand evidence tray",
  empty: "Nothing pinned yet. Select a row and press p, or use Pin as evidence.",
  remove: (label: string) => `Remove ${label} from evidence`,
  moveUp: (label: string) => `Move ${label} up`,
  moveDown: (label: string) => `Move ${label} down`,
  open: (label: string) => `Open details for ${label}`,
  missing: "Log record is no longer available",
  listLabel: "Pinned evidence, in order",
} as const;

export const CONSOLE_STUB_COPY = {
  title: "Console",
  body: "The diagnostic console arrives in a later phase.",
} as const;

export const INVESTIGATE_TOASTS = {
  pinned: "Pinned to evidence",
  unpinned: "Removed from evidence",
  copied: (value: string) => `Copied ${value}`,
  filtered: (value: string) => `Filtering by ${value}`,
  excluded: (value: string) => `Excluding ${value}`,
  windowConfirmed: "Window confirmed",
} as const;

export const ROUTE_ERROR_COPY = {
  title: "Could not open the investigation",
  body: "Something went wrong while building this view. Try again, or go back to the alerts queue.",
  retry: "Try again",
} as const;
