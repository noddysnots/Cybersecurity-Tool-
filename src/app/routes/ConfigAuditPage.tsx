import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  DiffView,
  DetailDrawer,
  PageChrome,
  ViewEmpty,
  ViewError,
  ViewLoading,
} from "@/components/supporting";
import { Button } from "@/components/ui";
import { configAuditCopy } from "@/content/supporting";
import { configAudit } from "@/data";
import { DEMO_NOW, formatAbsolute } from "@/lib/time";
import { useViewState } from "@/lib/use-view-state";
import { cn } from "@/lib/utils";
import { findObjectByName, findSecurityRuleByName } from "@/lib/where-used";
import type { ConfigChange, PolicyContainer } from "@/types";

type WindowFilter = "all" | "24h";
type ContainerFilter = "all" | PolicyContainer | "branch";

const FEATURED = new Set(["CHG-5120", "CHG-4471"]);

function relatedRuleName(change: ConfigChange): string | null {
  if (change.changeId === "CHG-5120") return "Block-QUIC";
  const match = change.path.match(/rules\/([^/]+)/i);
  if (match?.[1]) return match[1];
  const fromSummary = findSecurityRuleByName(
    change.summary.split(" ").find((w) => w.includes("-") && w.length > 4) ?? "",
  );
  return fromSummary?.name ?? null;
}

function relatedObjectName(change: ConfigChange): string | null {
  if (change.changeId === "CHG-5120") return "svc-quic-block";
  if (change.after.includes("svc-quic-block") || change.before.includes("svc-quic-block")) {
    return "svc-quic-block";
  }
  return null;
}

export function ConfigAuditPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const windowFilter = (params.get("window") as WindowFilter) || "all";
  const container = (params.get("container") as ContainerFilter) || "all";
  const changeParam = params.get("change") ?? "";
  const forceError = params.get("error") === "1";

  const [search, setSearch] = useState(q);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const { phase, retry } = useViewState(
    `${q}|${windowFilter}|${container}|${changeParam}`,
    forceError,
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const windowStart = DEMO_NOW.getTime() - 24 * 60 * 60 * 1000;
    return [...configAudit]
      .filter((c) => {
        if (windowFilter !== "24h") return true;
        return Date.parse(c.timestamp) >= windowStart;
      })
      .filter((c) => (container === "all" ? true : c.container === container))
      .filter((c) => {
        if (!needle) return true;
        const hay = [c.changeId, c.admin, c.summary, c.path, c.before, c.after]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        const aFeat = FEATURED.has(a.changeId) ? 0 : 1;
        const bFeat = FEATURED.has(b.changeId) ? 0 : 1;
        if (aFeat !== bFeat) return aFeat - bFeat;
        return Date.parse(b.timestamp) - Date.parse(a.timestamp);
      });
  }, [q, windowFilter, container]);

  useEffect(() => {
    if (!changeParam) return;
    const hit = configAudit.find((c) => c.changeId === changeParam || c.id === changeParam);
    if (hit) setSelectedId(hit.id);
  }, [changeParam]);

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

  const selected = configAudit.find((c) => c.id === selectedId) ?? null;
  const ruleName = selected ? relatedRuleName(selected) : null;
  const objectName = selected ? relatedObjectName(selected) : null;
  const objectExists = objectName ? findObjectByName(objectName) : null;

  return (
    <PageChrome
      title={configAuditCopy.title}
      subtitle={configAuditCopy.subtitle}
      seededLabel={`${configAudit.length} ${configAuditCopy.seeded}`}
      testId="page-config-audit"
      filterEntries={[...params.entries()]}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            data-testid="audit-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder={configAuditCopy.searchPlaceholder}
            aria-label={configAuditCopy.searchPlaceholder}
            className="h-9 min-w-[200px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-text-faint focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button type="button" size="sm" variant="secondary" onClick={applySearch}>
            Search
          </Button>
          <select
            aria-label={configAuditCopy.filterWindow}
            data-testid="audit-filter-window"
            value={windowFilter}
            onChange={(e) => setParam("window", e.target.value === "all" ? null : e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{configAuditCopy.windowAll}</option>
            <option value="24h">{configAuditCopy.window24h}</option>
          </select>
          <select
            aria-label={configAuditCopy.filterContainer}
            data-testid="audit-filter-container"
            value={container}
            onChange={(e) => setParam("container", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{configAuditCopy.filterAll} containers</option>
            <option value="Shared">Shared</option>
            <option value="Mobile Users">Mobile Users</option>
            <option value="Remote Networks">Remote Networks</option>
            <option value="branch">branch</option>
          </select>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-1">
          {phase === "loading" ? (
            <ViewLoading label={configAuditCopy.loading} testId="audit-loading" />
          ) : null}
          {phase === "error" ? (
            <ViewError
              title={configAuditCopy.errorTitle}
              body={configAuditCopy.errorBody}
              retryLabel={configAuditCopy.retry}
              onRetry={handleRetry}
              testId="audit-error"
            />
          ) : null}
          {phase === "ready" && filtered.length === 0 ? (
            <ViewEmpty
              title={configAuditCopy.emptyTitle}
              body={configAuditCopy.emptyBody}
              clearLabel={configAuditCopy.clearFilters}
              onClear={clearFilters}
              testId="audit-empty"
            />
          ) : null}
          {phase === "ready" && filtered.length > 0 ? (
            <div className="h-full overflow-auto" data-testid="audit-table">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-2 text-xs text-text-faint">
                  <tr>
                    <th className="px-3 py-2 font-medium">{configAuditCopy.colWhen}</th>
                    <th className="px-3 py-2 font-medium">{configAuditCopy.colChange}</th>
                    <th className="px-3 py-2 font-medium">{configAuditCopy.colAdmin}</th>
                    <th className="px-3 py-2 font-medium">{configAuditCopy.colContainer}</th>
                    <th className="px-3 py-2 font-medium">{configAuditCopy.colSummary}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((change) => (
                    <tr
                      key={change.id}
                      data-testid={`audit-row-${change.changeId}`}
                      className={cn(
                        "cursor-pointer border-t border-border hover:bg-surface-2",
                        selectedId === change.id && "bg-surface-3",
                        FEATURED.has(change.changeId) && "bg-accent/5",
                      )}
                      onClick={() => {
                        setSelectedId(change.id);
                        setParam("change", change.changeId);
                      }}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-text-muted">
                        {formatAbsolute(new Date(change.timestamp), "IST")}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-accent">
                        {change.changeId}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{change.admin}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">{change.container}</td>
                      <td className="max-w-md truncate px-3 py-2 text-xs text-text">
                        {change.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {selected ? (
            <DetailDrawer
              title={`${configAuditCopy.drawerTitle}: ${selected.changeId}`}
              onClose={() => {
                setSelectedId(null);
                setParam("change", null);
              }}
              closeLabel={configAuditCopy.drawerClose}
              testId="audit-drawer"
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-faint">Admin</dt>
                  <dd className="font-mono text-xs">{selected.admin}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">When</dt>
                  <dd className="font-mono text-xs">
                    {formatAbsolute(new Date(selected.timestamp), "IST")}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-text-faint">Path</dt>
                  <dd className="break-all font-mono text-xs text-text-muted">{selected.path}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-text-faint">Summary</dt>
                  <dd className="text-text-muted">{selected.summary}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <DiffView before={selected.before} after={selected.after} testId="audit-diff" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {ruleName ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      to={`/policies?rule=${encodeURIComponent(ruleName)}&q=${encodeURIComponent(ruleName)}`}
                      data-testid="audit-rule-link"
                    >
                      {configAuditCopy.relatedRule}: {ruleName}
                    </Link>
                  </Button>
                ) : null}
                {objectExists && objectName ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      to={`/objects?q=${encodeURIComponent(objectName)}&tab=services`}
                      data-testid="audit-object-link"
                    >
                      {configAuditCopy.relatedObject}: {objectName}
                    </Link>
                  </Button>
                ) : null}
                {selected.ticketHint ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      to={`/tickets/${selected.ticketHint}`}
                      data-testid="audit-ticket-link"
                    >
                      {configAuditCopy.relatedTicket}: {selected.ticketHint}
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <Link
                    to={`/logs?type=config&change=${encodeURIComponent(selected.changeId)}`}
                    data-testid="audit-logs-link"
                  >
                    {configAuditCopy.openLogs}
                  </Link>
                </Button>
              </div>
            </DetailDrawer>
          ) : null}
        </div>
      </div>
    </PageChrome>
  );
}
