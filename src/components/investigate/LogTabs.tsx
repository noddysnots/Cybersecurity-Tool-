"use client";

import { LOG_TABS_LABEL, LOG_TYPE_LABELS, LOG_TYPE_ORDER } from "@/content/investigate";
import { cn } from "@/lib/utils";
import type { LogType } from "@/types";

interface LogTabsProps {
  counts: Record<LogType, number>;
  active: LogType;
  onChange: (type: LogType) => void;
}

export function LogTabs({ counts, active, onChange }: LogTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={LOG_TABS_LABEL}
      data-guide-id="guide-log-tabs"
      className="flex flex-wrap gap-1 border-b border-border px-4 pt-2"
    >
      {LOG_TYPE_ORDER.map((type) => {
        const selected = type === active;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`log-tab-${type}`}
            onClick={() => onChange(type)}
            className={cn(
              "rounded-t-md border border-b-0 px-3 py-1.5 text-[13px]",
              selected
                ? "border-border bg-panel text-text"
                : "border-transparent text-muted-fg hover:text-text",
            )}
          >
            {LOG_TYPE_LABELS[type]}
            <span className="ml-1.5 font-mono text-[11px] text-muted-fg">{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
