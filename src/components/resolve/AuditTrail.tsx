"use client";

import { RESOLVE_COPY } from "@/content/resolve";
import { formatAbsolute, formatRelative, type TimezoneMode } from "@/lib/time";
import type { AuditEvent } from "@/types";

interface AuditTrailProps {
  events: AuditEvent[];
  timezone: TimezoneMode;
}

export function AuditTrail({ events, timezone }: AuditTrailProps) {
  return (
    <section
      aria-labelledby="resolve-audit"
      className="rounded-lg border border-border bg-panel p-4"
    >
      <h2 id="resolve-audit" className="text-[13px] font-medium text-text">
        {RESOLVE_COPY.auditTitle}
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-[12px] text-muted-fg">{RESOLVE_COPY.auditEmpty}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {[...events].reverse().map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <time
                dateTime={event.at}
                title={formatAbsolute(event.at, timezone)}
                className="shrink-0 font-mono text-[11px] text-muted-fg"
              >
                {formatRelative(event.at, timezone)}
              </time>
              <span className="text-[12px] text-text">{event.action}</span>
              <span className="text-[11px] text-muted-fg">{event.actor}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
