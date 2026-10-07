import logsData from "@/data/logs.json";
import hostsData from "@/data/hosts.json";
import networksData from "@/data/networks.json";
import usersData from "@/data/users.json";
import { INCIDENT_TIMES, LOG_TYPE_ORDER } from "@/content/investigate";
import { getDemoClock } from "@/lib/time";
import { parseQuery, type Predicate } from "@/lib/query-parser";
import type {
  Alert,
  Host,
  InvestigationView,
  LogRecord,
  LogType,
  RemoteNetwork,
  User,
} from "@/types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const MINUTE_MS = MINUTE;
export const HOUR_MS = HOUR;

/** All log records, oldest first. */
export const ALL_LOGS: readonly LogRecord[] = [...(logsData as LogRecord[])].sort(
  (a, b) => Date.parse(a.time) - Date.parse(b.time),
);

const LOGS_BY_ID: ReadonlyMap<string, LogRecord> = new Map(ALL_LOGS.map((log) => [log.id, log]));

export function getLogById(id: string): LogRecord | undefined {
  return LOGS_BY_ID.get(id);
}

const users = usersData as User[];
const hosts = hostsData as Host[];
const networks = networksData as RemoteNetwork[];

export interface TimeWindow {
  /** Epoch ms. */
  start: number;
  /** Epoch ms. */
  end: number;
}

export function toWindow(view: Pick<InvestigationView, "windowStart" | "windowEnd">): TimeWindow {
  return { start: Date.parse(view.windowStart), end: Date.parse(view.windowEnd) };
}

export function fromWindow(window: TimeWindow): Pick<InvestigationView, "windowStart" | "windowEnd"> {
  return {
    windowStart: new Date(window.start).toISOString(),
    windowEnd: new Date(window.end).toISOString(),
  };
}

/** Key used for the unscoped /logs view in the store. */
export const LOGS_VIEW_KEY = "logs";

/** The time the investigation centres on: the known incident time if there is one, otherwise when the alert was raised. */
export function incidentTime(alert: Alert): number {
  return Date.parse(INCIDENT_TIMES[alert.id] ?? alert.createdAt);
}

export function centeredWindow(center: number, halfWidth: number): TimeWindow {
  return { start: center - halfWidth, end: center + halfWidth };
}

export const DEFAULT_HALF_WINDOW = 15 * MINUTE;

/** /logs without an alert covers the 24 hours before the demo clock. */
export function unscopedRange(): TimeWindow {
  const now = getDemoClock().getTime();
  return { start: now - 24 * HOUR, end: now };
}

/** Wider range the histogram shows for an alert: one hour either side of the incident. */
export function histogramRange(alert: Alert | null): TimeWindow {
  return alert ? centeredWindow(incidentTime(alert), HOUR) : unscopedRange();
}

function knownAssetQuery(alert: Alert): string[] {
  const { users: userEntities = [], ips = [], hosts: hostEntities = [], sites = [] } = alert.entities;
  const clauses: string[] = [];
  const add = (clause: string) => {
    if (!clauses.includes(clause)) clauses.push(clause);
  };
  const hostClause = (host: Host) =>
    host.role === "firewall" ? `( device eq ${host.hostname} )` : `( addr.src in ${host.ip} )`;

  const coveredUsers = new Set<string>();
  for (const ip of ips) {
    const user = users.find((u) => u.ip === ip);
    if (user) {
      coveredUsers.add(user.email);
      add(`( addr.src in ${ip} )`);
      continue;
    }
    const host = hosts.find((h) => h.ip === ip);
    if (host) {
      add(hostClause(host));
      continue;
    }
    const network = networks.find((n) => n.peerIp === ip || n.prismaIp === ip);
    if (network) add(`( device eq ${network.device} )`);
  }
  for (const name of hostEntities) {
    const host = hosts.find((h) => h.hostname === name);
    add(host ? hostClause(host) : `( device eq ${name} )`);
  }
  for (const name of sites) {
    const network = networks.find((n) => n.name === name);
    if (network) add(`( device eq ${network.device} )`);
  }
  for (const email of userEntities) {
    if (!coveredUsers.has(email)) add(`( user.src eq ${email} )`);
  }
  return clauses;
}

/**
 * Query prefilled from alert entities. Internal assets become the subject of the query.
 * External or peer addresses stay out so they do not hide the subject's own traffic.
 */
export function buildAlertQuery(alert: Alert): string {
  const clauses = knownAssetQuery(alert);
  if (clauses.length === 0) {
    clauses.push(...(alert.entities.ips ?? []).map((ip) => `( addr.src in ${ip} )`));
  }
  return clauses.join(" or ");
}

export function filterLogs(
  logs: readonly LogRecord[],
  window: TimeWindow,
  predicate: Predicate,
): LogRecord[] {
  return logs.filter((log) => {
    const t = Date.parse(log.time);
    return t >= window.start && t <= window.end && predicate(log);
  });
}

export function countByType(logs: readonly LogRecord[]): Record<LogType, number> {
  const counts: Record<LogType, number> = {
    traffic: 0,
    threat: 0,
    url: 0,
    decryption: 0,
    system: 0,
    config: 0,
  };
  logs.forEach((log) => {
    counts[log.type] += 1;
  });
  return counts;
}

/** Counts per equal width bin across the range. Logs outside the range are ignored. */
export function histogramBins(
  logs: readonly LogRecord[],
  range: TimeWindow,
  binCount: number,
): number[] {
  const bins = Array.from({ length: binCount }, () => 0);
  const width = (range.end - range.start) / binCount;
  logs.forEach((log) => {
    const t = Date.parse(log.time);
    if (t < range.start || t > range.end) return;
    const index = Math.min(binCount - 1, Math.floor((t - range.start) / width));
    bins[index] += 1;
  });
  return bins;
}

/** First tab, in display order, that has rows. Falls back to traffic. */
export function firstTabWithRows(counts: Record<LogType, number>): LogType {
  return LOG_TYPE_ORDER.find((type) => counts[type] > 0) ?? "traffic";
}

/** Starting state for an alert or for /logs. Computed from data, never from the system clock. */
export function defaultView(alert: Alert | null): InvestigationView {
  if (!alert) {
    return { query: "", ...fromWindow(unscopedRange()), tab: "traffic" };
  }
  const window = centeredWindow(incidentTime(alert), DEFAULT_HALF_WINDOW);
  const query = buildAlertQuery(alert);
  const parsed = parseQuery(query);
  const rows = filterLogs(ALL_LOGS, window, parsed.ok ? parsed.predicate : () => true);
  return { query, ...fromWindow(window), tab: firstTabWithRows(countByType(rows)) };
}
