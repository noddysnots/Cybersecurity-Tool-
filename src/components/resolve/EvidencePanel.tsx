"use client";

import { Pin, Terminal } from "lucide-react";
import { RESOLVE_COPY } from "@/content/resolve";
import { LOG_TYPE_LABELS } from "@/content/investigate";
import { getLogById } from "@/lib/logs";
import { formatAbsolute, type TimezoneMode } from "@/lib/time";
import type { EvidenceItem } from "@/types";

interface EvidencePanelProps {
  items: EvidenceItem[];
  timezone: TimezoneMode;
}

export function EvidencePanel({ items, timezone }: EvidencePanelProps) {
  return (
    <section
      aria-labelledby="resolve-evidence"
      data-guide-id="guide-resolve-evidence"
      className="rounded-lg border border-border bg-panel p-4"
    >
      <div className="flex items-center gap-1.5">
        <Pin className="size-3.5 text-accent" aria-hidden="true" />
        <h2 id="resolve-evidence" className="text-[13px] font-medium text-text">
          {RESOLVE_COPY.evidenceTitle}
        </h2>
        <span className="font-mono text-[11px] text-muted-fg">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-[12px] text-muted-fg">{RESOLVE_COPY.evidenceEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            if (item.kind === "console") {
              return (
                <li
                  key={item.id}
                  className="rounded-md border border-border bg-surface p-2"
                >
                  <p className="flex items-center gap-1 text-[12px] font-medium text-text">
                    <Terminal className="size-3 shrink-0 text-accent" aria-hidden="true" />
                    Console
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-fg">{item.command}</p>
                </li>
              );
            }
            const log = getLogById(item.logId);
            return (
              <li
                key={item.id}
                className="rounded-md border border-border bg-surface p-2"
              >
                {log ? (
                  <>
                    <p className="text-[12px] font-medium text-text">
                      {LOG_TYPE_LABELS[log.type]}{" "}
                      <span className="font-mono text-muted-fg">
                        {formatAbsolute(log.time, timezone, "HH:mm:ss")}
                      </span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 font-mono text-[11px] text-muted-fg">
                      {log.rule ?? log.threatName ?? log.sessionEndReason ?? log.message ?? log.app}
                    </p>
                  </>
                ) : (
                  <p className="text-[12px] text-muted-fg">{RESOLVE_COPY.evidenceMissing}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
