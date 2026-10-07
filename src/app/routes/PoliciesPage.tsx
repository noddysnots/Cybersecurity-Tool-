import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  ChipLink,
  DetailDrawer,
  PageChrome,
  ViewEmpty,
  ViewError,
  ViewLoading,
} from "@/components/supporting";
import { Button } from "@/components/ui";
import { policiesCopy } from "@/content/supporting";
import { decryptionRules, securityRules } from "@/data";
import { modifiedMarker, withinHours } from "@/lib/relative-time";
import { formatAbsolute } from "@/lib/time";
import { useViewState } from "@/lib/use-view-state";
import { cn } from "@/lib/utils";
import { changesForName, findObjectByName } from "@/lib/where-used";
import type { DecryptionRule, PolicyContainer, SecurityRule } from "@/types";

type Tab = "security" | "decryption";
type ContainerFilter = "all" | PolicyContainer;
type ActionFilter = "all" | "allow" | "deny" | "drop" | "decrypt" | "no-decrypt";

const CONTAINERS: PolicyContainer[] = ["Shared", "Mobile Users", "Remote Networks"];

function parseTab(value: string | null): Tab {
  return value === "decryption" ? "decryption" : "security";
}

export function PoliciesPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));
  const q = params.get("q") ?? "";
  const container = (params.get("container") as ContainerFilter) || "all";
  const action = (params.get("action") as ActionFilter) || "all";
  const ruleParam = params.get("rule") ?? "";
  const forceError = params.get("error") === "1";

  const [search, setSearch] = useState(q);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const { phase, retry } = useViewState(
    `${tab}|${q}|${container}|${action}`,
    forceError,
  );

  const securityFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return securityRules
      .filter((r) => (container === "all" ? true : r.container === container))
      .filter((r) => (action === "all" ? true : r.action === action))
      .filter((r) => {
        if (!needle) return true;
        const hay = [r.name, r.app.join(" "), r.service.join(" "), r.description]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => a.container.localeCompare(b.container) || a.position - b.position);
  }, [q, container, action]);

  const decryptionFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return decryptionRules
      .filter((r) => (container === "all" ? true : r.container === container))
      .filter((r) => (action === "all" ? true : r.action === action))
      .filter((r) => {
        if (!needle) return true;
        const hay = [r.name, r.service.join(" "), r.urlCategory.join(" ")]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => a.container.localeCompare(b.container) || a.position - b.position);
  }, [q, container, action]);

  const rows = tab === "security" ? securityFiltered : decryptionFiltered;

  useEffect(() => {
    if (!ruleParam) return;
    const match =
      securityRules.find((r) => r.name === ruleParam || r.id === ruleParam) ??
      decryptionRules.find((r) => r.name === ruleParam || r.id === ruleParam);
    if (match) {
      setSelectedId(match.id);
      if (decryptionRules.some((r) => r.id === match.id)) {
        setParam("tab", "decryption");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleParam]);

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
    setSelectedId(null);
  }

  function handleRetry() {
    const next = new URLSearchParams(params);
    next.delete("error");
    setParams(next, { replace: true });
    retry();
  }

  const selectedSecurity = securityRules.find((r) => r.id === selectedId) ?? null;
  const selectedDecrypt = decryptionRules.find((r) => r.id === selectedId) ?? null;
  const selected = selectedSecurity ?? selectedDecrypt;

  const groupedSecurity = useMemo(() => {
    const map = new Map<PolicyContainer, SecurityRule[]>();
    for (const c of CONTAINERS) map.set(c, []);
    for (const rule of securityFiltered) {
      map.get(rule.container)?.push(rule);
    }
    return map;
  }, [securityFiltered]);

  const groupedDecrypt = useMemo(() => {
    const map = new Map<PolicyContainer, DecryptionRule[]>();
    for (const c of CONTAINERS) map.set(c, []);
    for (const rule of decryptionFiltered) {
      map.get(rule.container)?.push(rule);
    }
    return map;
  }, [decryptionFiltered]);

  const history = selected ? changesForName(selected.name) : [];

  return (
    <PageChrome
      title={policiesCopy.title}
      subtitle={policiesCopy.subtitle}
      seededLabel={`${securityRules.length} ${policiesCopy.seeded} · ${decryptionRules.length} decryption`}
      testId="page-policies"
      filterEntries={[...params.entries()]}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex gap-1 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-1"
            role="tablist"
            aria-label="Policy tabs"
          >
            {(["security", "decryption"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                data-testid={`policies-tab-${id}`}
                className={cn(
                  "rounded-[var(--radius-control)] px-3 py-1.5 text-sm",
                  tab === id ? "bg-surface-3 text-text" : "text-text-muted hover:text-text",
                )}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (id === "security") next.delete("tab");
                  else next.set("tab", id);
                  next.delete("q");
                  next.delete("rule");
                  setSearch("");
                  setSelectedId(null);
                  setParams(next, { replace: true });
                }}
              >
                {id === "security" ? policiesCopy.tabSecurity : policiesCopy.tabDecryption}
              </button>
            ))}
          </div>

          <label className="sr-only" htmlFor="policies-search">
            {policiesCopy.searchPlaceholder}
          </label>
          <input
            id="policies-search"
            data-testid="policies-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder={policiesCopy.searchPlaceholder}
            className="h-9 min-w-[220px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-text-faint focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button type="button" size="sm" variant="secondary" onClick={applySearch}>
            Search
          </Button>

          <select
            aria-label={policiesCopy.filterContainer}
            data-testid="policies-filter-container"
            value={container}
            onChange={(e) => setParam("container", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{policiesCopy.filterAll} containers</option>
            {CONTAINERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label={policiesCopy.filterAction}
            data-testid="policies-filter-action"
            value={action}
            onChange={(e) => setParam("action", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{policiesCopy.filterAll} actions</option>
            {tab === "security" ? (
              <>
                <option value="allow">allow</option>
                <option value="deny">deny</option>
                <option value="drop">drop</option>
              </>
            ) : (
              <>
                <option value="decrypt">decrypt</option>
                <option value="no-decrypt">no-decrypt</option>
              </>
            )}
          </select>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-1">
          {phase === "loading" ? (
            <ViewLoading label={policiesCopy.loading} testId="policies-loading" />
          ) : null}
          {phase === "error" ? (
            <ViewError
              title={policiesCopy.errorTitle}
              body={policiesCopy.errorBody}
              retryLabel={policiesCopy.retry}
              onRetry={handleRetry}
              testId="policies-error"
            />
          ) : null}
          {phase === "ready" && rows.length === 0 ? (
            <ViewEmpty
              title={policiesCopy.emptyTitle}
              body={policiesCopy.emptyBody}
              clearLabel={policiesCopy.clearFilters}
              onClear={clearFilters}
              testId="policies-empty"
            />
          ) : null}
          {phase === "ready" && rows.length > 0 ? (
            <div className="h-full overflow-auto" data-testid="policies-table">
              {tab === "security"
                ? CONTAINERS.map((c) => {
                    const group = groupedSecurity.get(c) ?? [];
                    if (group.length === 0) return null;
                    return (
                      <div key={c} data-testid={`policies-group-${c.replaceAll(" ", "-").toLowerCase()}`}>
                        <div className="sticky top-0 z-10 border-b border-border bg-surface-2 px-4 py-2 text-xs font-medium text-text-muted">
                          {c} · {group.length} rules
                        </div>
                        <table className="w-full text-left text-sm">
                          <thead className="text-xs text-text-faint">
                            <tr>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colPosition}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colName}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colApp}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colService}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colAction}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colHits}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colLastHit}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colModified}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((rule) => (
                              <tr
                                key={rule.id}
                                data-testid={`policy-row-${rule.name}`}
                                className={cn(
                                  "cursor-pointer border-t border-border hover:bg-surface-2",
                                  selectedId === rule.id && "bg-surface-3",
                                )}
                                onClick={() => setSelectedId(rule.id)}
                              >
                                <td className="px-3 py-2 font-mono text-xs">{rule.position}</td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs text-text">{rule.name}</span>
                                    {withinHours(rule.modifiedAt, 24) ? (
                                      <span
                                        className="rounded-[var(--radius-control)] bg-warn/15 px-1.5 py-0.5 text-[11px] text-warn"
                                        data-testid={`modified-marker-${rule.name}`}
                                      >
                                        {modifiedMarker(rule.modifiedAt)}
                                      </span>
                                    ) : null}
                                    {rule.disabled ? (
                                      <span className="text-[11px] text-text-faint">
                                        {policiesCopy.disabled}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                                  {rule.app.join(", ")}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {rule.service.map((svc) =>
                                      findObjectByName(svc) ? (
                                        <ChipLink
                                          key={svc}
                                          to={`/objects?q=${encodeURIComponent(svc)}&tab=services`}
                                          testId={`policy-svc-link-${svc}`}
                                        >
                                          {svc}
                                        </ChipLink>
                                      ) : (
                                        <span key={svc} className="font-mono text-xs text-text-muted">
                                          {svc}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs">{rule.action}</td>
                                <td className="px-3 py-2 font-mono text-xs">
                                  {rule.hitCount.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                                  {formatAbsolute(new Date(rule.lastHit), "IST")}
                                </td>
                                <td className="px-3 py-2 text-xs text-text-muted">
                                  {rule.modifiedBy}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                : CONTAINERS.map((c) => {
                    const group = groupedDecrypt.get(c) ?? [];
                    if (group.length === 0) return null;
                    return (
                      <div key={c}>
                        <div className="sticky top-0 z-10 border-b border-border bg-surface-2 px-4 py-2 text-xs font-medium text-text-muted">
                          {c} · {group.length} rules
                        </div>
                        <table className="w-full text-left text-sm">
                          <thead className="text-xs text-text-faint">
                            <tr>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colPosition}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colName}</th>
                              <th className="px-3 py-2 font-medium">URL category</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colAction}</th>
                              <th className="px-3 py-2 font-medium">{policiesCopy.colModified}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((rule) => (
                              <tr
                                key={rule.id}
                                data-testid={`decrypt-row-${rule.name}`}
                                className={cn(
                                  "cursor-pointer border-t border-border hover:bg-surface-2",
                                  selectedId === rule.id && "bg-surface-3",
                                )}
                                onClick={() => setSelectedId(rule.id)}
                              >
                                <td className="px-3 py-2 font-mono text-xs">{rule.position}</td>
                                <td className="px-3 py-2 font-mono text-xs">{rule.name}</td>
                                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                                  {rule.urlCategory.join(", ")}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs">{rule.action}</td>
                                <td className="px-3 py-2 text-xs text-text-muted">
                                  {rule.modifiedBy}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
            </div>
          ) : null}

          {selected ? (
            <DetailDrawer
              title={`${policiesCopy.drawerTitle}: ${selected.name}`}
              onClose={() => setSelectedId(null)}
              closeLabel={policiesCopy.drawerClose}
              testId="policy-drawer"
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-faint">Container</dt>
                  <dd className="text-text">{selected.container}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">Position</dt>
                  <dd className="font-mono text-text">{selected.position}</dd>
                </div>
                {"action" in selected ? (
                  <div>
                    <dt className="text-xs text-text-faint">Action</dt>
                    <dd className="font-mono text-text">{selected.action}</dd>
                  </div>
                ) : null}
                {"hitCount" in selected ? (
                  <div>
                    <dt className="text-xs text-text-faint">Hit count</dt>
                    <dd className="font-mono text-text">
                      {(selected as SecurityRule).hitCount.toLocaleString()}
                    </dd>
                  </div>
                ) : null}
                <div className="col-span-2">
                  <dt className="text-xs text-text-faint">Modified</dt>
                  <dd className="text-text">
                    {selected.modifiedBy} · {formatAbsolute(new Date(selected.modifiedAt), "IST")}
                    {withinHours(selected.modifiedAt, 24) ? (
                      <span className="ml-2 text-warn">{modifiedMarker(selected.modifiedAt)}</span>
                    ) : null}
                  </dd>
                </div>
                {"description" in selected ? (
                  <div className="col-span-2">
                    <dt className="text-xs text-text-faint">Description</dt>
                    <dd className="text-text-muted">{(selected as SecurityRule).description}</dd>
                  </div>
                ) : null}
              </dl>

              {"service" in selected ? (
                <div className="mt-4">
                  <p className="text-xs font-medium text-text">{policiesCopy.drawerObjects}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(selected as SecurityRule | DecryptionRule).service.map((svc) => (
                      <ChipLink
                        key={svc}
                        to={`/objects?q=${encodeURIComponent(svc)}&tab=services`}
                        testId={`drawer-svc-${svc}`}
                      >
                        {svc}
                      </ChipLink>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <p className="text-xs font-medium text-text">{policiesCopy.drawerHistory}</p>
                {history.length === 0 ? (
                  <p className="mt-2 text-xs text-text-faint">No related config changes.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {history.map((change) => (
                      <li key={change.id} className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-2">
                        <Link
                          to={`/config-audit?change=${encodeURIComponent(change.changeId)}`}
                          className="font-mono text-xs text-accent"
                          data-testid={`policy-history-${change.changeId}`}
                        >
                          {change.changeId}
                        </Link>
                        <p className="mt-1 text-xs text-text-muted">{change.summary}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link
                    to={`/logs?rule=${encodeURIComponent(selected.name)}`}
                    data-testid="policy-logs-link"
                  >
                    {policiesCopy.drawerLogs}
                  </Link>
                </Button>
                {history[0] ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      to={`/config-audit?change=${encodeURIComponent(history[0].changeId)}`}
                      data-testid="policy-config-link"
                    >
                      {policiesCopy.drawerConfig}
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
