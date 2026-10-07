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
import { objectsCopy } from "@/content/supporting";
import { addressObjects, appGroups, serviceObjects } from "@/data";
import { useViewState } from "@/lib/use-view-state";
import { cn } from "@/lib/utils";
import {
  catalogObjects,
  findObjectByName,
  isAddressGroup,
  objectDisplayValue,
  whereUsed,
  type CatalogObject,
  type ObjectKind,
} from "@/lib/where-used";
import type { PolicyContainer } from "@/types";

type Tab = ObjectKind | "all";

const CONTAINERS: PolicyContainer[] = ["Shared", "Mobile Users", "Remote Networks"];

function parseTab(value: string | null): Tab {
  if (
    value === "address" ||
    value === "address-group" ||
    value === "services" ||
    value === "service" ||
    value === "app-group" ||
    value === "app-groups"
  ) {
    if (value === "services" || value === "service") return "service";
    if (value === "app-groups") return "app-group";
    return value as ObjectKind;
  }
  return "all";
}

function tabParam(tab: Tab): string | null {
  if (tab === "all") return null;
  if (tab === "service") return "services";
  if (tab === "app-group") return "app-groups";
  return tab;
}

function kindLabel(kind: ObjectKind): string {
  switch (kind) {
    case "address":
      return objectsCopy.tabAddress;
    case "address-group":
      return objectsCopy.tabAddressGroups;
    case "service":
      return objectsCopy.tabServices;
    case "app-group":
      return objectsCopy.tabAppGroups;
  }
}

export function ObjectsPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));
  const q = params.get("q") ?? "";
  const container = (params.get("container") as PolicyContainer | "all") || "all";
  const forceError = params.get("error") === "1";

  const [search, setSearch] = useState(q);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const { phase, retry } = useViewState(`${tab}|${q}|${container}`, forceError);

  const all = useMemo(() => catalogObjects(), []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((item) => (tab === "all" ? true : item.kind === tab))
      .filter((item) => (container === "all" ? true : item.object.container === container))
      .filter((item) => {
        if (!needle) return true;
        const value = objectDisplayValue(item);
        const hay = [item.object.name, value, item.object.description ?? ""]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
  }, [all, tab, q, container]);

  const totalCount =
    addressObjects.filter((o) => !isAddressGroup(o)).length +
    addressObjects.filter((o) => isAddressGroup(o)).length +
    serviceObjects.length +
    appGroups.length;

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
    setSelectedName(null);
    setParams(new URLSearchParams(), { replace: true });
  }

  function handleRetry() {
    const next = new URLSearchParams(params);
    next.delete("error");
    setParams(next, { replace: true });
    retry();
  }

  const selected: CatalogObject | null = selectedName
    ? findObjectByName(selectedName)
    : null;
  const usages = selected ? whereUsed(selected.object.name) : [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: objectsCopy.filterAll },
    { id: "address", label: objectsCopy.tabAddress },
    { id: "address-group", label: objectsCopy.tabAddressGroups },
    { id: "service", label: objectsCopy.tabServices },
    { id: "app-group", label: objectsCopy.tabAppGroups },
  ];

  return (
    <PageChrome
      title={objectsCopy.title}
      subtitle={objectsCopy.subtitle}
      seededLabel={`${totalCount} ${objectsCopy.seeded}`}
      testId="page-objects"
      filterEntries={[...params.entries()]}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap gap-1 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-1"
            role="tablist"
            aria-label="Object types"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                data-testid={`objects-tab-${t.id}`}
                className={cn(
                  "rounded-[var(--radius-control)] px-3 py-1.5 text-sm",
                  tab === t.id ? "bg-surface-3 text-text" : "text-text-muted hover:text-text",
                )}
                onClick={() => setParam("tab", tabParam(t.id))}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            data-testid="objects-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder={objectsCopy.searchPlaceholder}
            aria-label={objectsCopy.searchPlaceholder}
            className="h-9 min-w-[200px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-text-faint focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button type="button" size="sm" variant="secondary" onClick={applySearch}>
            Search
          </Button>

          <select
            aria-label={objectsCopy.filterContainer}
            data-testid="objects-filter-container"
            value={container}
            onChange={(e) => setParam("container", e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-sm text-text"
          >
            <option value="all">{objectsCopy.filterAll} containers</option>
            {CONTAINERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-1">
          {phase === "loading" ? (
            <ViewLoading label={objectsCopy.loading} testId="objects-loading" />
          ) : null}
          {phase === "error" ? (
            <ViewError
              title={objectsCopy.errorTitle}
              body={objectsCopy.errorBody}
              retryLabel={objectsCopy.retry}
              onRetry={handleRetry}
              testId="objects-error"
            />
          ) : null}
          {phase === "ready" && filtered.length === 0 ? (
            <ViewEmpty
              title={objectsCopy.emptyTitle}
              body={objectsCopy.emptyBody}
              clearLabel={objectsCopy.clearFilters}
              onClear={clearFilters}
              testId="objects-empty"
            />
          ) : null}
          {phase === "ready" && filtered.length > 0 ? (
            <div className="h-full overflow-auto" data-testid="objects-table">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-2 text-xs text-text-faint">
                  <tr>
                    <th className="px-3 py-2 font-medium">{objectsCopy.colName}</th>
                    <th className="px-3 py-2 font-medium">{objectsCopy.colType}</th>
                    <th className="px-3 py-2 font-medium">{objectsCopy.colValue}</th>
                    <th className="px-3 py-2 font-medium">{objectsCopy.colContainer}</th>
                    <th className="px-3 py-2 font-medium">{objectsCopy.colWhereUsed}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const used = whereUsed(item.object.name);
                    return (
                      <tr
                        key={`${item.kind}-${item.object.id}`}
                        data-testid={`object-row-${item.object.name}`}
                        className={cn(
                          "cursor-pointer border-t border-border hover:bg-surface-2",
                          selectedName === item.object.name && "bg-surface-3",
                        )}
                        onClick={() => setSelectedName(item.object.name)}
                      >
                        <td className="px-3 py-2 font-mono text-xs text-text">
                          {item.object.name}
                        </td>
                        <td className="px-3 py-2 text-xs text-text-muted">
                          {kindLabel(item.kind)}
                        </td>
                        <td className="max-w-[280px] truncate px-3 py-2 font-mono text-xs text-text-muted">
                          {objectDisplayValue(item)}
                        </td>
                        <td className="px-3 py-2 text-xs text-text-muted">
                          {item.object.container}
                        </td>
                        <td className="px-3 py-2">
                          {used.length === 0 ? (
                            <span className="text-xs text-text-faint">{objectsCopy.unused}</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {used.slice(0, 3).map((u) => (
                                <ChipLink
                                  key={`${u.ruleId}-${u.field}`}
                                  to={`/policies?rule=${encodeURIComponent(u.ruleName)}&q=${encodeURIComponent(u.ruleName)}`}
                                  testId={`where-used-${item.object.name}-${u.ruleName}`}
                                >
                                  {u.ruleName}
                                </ChipLink>
                              ))}
                              {used.length > 3 ? (
                                <span className="text-xs text-text-faint">+{used.length - 3}</span>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {selected ? (
            <DetailDrawer
              title={`${objectsCopy.drawerTitle}: ${selected.object.name}`}
              onClose={() => setSelectedName(null)}
              closeLabel={objectsCopy.drawerClose}
              testId="object-drawer"
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-faint">Type</dt>
                  <dd className="text-text">{kindLabel(selected.kind)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">Container</dt>
                  <dd className="text-text">{selected.object.container}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-text-faint">Value</dt>
                  <dd className="break-all font-mono text-xs text-text">
                    {objectDisplayValue(selected)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-text-faint">Description</dt>
                  <dd className="text-text-muted">{selected.object.description || "None"}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs font-medium text-text">{objectsCopy.drawerRules}</p>
                {usages.length === 0 ? (
                  <p className="mt-2 text-xs text-text-faint">{objectsCopy.unused}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {usages.map((u) => (
                      <li
                        key={`${u.ruleId}-${u.field}`}
                        className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2 p-2"
                      >
                        <div>
                          <p className="font-mono text-xs text-text">{u.ruleName}</p>
                          <p className="text-xs text-text-muted">
                            {u.container} · pos {u.position} · {u.field}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="secondary">
                          <Link
                            to={`/policies?rule=${encodeURIComponent(u.ruleName)}&q=${encodeURIComponent(u.ruleName)}`}
                            data-testid={`object-open-rule-${u.ruleName}`}
                          >
                            {objectsCopy.drawerOpenRule}
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DetailDrawer>
          ) : null}
        </div>
      </div>
    </PageChrome>
  );
}
