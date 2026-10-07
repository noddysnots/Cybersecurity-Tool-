import { parseQuery, type LogPredicate } from "@/lib/query-parser";
import { DEMO_NOW, DEMO_NOW_ISO } from "@/lib/time";
import type { LogRecord, LogType, TrafficLogRecord } from "@/types";

export type LogDensity = "comfortable" | "compact";

export type LogColumnId =
  | "receiveTime"
  | "type"
  | "srcIp"
  | "dstIp"
  | "srcUser"
  | "app"
  | "rule"
  | "action"
  | "dstPort"
  | "protocol"
  | "container"
  | "location"
  | "bytes";

export type LogColumnDef = {
  id: LogColumnId;
  label: string;
  defaultVisible: boolean;
};

export const LOG_COLUMNS: LogColumnDef[] = [
  { id: "receiveTime", label: "Time", defaultVisible: true },
  { id: "type", label: "Type", defaultVisible: true },
  { id: "srcIp", label: "Source", defaultVisible: true },
  { id: "dstIp", label: "Destination", defaultVisible: true },
  { id: "srcUser", label: "User", defaultVisible: true },
  { id: "app", label: "App", defaultVisible: true },
  { id: "rule", label: "Rule", defaultVisible: true },
  { id: "action", label: "Action", defaultVisible: true },
  { id: "dstPort", label: "Port", defaultVisible: true },
  { id: "protocol", label: "Proto", defaultVisible: false },
  { id: "container", label: "Container", defaultVisible: true },
  { id: "location", label: "Location", defaultVisible: false },
  { id: "bytes", label: "Bytes", defaultVisible: false },
];

export const LOG_TYPES: Array<LogType | "all"> = [
  "all",
  "traffic",
  "url",
  "threat",
  "decryption",
  "globalprotect",
  "system",
  "config",
];

export function countByType(records: LogRecord[]): Record<LogType | "all", number> {
  const counts: Record<LogType | "all", number> = {
    all: records.length,
    traffic: 0,
    url: 0,
    threat: 0,
    decryption: 0,
    globalprotect: 0,
    system: 0,
    config: 0,
  };
  for (const row of records) {
    counts[row.type] += 1;
  }
  return counts;
}

export function getCellValue(record: LogRecord, column: LogColumnId): string {
  switch (column) {
    case "receiveTime":
      return record.receiveTime;
    case "type":
      return record.type;
    case "srcIp":
      return "srcIp" in record ? record.srcIp : "";
    case "dstIp":
      return "dstIp" in record ? record.dstIp : "";
    case "srcUser":
      return "srcUser" in record ? record.srcUser : "";
    case "app":
      return "app" in record ? record.app : "";
    case "rule":
      return "rule" in record ? record.rule : "";
    case "action":
      return "action" in record ? String(record.action) : "";
    case "dstPort":
      return "dstPort" in record ? String(record.dstPort) : "";
    case "protocol":
      return "protocol" in record ? record.protocol : "";
    case "container":
      return record.container;
    case "location":
      return record.location;
    case "bytes":
      return "bytes" in record ? String(record.bytes) : "";
    default: {
      const _exhaustive: never = column;
      return _exhaustive;
    }
  }
}

export function columnToQueryField(column: LogColumnId): string | null {
  switch (column) {
    case "srcIp":
      return "addr.src";
    case "dstIp":
      return "addr.dst";
    case "srcUser":
      return "user.src";
    case "app":
      return "app";
    case "rule":
      return "rule";
    case "action":
      return "action";
    case "dstPort":
      return "port.dst";
    case "protocol":
      return "proto";
    case "container":
      return "container";
    case "location":
      return "location";
    case "type":
      return "type";
    default:
      return null;
  }
}

export type TimeWindow = { start: string; end: string };

export function windowForPreset(
  preset: "1h" | "4h" | "24h" | "scope",
  scope?: TimeWindow,
): TimeWindow {
  const end = DEMO_NOW_ISO;
  if (preset === "scope" && scope) {
    return { start: scope.start, end: scope.end };
  }
  const hours = preset === "1h" ? 1 : preset === "4h" ? 4 : 24;
  const startMs = DEMO_NOW.getTime() - hours * 60 * 60 * 1000;
  return { start: new Date(startMs).toISOString(), end };
}

export function filterLogs(options: {
  records: LogRecord[];
  type: LogType | "all";
  query: string;
  window: TimeWindow;
}): { rows: LogRecord[]; predicateError: { message: string; position: number } | null } {
  const parsed = parseQuery(options.query);
  if (!parsed.ok) {
    return {
      rows: [],
      predicateError: { message: parsed.error, position: parsed.position },
    };
  }
  const start = Date.parse(options.window.start);
  const end = Date.parse(options.window.end);
  const predicate: LogPredicate = parsed.predicate;
  const rows = options.records
    .filter((row) => {
      if (options.type !== "all" && row.type !== options.type) return false;
      const t = Date.parse(row.receiveTime);
      if (Number.isNaN(t) || t < start || t > end) return false;
      return predicate(row);
    })
    .sort((a, b) => Date.parse(b.receiveTime) - Date.parse(a.receiveTime));
  return { rows, predicateError: null };
}

export type HistogramBucket = {
  startMs: number;
  endMs: number;
  count: number;
};

export function buildHistogram(
  records: LogRecord[],
  window: TimeWindow,
  bucketCount = 48,
): HistogramBucket[] {
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  if (!(end > start) || bucketCount < 1) return [];
  const width = (end - start) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    startMs: start + i * width,
    endMs: start + (i + 1) * width,
    count: 0,
  }));
  for (const row of records) {
    const t = Date.parse(row.receiveTime);
    if (Number.isNaN(t) || t < start || t > end) continue;
    let idx = Math.floor((t - start) / width);
    if (idx >= bucketCount) idx = bucketCount - 1;
    if (idx < 0) idx = 0;
    buckets[idx]!.count += 1;
  }
  return buckets;
}

export function isTraffic(record: LogRecord): record is TrafficLogRecord {
  return record.type === "traffic";
}

export type CompareDiffRow = {
  field: string;
  failing: string;
  working: string;
  different: boolean;
};

export function trafficCompareDiff(
  failing: TrafficLogRecord | undefined,
  working: TrafficLogRecord | undefined,
): CompareDiffRow[] {
  const fields: Array<{ key: keyof TrafficLogRecord; label: string }> = [
    { key: "srcZone", label: "Source zone" },
    { key: "container", label: "Container" },
    { key: "rule", label: "Rule" },
    { key: "app", label: "App" },
    { key: "dstPort", label: "Port" },
    { key: "action", label: "Action" },
    { key: "bytes", label: "Bytes" },
  ];
  return fields.map(({ key, label }) => {
    const f = failing ? String(failing[key] ?? "") : "";
    const w = working ? String(working[key] ?? "") : "";
    return { field: label, failing: f, working: w, different: f !== w };
  });
}
