"use client";

import { LOG_TYPE_LABELS, LOG_TYPE_ORDER, TIMELINE_COPY } from "@/content/investigate";
import { toWindow } from "@/lib/logs";
import { cn } from "@/lib/utils";
import type { InvestigationView, LogRecord, LogType } from "@/types";

const DOT_COLORS: Record<LogType, string> = {
  traffic: "bg-accent",
  threat: "bg-severity-critical",
  url: "bg-severity-medium",
  decryption: "bg-severity-high",
  system: "bg-severity-info",
  config: "bg-severity-low",
};

interface TimelineStripProps {
  logs: readonly LogRecord[];
  view: InvestigationView;
  onSelectType: (type: LogType) => void;
}

export function TimelineStrip({ logs, view, onSelectType }: TimelineStripProps) {
  const scope = toWindow(view);
  const duration = Math.max(1, scope.end - scope.start);
  const inWindow = logs.filter((log) => {
    const t = Date.parse(log.time);
    return t >= scope.start && t <= scope.end;
  });

  return (
    <section
      className="space-y-1.5 border-b border-border bg-panel px-4 py-2"
      aria-label={TIMELINE_COPY.label}
      data-guide-id="guide-timeline"
    >
      <p className="text-[12px] text-muted-fg">{TIMELINE_COPY.label}</p>
      <div className="space-y-1">
        {LOG_TYPE_ORDER.map((type) => {
          const rows = inWindow.filter((log) => log.type === type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(type)}
              aria-label={TIMELINE_COPY.openTab(LOG_TYPE_LABELS[type])}
              className={cn(
                "grid w-full grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 rounded-sm px-1 py-0.5 text-left hover:bg-surface",
                view.tab === type && "bg-surface",
              )}
            >
              <span className="text-[12px] text-muted-fg">{LOG_TYPE_LABELS[type]}</span>
              <span className="relative h-3 rounded-sm bg-surface">
                {rows.map((log) => {
                  const left = ((Date.parse(log.time) - scope.start) / duration) * 100;
                  return (
                    <span
                      key={log.id}
                      className={cn("absolute top-0.5 size-2 rounded-full", DOT_COLORS[type])}
                      style={{ left: `${Math.min(98, Math.max(0, left))}%` }}
                    />
                  );
                })}
              </span>
              <span className="font-mono text-[11px] text-muted-fg tabular-nums">
                {rows.length}
              </span>
              <span className="sr-only">{TIMELINE_COPY.rowLabel(LOG_TYPE_LABELS[type], rows.length)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
