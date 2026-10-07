import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { PageChrome, ViewEmpty, ViewError, ViewLoading } from "@/components/supporting";
import { Button } from "@/components/ui";
import { mobileUsersCopy } from "@/content/supporting";
import { mobileUsers } from "@/data";
import { formatAbsolute } from "@/lib/time";
import { useViewState } from "@/lib/use-view-state";

export function MobileUsersPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const gateway = params.get("gateway") ?? "all";
  const os = params.get("os") ?? "all";
  const forceError = params.get("error") === "1";

  const [search, setSearch] = useState(q);
  const { phase, retry } = useViewState(`${q}|${gateway}|${os}`, forceError);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const connected = useMemo(
    () => mobileUsers.filter((u) => u.status === "connected"),
    [],
  );

  const gateways = useMemo(
    () => [...new Set(connected.map((u) => u.gateway))].sort(),
    [connected],
  );
  const osList = useMemo(
    () => [...new Set(connected.map((u) => u.os))].sort(),
    [connected],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return connected
      .filter((u) => (gateway === "all" ? true : u.gateway === gateway))
      .filter((u) => (os === "all" ? true : u.os === os))
      .filter((u) => {
        if (!needle) return true;
        const hay = [u.user, u.email, u.privateIp, u.publicIp, u.gateway, u.location]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => a.user.localeCompare(b.user));
  }, [connected, q, gateway, os]);

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
    setParams(new URLSearchParams(), { replace: true });
  }

  function handleRetry() {
    const next = new URLSearchParams(params);
    next.delete("error");
    setParams(next, { replace: true });
    retry();
  }

  return (
    <PageChrome
      title={mobileUsersCopy.title}
      subtitle={mobileUsersCopy.subtitle}
      seededLabel={`${connected.length} ${mobileUsersCopy.seeded}`}
      testId="page-mobile-users"
      filterEntries={[...params.entries()]}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            data-testid="mu-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder={mobileUsersCopy.searchPlaceholder}
            aria-label={mobileUsersCopy.searchPlaceholder}
            className="h-9 min-w-[200px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-text-faint focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button type="button" size="sm" variant="secondary" onClick={applySearch}>
            Search
          </Button>
          <select
            aria-label={mobileUsersCopy.filterGateway}
            data-testid="mu-filter-gateway"
            value={gateway}
            onChange={(e) => setParam("gateway", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{mobileUsersCopy.filterAll} gateways</option>
            {gateways.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            aria-label={mobileUsersCopy.filterOs}
            data-testid="mu-filter-os"
            value={os}
            onChange={(e) => setParam("os", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{mobileUsersCopy.filterAll} OS</option>
            {osList.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-1">
          {phase === "loading" ? (
            <ViewLoading label={mobileUsersCopy.loading} testId="mu-loading" />
          ) : null}
          {phase === "error" ? (
            <ViewError
              title={mobileUsersCopy.errorTitle}
              body={mobileUsersCopy.errorBody}
              retryLabel={mobileUsersCopy.retry}
              onRetry={handleRetry}
              testId="mu-error"
            />
          ) : null}
          {phase === "ready" && filtered.length === 0 ? (
            <ViewEmpty
              title={mobileUsersCopy.emptyTitle}
              body={mobileUsersCopy.emptyBody}
              clearLabel={mobileUsersCopy.clearFilters}
              onClear={clearFilters}
              testId="mu-empty"
            />
          ) : null}
          {phase === "ready" && filtered.length > 0 ? (
            <div className="h-full overflow-auto" data-testid="mu-table">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-2 text-xs text-text-faint">
                  <tr>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colUser}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colEmail}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colPrivateIp}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colLocation}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colGateway}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colOs}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colVersion}</th>
                    <th className="px-3 py-2 font-medium">{mobileUsersCopy.colSince}</th>
                    <th className="px-3 py-2 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user.id}
                      data-testid={`mu-row-${user.email}`}
                      className="border-t border-border hover:bg-surface-2"
                    >
                      <td className="px-3 py-2 text-sm text-text">{user.user}</td>
                      <td className="px-3 py-2 font-mono text-xs text-text-muted">
                        {user.email}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{user.privateIp}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">{user.location}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">{user.gateway}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">{user.os}</td>
                      <td className="px-3 py-2 font-mono text-xs">{user.gpVersion}</td>
                      <td className="px-3 py-2 font-mono text-xs text-text-muted">
                        {formatAbsolute(new Date(user.connectedSince), "IST")}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/logs?user=${encodeURIComponent(user.email)}`}
                          className="text-xs text-accent hover:underline"
                          data-testid={`mu-logs-${user.email}`}
                        >
                          {mobileUsersCopy.openLogs}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </PageChrome>
  );
}
