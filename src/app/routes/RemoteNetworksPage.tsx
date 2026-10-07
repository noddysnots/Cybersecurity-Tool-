import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  DetailDrawer,
  PageChrome,
  ViewEmpty,
  ViewError,
  ViewLoading,
} from "@/components/supporting";
import { Button } from "@/components/ui";
import { remoteNetworksCopy } from "@/content/supporting";
import { configAudit, remoteNetworks } from "@/data";
import { useCaseEngine } from "@/lib/case-engine";
import { getRemoteNetworkHealth } from "@/lib/home-metrics";
import { formatAbsolute } from "@/lib/time";
import { cryptoProfileFor, tunnelHistoryFor } from "@/lib/tunnel-history";
import { useViewState } from "@/lib/use-view-state";
import { cn } from "@/lib/utils";
import type { TunnelState } from "@/types";

export function RemoteNetworksPage() {
  const [params, setParams] = useSearchParams();
  useCaseEngine((s) => s.tickets);
  const health = getRemoteNetworkHealth();


  const q = params.get("q") ?? "";
  const status = (params.get("status") as TunnelState | "all") || "all";
  const location = params.get("location") ?? "all";
  const idParam = params.get("id") ?? "";
  const forceError = params.get("error") === "1";

  const [search, setSearch] = useState(q);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    if (idParam) setSelectedId(idParam);
  }, [idParam]);

  const { phase, retry } = useViewState(
    `${q}|${status}|${location}|${health.puneState}`,
    forceError,
  );

  const locations = useMemo(
    () => [...new Set(remoteNetworks.map((r) => r.location))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return health.sites
      .filter((s) => (status === "all" ? true : s.tunnelState === status))
      .filter((s) => (location === "all" ? true : s.location === location))
      .filter((s) => {
        if (!needle) return true;
        const hay = [s.name, s.peerIp, s.location, s.branchHostname, s.subnet]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (a.tunnelState !== b.tunnelState) return a.tunnelState === "down" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [health.sites, q, status, location]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || value === "") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  function applySearch() {
    setParam("q", search.trim() || null);
  }

  function clearFilters() {
    setSearch("");
    setSelectedId(null);
    setParams(new URLSearchParams(), { replace: true });
  }

  function handleRetry() {
    const next = new URLSearchParams(params);
    next.delete("error");
    setParams(next, { replace: true });
    retry();
  }

  const selected = filtered.find((s) => s.id === selectedId) ??
    health.sites.find((s) => s.id === selectedId) ??
    null;

  const history = selected
    ? tunnelHistoryFor(selected, selected.tunnelState)
    : [];
  const profile = selected ? cryptoProfileFor(selected, selected.tunnelState) : null;
  const relatedChanges = selected
    ? configAudit.filter(
        (c) =>
          c.summary.toLowerCase().includes(selected.name.toLowerCase().split("-")[0] ?? "") ||
          c.path.toLowerCase().includes("ipsec") ||
          (selected.id === "rn-pune-branch-01" && c.changeId === "CHG-4471"),
      )
    : [];

  return (
    <PageChrome
      title={remoteNetworksCopy.title}
      subtitle={remoteNetworksCopy.subtitle}
      seededLabel={`${health.up}/${health.total} remote networks up · Pune-Branch-01 ${health.puneState}`}
      testId="page-remote-networks"
      filterEntries={[...params.entries()]}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            data-testid="rn-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder={remoteNetworksCopy.searchPlaceholder}
            aria-label={remoteNetworksCopy.searchPlaceholder}
            className="h-9 min-w-[200px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-text-faint focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button type="button" size="sm" variant="secondary" onClick={applySearch}>
            Search
          </Button>
          <select
            aria-label={remoteNetworksCopy.filterStatus}
            data-testid="rn-filter-status"
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{remoteNetworksCopy.filterAll} status</option>
            <option value="up">{remoteNetworksCopy.statusUp}</option>
            <option value="down">{remoteNetworksCopy.statusDown}</option>
          </select>
          <select
            aria-label={remoteNetworksCopy.filterLocation}
            data-testid="rn-filter-location"
            value={location}
            onChange={(e) => setParam("location", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{remoteNetworksCopy.filterAll} locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-1">
          {phase === "loading" ? (
            <ViewLoading label={remoteNetworksCopy.loading} testId="rn-loading" />
          ) : null}
          {phase === "error" ? (
            <ViewError
              title={remoteNetworksCopy.errorTitle}
              body={remoteNetworksCopy.errorBody}
              retryLabel={remoteNetworksCopy.retry}
              onRetry={handleRetry}
              testId="rn-error"
            />
          ) : null}
          {phase === "ready" && filtered.length === 0 ? (
            <ViewEmpty
              title={remoteNetworksCopy.emptyTitle}
              body={remoteNetworksCopy.emptyBody}
              clearLabel={remoteNetworksCopy.clearFilters}
              onClear={clearFilters}
              testId="rn-empty"
            />
          ) : null}
          {phase === "ready" && filtered.length > 0 ? (
            <div className="h-full overflow-auto" data-testid="rn-table">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-2 text-xs text-text-faint">
                  <tr>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colName}</th>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colStatus}</th>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colPeer}</th>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colLocation}</th>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colBandwidth}</th>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colUptime}</th>
                    <th className="px-3 py-2 font-medium">{remoteNetworksCopy.colChanged}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((site) => (
                    <tr
                      key={site.id}
                      data-testid={`rn-row-${site.id}`}
                      className={cn(
                        "cursor-pointer border-t border-border hover:bg-surface-2",
                        selectedId === site.id && "bg-surface-3",
                      )}
                      onClick={() => setSelectedId(site.id)}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-text">
                        {site.name}
                        <span className="sr-only"> {site.tunnelState}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-2 py-0.5 text-xs",
                            site.tunnelState === "up"
                              ? "bg-signal/15 text-signal"
                              : "bg-danger/15 text-danger",
                          )}
                          data-testid={`rn-status-${site.id}`}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              site.tunnelState === "up" ? "bg-signal" : "bg-danger",
                            )}
                            aria-hidden
                          />
                          {site.tunnelState === "up"
                            ? remoteNetworksCopy.statusUp
                            : remoteNetworksCopy.statusDown}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-text-muted">
                        {site.peerIp}
                      </td>
                      <td className="px-3 py-2 text-xs text-text-muted">{site.location}</td>
                      <td className="px-3 py-2 font-mono text-xs">{site.bandwidthMbps} Mbps</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {site.tunnelUptimePct30d.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-text-muted">
                        {formatAbsolute(new Date(site.lastStateChange), "IST")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {selected ? (
            <DetailDrawer
              title={`${remoteNetworksCopy.drawerTitle}: ${selected.name}`}
              onClose={() => setSelectedId(null)}
              closeLabel={remoteNetworksCopy.drawerClose}
              testId="rn-drawer"
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-faint">Status</dt>
                  <dd
                    className={cn(
                      "font-medium",
                      selected.tunnelState === "up" ? "text-signal" : "text-danger",
                    )}
                    data-testid="rn-drawer-status"
                  >
                    {selected.tunnelState}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">Peer IP</dt>
                  <dd className="font-mono text-xs">{selected.peerIp}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">IKE gateway</dt>
                  <dd className="font-mono text-xs">{selected.ikeGateway}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">IPsec tunnel</dt>
                  <dd className="font-mono text-xs">{selected.ipsecTunnel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">Branch</dt>
                  <dd className="font-mono text-xs">
                    {selected.branchHostname} ({selected.branchModel})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">Subnet</dt>
                  <dd className="font-mono text-xs">{selected.subnet}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs font-medium text-text">{remoteNetworksCopy.drawerHistory}</p>
                <ol className="mt-2 space-y-2" data-testid="rn-tunnel-history">
                  {history.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-2"
                      data-testid={`rn-history-${event.state}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            event.state === "up" ? "text-signal" : "text-danger",
                          )}
                        >
                          {event.state}
                        </span>
                        <span className="font-mono text-[11px] text-text-faint">
                          {formatAbsolute(new Date(event.at), "IST")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">{event.note}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {profile ? (
                <div className="mt-4" data-testid="rn-crypto-profile">
                  <p className="text-xs font-medium text-text">
                    {remoteNetworksCopy.drawerProfile}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{profile.label}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-2">
                      <dt className="text-text-faint">IKE</dt>
                      <dd className="mt-1 font-mono text-text">
                        {profile.ike.encryption} / {profile.ike.hash} / {profile.ike.dhGroup}
                      </dd>
                    </div>
                    <div className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-2">
                      <dt className="text-text-faint">IPsec</dt>
                      <dd className="mt-1 font-mono text-text">
                        {profile.ipsec.encryption} / {profile.ipsec.hash} / {profile.ipsec.dhGroup}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link
                    to={`/logs?network=${encodeURIComponent(selected.name)}&peer=${encodeURIComponent(selected.peerIp)}`}
                    data-testid="rn-logs-link"
                  >
                    {remoteNetworksCopy.drawerLogs}
                  </Link>
                </Button>
                {relatedChanges[0] ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      to={`/config-audit?change=${encodeURIComponent(relatedChanges[0].changeId)}`}
                      data-testid="rn-config-link"
                    >
                      {remoteNetworksCopy.drawerConfig}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </DetailDrawer>
          ) : null}
        </div>
      </div>
    </PageChrome>
  );
}
