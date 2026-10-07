import {
  configAudit,
  logs,
  mobileUsers,
  platformAlerts,
  remoteNetworks,
  tickets,
} from "@/data";
import {
  selectPuneTunnelStatus,
  useCaseEngine,
  type CaseTicketId,
} from "@/lib/case-engine";
import { DEMO_NOW, now } from "@/lib/time";
import type {
  ConfigChange,
  PlatformAlert,
  Ticket,
  TicketPriority,
  TrafficLogRecord,
} from "@/types";

const BLOCK_ACTIONS = new Set([
  "deny",
  "drop",
  "reset-both",
  "reset-client",
  "reset-server",
]);

export type SlaInfo = {
  totalMinutes: number;
  remainingMinutes: number;
  fractionLeft: number;
  label: string;
  breached: boolean;
};

export type ActiveTicketCard = {
  ticket: Ticket;
  sla: SlaInfo;
  lastCustomerMessage: string;
  statusLabel: string;
};

export type BlockedAppBar = {
  app: string;
  count: number;
};

export type TrafficPoint = {
  label: string;
  istHour: number;
  istMinute: number;
  count: number;
  isDropMarker: boolean;
};

function formatMinutes(total: number): string {
  const abs = Math.abs(total);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function computeSla(ticket: Ticket, at: Date = now()): SlaInfo {
  const opened = Date.parse(ticket.openedAt);
  const deadline = opened + ticket.slaResponseMinutes * 60_000;
  const remainingMs = deadline - at.getTime();
  const remainingMinutes = Math.round(remainingMs / 60_000);
  const fractionLeft = Math.max(
    0,
    Math.min(1, remainingMs / (ticket.slaResponseMinutes * 60_000)),
  );
  const breached = remainingMinutes < 0;
  return {
    totalMinutes: ticket.slaResponseMinutes,
    remainingMinutes,
    fractionLeft,
    label: breached
      ? `${formatMinutes(remainingMinutes)} over`
      : formatMinutes(remainingMinutes),
    breached,
  };
}

export function priorityTone(priority: TicketPriority): string {
  switch (priority) {
    case "P1":
      return "var(--priority-p1)";
    case "P2":
      return "var(--priority-p2)";
    case "P3":
      return "var(--priority-p3)";
    case "P4":
      return "var(--priority-p4)";
  }
}

export function getActiveWorkableTickets(): ActiveTicketCard[] {
  const caseState = useCaseEngine.getState();
  return tickets
    .filter((t) => t.workable)
    .map((ticket) => {
      const caseTicket = caseState.tickets[ticket.id as CaseTicketId];
      const lastCustomer =
        [...(caseTicket?.thread ?? [])]
          .reverse()
          .find((m) => m.author === "customer")?.body ?? ticket.description;
      const status = caseTicket?.status ?? ticket.status;
      const statusLabel = status.replaceAll("_", " ");
      return {
        ticket: {
          ...ticket,
          status,
        },
        sla: computeSla(ticket),
        lastCustomerMessage: lastCustomer,
        statusLabel,
      };
    })
    .sort((a, b) => {
      const order: Record<TicketPriority, number> = {
        P1: 0,
        P2: 1,
        P3: 2,
        P4: 3,
      };
      return order[a.ticket.priority] - order[b.ticket.priority];
    });
}

export function getRemoteNetworkHealth() {
  const puneState = selectPuneTunnelStatus(useCaseEngine.getState());
  const sites = remoteNetworks.map((rn) => {
    if (rn.id === "rn-pune-branch-01") {
      return { ...rn, tunnelState: puneState };
    }
    return rn;
  });
  const up = sites.filter((s) => s.tunnelState === "up").length;
  return {
    sites,
    up,
    total: sites.length,
    puneState,
    locations: [
      { id: "india-west", label: "India West", status: puneState === "down" ? "degraded" : "up" },
      { id: "india-south", label: "India South", status: "up" as const },
    ],
  };
}

export function getMobileUserConnectedCount(): number {
  return mobileUsers.filter((u) => u.status === "connected").length;
}

const FEATURED_CHANGE_IDS = new Set(["CHG-5120", "CHG-4471"]);

export function getRecentConfigChanges(limit = 5): ConfigChange[] {
  const windowStart = DEMO_NOW.getTime() - 24 * 60 * 60 * 1000;
  const inWindow = [...configAudit]
    .filter((c) => Date.parse(c.timestamp) >= windowStart)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const featured = inWindow.filter((c) => FEATURED_CHANGE_IDS.has(c.changeId));
  const rest = inWindow.filter((c) => !FEATURED_CHANGE_IDS.has(c.changeId));
  // Keep the case needles visible among the recent strip (PLAN 6.4).
  const fillers = rest.slice(0, Math.max(0, limit - featured.length));
  return [...featured, ...fillers].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
}

export function getTopBlockedApps(limit = 6): BlockedAppBar[] {
  const traffic = logs.filter((l): l is TrafficLogRecord => l.type === "traffic");
  const counts = new Map<string, number>();
  for (const row of traffic) {
    if (!BLOCK_ACTIONS.has(row.action)) continue;
    counts.set(row.app, (counts.get(row.app) ?? 0) + 1);
  }

  // Baseline zero bars for common collab apps so stun reads as the spike.
  for (const app of ["ms-teams", "zoom", "ssl", "web-browsing"]) {
    if (!counts.has(app)) counts.set(app, 0);
  }

  return [...counts.entries()]
    .map(([app, count]) => ({ app, count }))
    .sort((a, b) => b.count - a.count || a.app.localeCompare(b.app))
    .slice(0, limit);
}

/** Stun drops by IST hour for the spike callout since 09:00. */
export function getStunHourlySpike(): { hourLabel: string; count: number }[] {
  const traffic = logs.filter(
    (l): l is TrafficLogRecord =>
      l.type === "traffic" && l.app === "stun" && BLOCK_ACTIONS.has(l.action),
  );
  const hours = [7, 8, 9, 10, 11, 12];
  return hours.map((hour) => ({
    hourLabel: `${String(hour).padStart(2, "0")}:00`,
    count: traffic.filter((row) => {
      const istHour = new Date(
        Date.parse(row.receiveTime) + 5.5 * 3_600_000,
      ).getUTCHours();
      return istHour === hour;
    }).length,
  }));
}

/** Branch RN India West traffic by 15-minute buckets; Pune drop marked at 11:42 IST. */
export function getPuneTrafficTrend(): TrafficPoint[] {
  const traffic = logs.filter(
    (l): l is TrafficLogRecord =>
      l.type === "traffic" &&
      l.deviceName === "prisma-rn-india-west" &&
      l.container === "Remote Networks",
  );

  // Buckets from 10:00 to 12:30 IST on demo day (04:30 to 07:00 UTC).
  const startUtc = Date.parse("2026-10-06T04:30:00.000Z");
  const endUtc = Date.parse("2026-10-06T07:00:00.000Z");
  const bucketMs = 15 * 60_000;
  const points: TrafficPoint[] = [];

  for (let t = startUtc; t < endUtc; t += bucketMs) {
    const ist = new Date(t + 5.5 * 3_600_000);
    const istHour = ist.getUTCHours();
    const istMinute = ist.getUTCMinutes();
    const dropAt = Date.parse("2026-10-06T06:12:00.000Z"); // 11:42 IST
    const count =
      t >= dropAt
        ? 0
        : traffic.filter((row) => {
            const rt = Date.parse(row.receiveTime);
            return rt >= t && rt < t + bucketMs;
          }).length;
    const label = `${String(istHour).padStart(2, "0")}:${String(istMinute).padStart(2, "0")}`;
    points.push({
      label,
      istHour,
      istMinute,
      count,
      isDropMarker: t === Date.parse("2026-10-06T06:00:00.000Z") || label === "11:30",
    });
  }

  // Ensure the 11:30 bucket shows residual then cliff, and annotate 11:42.
  const cliffIdx = points.findIndex((p) => p.label === "11:30");
  if (cliffIdx >= 0) {
    points[cliffIdx] = {
      ...points[cliffIdx],
      count: Math.max(points[cliffIdx].count, 3),
      isDropMarker: true,
    };
  }
  const after = points.findIndex((p) => p.label === "11:45");
  if (after >= 0) {
    points[after] = { ...points[after], count: 0, isDropMarker: true };
  }

  return points;
}

export function getOpenPlatformAlerts(): PlatformAlert[] {
  const puneFixed = selectPuneTunnelStatus(useCaseEngine.getState()) === "up";
  return platformAlerts
    .filter((a) => a.clearedAt === null)
    .filter((a) => !(puneFixed && a.id === "ALT-88421"))
    .sort((a, b) => Date.parse(b.raisedAt) - Date.parse(a.raisedAt));
}

export function getNotificationCount(): number {
  const caseState = useCaseEngine.getState();
  let count = 0;
  for (const ticket of Object.values(caseState.tickets)) {
    if (ticket.closed) continue;
    const last = ticket.thread[ticket.thread.length - 1];
    if (last?.author === "customer") count += 1;
  }
  return count;
}
