"use client";

import Link from "next/link";
import { EntityChips } from "@/components/alerts/EntityChips";
import { SeverityBadge } from "@/components/alerts/SeverityBadge";
import { StatusBadge } from "@/components/alerts/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { WORKSPACE_COPY } from "@/content/investigate";
import { entityList } from "@/lib/alerts";
import type { Alert } from "@/types";

export function AlertHeader({ alert }: { alert: Alert }) {
  const entities = entityList(alert);
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-panel px-4 py-3">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base font-medium text-text">{alert.title}</h1>
          <span className="font-mono text-[12px] text-muted-fg">{alert.id}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={alert.severity} />
          <StatusBadge status={alert.status} />
        </div>
        {entities.length > 0 ? (
          <div aria-label={WORKSPACE_COPY.entitiesLabel}>
            <EntityChips entities={entities} />
          </div>
        ) : null}
      </div>
      <div
        data-guide-id="guide-resolve-actions"
        className="flex shrink-0 items-center gap-2"
      >
        <Link
          href={`/resolve/${alert.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {WORKSPACE_COPY.escalate}
        </Link>
        <Link href={`/resolve/${alert.id}`} className={buttonVariants({ size: "sm" })}>
          {WORKSPACE_COPY.resolve}
        </Link>
      </div>
    </header>
  );
}
