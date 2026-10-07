import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { formatDemoClock } from "@/lib/time";
import { supportingShared } from "@/content/supporting";

type PageChromeProps = {
  title: string;
  subtitle: string;
  seededLabel: string;
  testId: string;
  filterEntries?: [string, string][];
  children: ReactNode;
};

export function PageChrome({
  title,
  subtitle,
  seededLabel,
  testId,
  filterEntries = [],
  children,
}: PageChromeProps) {
  return (
    <div className="flex h-full min-h-0 flex-col px-5 py-4 text-text" data-testid={testId}>
      <header className="mb-4 shrink-0">
        <h1 className="text-lg font-medium tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
        <p className="mt-1 font-mono text-xs text-text-faint" data-testid="seeded-summary">
          {seededLabel}
        </p>
        <p className="mt-1 font-mono text-xs text-text-faint">
          {supportingShared.demoClock}: {formatDemoClock("IST")}
        </p>
        {filterEntries.length > 0 ? (
          <div
            className="mt-2 rounded-[var(--radius-control)] border border-border bg-surface-2 p-3"
            data-testid="active-filters"
          >
            <p className="text-sm text-text">{supportingShared.activeFilters}</p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-text-muted">
              {filterEntries.map(([key, value]) => (
                <li key={`${key}-${value}`}>
                  {key}={value}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

type ChipLinkProps = {
  to: string;
  children: ReactNode;
  testId?: string;
};

export function ChipLink({ to, children, testId }: ChipLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-accent hover:bg-surface-3"
      data-testid={testId}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  );
}
