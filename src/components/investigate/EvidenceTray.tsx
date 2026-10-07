"use client";

import { ChevronDown, ChevronUp, Pin, Terminal, X } from "lucide-react";
import { useState } from "react";
import { EVIDENCE_COPY, LOG_TYPE_LABELS } from "@/content/investigate";
import { getLogById } from "@/lib/logs";
import { formatAbsolute, type TimezoneMode } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { EvidenceItem } from "@/types";

interface EvidenceTrayProps {
  items: EvidenceItem[];
  timezone: TimezoneMode;
  onRemove: (itemId: string) => void;
  onMove: (itemId: string, direction: -1 | 1) => void;
  onOpen: (logId: string) => void;
}

function itemLabel(item: EvidenceItem, timezone: TimezoneMode): string {
  if (item.kind === "console") {
    return `Console ${item.command}`;
  }
  const log = getLogById(item.logId);
  return log
    ? `${LOG_TYPE_LABELS[log.type]} ${formatAbsolute(log.time, timezone, "HH:mm:ss")}`
    : EVIDENCE_COPY.missing;
}

export function EvidenceTray({ items, timezone, onRemove, onMove, onOpen }: EvidenceTrayProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      data-guide-id="guide-evidence"
      className="flex w-64 shrink-0 flex-col border-l border-border bg-panel"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Pin className="size-3.5 text-accent" aria-hidden="true" />
          <h2 className="text-[13px] font-medium text-text">{EVIDENCE_COPY.title}</h2>
          <span className="font-mono text-[11px] text-muted-fg">{EVIDENCE_COPY.count(items.length)}</span>
        </div>
        <button
          type="button"
          aria-label={collapsed ? EVIDENCE_COPY.expand : EVIDENCE_COPY.collapse}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-sm p-1 text-muted-fg hover:text-text"
        >
          {collapsed ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {!collapsed ? (
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {items.length === 0 ? (
            <p className="px-1 py-2 text-[12px] text-muted-fg">{EVIDENCE_COPY.empty}</p>
          ) : (
            <ul aria-label={EVIDENCE_COPY.listLabel} className="space-y-1.5">
              {items.map((item, index) => {
                const label = itemLabel(item, timezone);
                const log = item.kind === "log" ? getLogById(item.logId) : undefined;
                const missingLog = item.kind === "log" && !log;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-md border border-border bg-surface p-2",
                      missingLog && "opacity-70",
                    )}
                  >
                    {item.kind === "log" ? (
                      <button
                        type="button"
                        disabled={!log}
                        aria-label={EVIDENCE_COPY.open(label)}
                        onClick={() => log && onOpen(log.id)}
                        className="w-full text-left"
                      >
                        <p className="text-[12px] font-medium text-text">{label}</p>
                        {log?.rule || log?.threatName || log?.sessionEndReason || log?.message ? (
                          <p className="mt-0.5 line-clamp-2 font-mono text-[11px] text-muted-fg">
                            {log.rule ?? log.threatName ?? log.sessionEndReason ?? log.message}
                          </p>
                        ) : null}
                      </button>
                    ) : (
                      <div className="w-full text-left">
                        <p className="flex items-center gap-1 text-[12px] font-medium text-text">
                          <Terminal className="size-3 shrink-0 text-accent" aria-hidden="true" />
                          Console
                        </p>
                        <p className="mt-0.5 line-clamp-2 font-mono text-[11px] text-muted-fg">
                          {item.command}
                        </p>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={EVIDENCE_COPY.moveUp(label)}
                        disabled={index === 0}
                        onClick={() => onMove(item.id, -1)}
                        className="rounded-sm border border-border p-0.5 text-muted-fg enabled:hover:text-text disabled:opacity-40"
                      >
                        <ChevronUp className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={EVIDENCE_COPY.moveDown(label)}
                        disabled={index === items.length - 1}
                        onClick={() => onMove(item.id, 1)}
                        className="rounded-sm border border-border p-0.5 text-muted-fg enabled:hover:text-text disabled:opacity-40"
                      >
                        <ChevronDown className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={EVIDENCE_COPY.remove(label)}
                        onClick={() => onRemove(item.id)}
                        className="ml-auto rounded-sm border border-border p-0.5 text-muted-fg hover:text-severity-critical"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </aside>
  );
}
