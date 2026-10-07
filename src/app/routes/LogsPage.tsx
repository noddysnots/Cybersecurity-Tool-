import { useSearchParams } from "react-router-dom";

import { LogExplorer } from "@/components/logs";
import { logsCopy } from "@/content/logs";
import { logs } from "@/data";

export function LogsPage() {
  const [params] = useSearchParams();
  const filterEntries = [...params.entries()];

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-4" data-testid="logs-page">
      <div className="mb-3 shrink-0">
        <h1 className="text-lg font-medium text-text">{logsCopy.pageTitle}</h1>
        <p className="mt-1 text-sm text-text-muted">{logsCopy.pageSubtitle}</p>
        <div className="mt-2" data-testid="seeded-summary">
          <p className="font-mono text-xs text-text-faint" data-testid="logs-seeded-count">
            {logs.length} log rows seeded
          </p>
        </div>
        {filterEntries.length > 0 ? (
          <div
            className="mt-2 rounded-[var(--radius-control)] border border-border bg-surface-2 p-3"
            data-testid="active-filters"
          >
            <p className="text-sm text-text">Filters applied</p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-text-muted">
              {filterEntries.map(([key, value]) => (
                <li key={`${key}-${value}`}>
                  {key}={value}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <LogExplorer showSavedQueries testId="logs-explorer" />
      </div>
    </div>
  );
}
