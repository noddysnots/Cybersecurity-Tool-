import {
  AlertTriangle,
  ArrowUpRight,
  CircleAlert,
  Network,
  Radio,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SlaRing } from "@/components/home/SlaRing";
import { homeCopy } from "@/content/home";
import {
  getActiveWorkableTickets,
  getMobileUserConnectedCount,
  getOpenPlatformAlerts,
  getPuneTrafficTrend,
  getRecentConfigChanges,
  getRemoteNetworkHealth,
  getStunHourlySpike,
  getTopBlockedApps,
  priorityTone,
} from "@/lib/home-metrics";
import { useCaseEngine } from "@/lib/case-engine";
import { formatAbsolute } from "@/lib/time";
import { cn } from "@/lib/utils";

function TileShell({
  title,
  href,
  className,
  children,
  testId,
  meta,
}: {
  title: string;
  href: string;
  className?: string;
  children: ReactNode;
  testId: string;
  meta?: string;
}) {
  return (
    <section
      data-testid={testId}
      className={cn(
        "flex min-h-0 flex-col rounded-[var(--radius-tile)] border border-border bg-surface-1 p-3",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-text">{title}</h2>
          {meta ? <p className="mt-0.5 text-xs text-text-muted">{meta}</p> : null}
        </div>
        <Link
          to={href}
          className="inline-flex items-center gap-1 rounded-[var(--radius-control)] px-2 py-1 text-sm text-accent hover:bg-surface-2"
          data-testid={`${testId}-link`}
        >
          {homeCopy.viewAll}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function MyActiveTicketsTile() {
  useCaseEngine((s) => s.tickets);
  const cards = getActiveWorkableTickets();

  return (
    <TileShell
      title={homeCopy.myTickets}
      href="/tickets?tab=active"
      testId="tile-my-tickets"
      className="col-span-12 lg:col-span-7"
    >
      {cards.length === 0 ? (
        <p className="text-sm text-text-muted">{homeCopy.myTicketsEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map(({ ticket, sla, lastCustomerMessage, statusLabel }) => (
            <li
              key={ticket.id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-panel)] border border-border bg-surface-2 px-3 py-2"
              data-testid={`active-ticket-${ticket.id}`}
            >
              <SlaRing sla={sla} priority={ticket.priority} size={48} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-accent">{ticket.id}</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-border px-1.5 py-0.5 text-xs"
                    style={{ color: priorityTone(ticket.priority) }}
                  >
                    <CircleAlert className="h-3 w-3" aria-hidden />
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-text-faint">{statusLabel}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-text">{ticket.subject}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                  <span className="text-text-faint">{homeCopy.lastMessage}: </span>
                  {lastCustomerMessage}
                </p>
              </div>
              <Link
                to={`/tickets/${ticket.id}`}
                className="inline-flex h-8 items-center rounded-[var(--radius-control)] bg-accent px-3 text-sm font-medium text-bg"
              >
                {homeCopy.openTicket}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </TileShell>
  );
}

export function PlatformHealthTile() {
  useCaseEngine((s) => s.tickets);
  const health = getRemoteNetworkHealth();
  const muCount = getMobileUserConnectedCount();

  return (
    <TileShell
      title={homeCopy.platformHealth}
      href="/remote-networks?status=down"
      testId="tile-platform-health"
      className="col-span-12 lg:col-span-5"
      meta={`${homeCopy.locationsUp}, ${health.up}/${health.total} ${homeCopy.remoteNetworks.toLowerCase()} up`}
    >
      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          {health.locations.map((loc) => (
            <div
              key={loc.id}
              className="rounded-[var(--radius-panel)] border border-border bg-surface-2 px-2.5 py-1.5"
            >
              <p className="flex items-center gap-2 text-sm text-text">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    loc.status === "up" ? "bg-signal" : "bg-warn",
                  )}
                  aria-hidden
                />
                {loc.label}
                <span className="text-xs text-text-muted">
                  {loc.status === "up" ? "healthy" : "degraded"}
                </span>
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-border bg-surface-2 px-2.5 py-1.5">
          <div className="flex items-center gap-2 text-sm text-text">
            <Radio className="h-4 w-4 text-signal" aria-hidden />
            {homeCopy.mobileUsers}
          </div>
          <span className="font-mono text-md text-text" data-testid="mu-connected-count">
            {muCount}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-panel)] border px-2.5 py-1.5 text-sm",
            health.puneState === "down"
              ? "border-danger/40 bg-surface-2 text-danger"
              : "border-signal/40 bg-surface-2 text-signal",
          )}
          data-testid="pune-health"
        >
          <Network className="h-4 w-4" aria-hidden />
          {health.puneState === "down" ? homeCopy.puneDown : homeCopy.puneUp}
          <span className="ml-auto font-mono text-xs text-text-muted">
            {health.up}/{health.total}
          </span>
        </div>
      </div>
    </TileShell>
  );
}

export function RecentConfigTile() {
  const changes = getRecentConfigChanges(5);

  return (
    <TileShell
      title={homeCopy.recentConfig}
      href="/config-audit?window=24h"
      testId="tile-recent-config"
      className="col-span-12 lg:col-span-5"
      meta={homeCopy.recentConfigFilter}
    >
      <ul className="flex flex-col gap-1.5">
        {changes.map((change) => {
          const highlight =
            change.changeId === "CHG-5120" || change.changeId === "CHG-4471";
          return (
            <li
              key={change.id}
              className={cn(
                "rounded-[var(--radius-control)] border px-2.5 py-1.5",
                highlight
                  ? "border-warn/50 bg-surface-2"
                  : "border-border bg-surface-2",
              )}
              data-testid={`config-${change.changeId}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-accent">{change.changeId}</span>
                <span className="font-mono text-xs text-text-faint">
                  {formatAbsolute(new Date(change.timestamp), "IST")}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-sm text-text">{change.summary}</p>
              <p className="text-xs text-text-muted">
                {change.admin}, {change.container}
              </p>
            </li>
          );
        })}
      </ul>
    </TileShell>
  );
}

export function TopBlockedAppsTile() {
  const apps = getTopBlockedApps(5);
  const hourly = getStunHourlySpike();
  const max = Math.max(...apps.map((a) => a.count), 1);

  return (
    <TileShell
      title={homeCopy.topBlocked}
      href="/logs?app=stun&action=drop"
      testId="tile-top-blocked"
      className="col-span-12 md:col-span-6 lg:col-span-3"
      meta={homeCopy.topBlockedHint}
    >
      <div className="h-28" data-testid="blocked-apps-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={apps} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="app"
              tick={{ fill: "var(--text-faint)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, max]} />
            <Tooltip
              cursor={{ fill: "var(--surface-3)" }}
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {apps.map((entry) => (
                <Cell
                  key={entry.app}
                  fill={entry.app === "stun" ? "var(--warn)" : "var(--surface-3)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {hourly
          .filter((h) => h.count > 0)
          .map((h) => (
            <span
              key={h.hourLabel}
              className="rounded-[var(--radius-control)] border border-border px-1.5 py-0.5 font-mono text-xs text-text-muted"
            >
              {h.hourLabel} {h.count}
            </span>
          ))}
      </div>
    </TileShell>
  );
}

export function TrafficTrendTile() {
  const points = getPuneTrafficTrend();

  return (
    <TileShell
      title={homeCopy.trafficTrend}
      href="/logs?device=prisma-rn-india-west&site=pune"
      testId="tile-traffic-trend"
      className="col-span-12 md:col-span-6 lg:col-span-4"
      meta={homeCopy.trafficTrendHint}
    >
      <div className="h-28" data-testid="traffic-trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-faint)", fontSize: 10 }}
              interval={1}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--accent)"
              fill="var(--surface-3)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 font-mono text-xs text-danger">11:42 IST cliff to zero</p>
    </TileShell>
  );
}

export function PlatformAlertsTile() {
  useCaseEngine((s) => s.tickets);
  const alerts = getOpenPlatformAlerts().slice(0, 5);

  return (
    <TileShell
      title={homeCopy.platformAlerts}
      href="/alerts?status=open"
      testId="tile-platform-alerts"
      className="col-span-12"
      meta={`${alerts.length} ${homeCopy.openAlerts.toLowerCase()}`}
    >
      <ul className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
        {alerts.slice(0, 4).map((alert) => (
          <li
            key={alert.id}
            className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 py-1.5"
            data-testid={`alert-${alert.id}`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  alert.severity === "critical"
                    ? "text-danger"
                    : alert.severity === "warning"
                      ? "text-warn"
                      : "text-text-muted",
                )}
                aria-hidden
              />
              <span className="font-mono text-xs text-text-faint">{alert.id}</span>
              <span className="text-xs text-text-muted">{alert.severity}</span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-sm text-text">{alert.title}</p>
          </li>
        ))}
      </ul>
    </TileShell>
  );
}
