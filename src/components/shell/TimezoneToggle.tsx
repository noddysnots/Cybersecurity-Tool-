"use client";

import { TOP_BAR_COPY } from "@/content/shell";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { TimezoneMode } from "@/lib/time";

const MODES: TimezoneMode[] = ["IST", "UTC"];

export function TimezoneToggle() {
  const timezone = useAppStore((s) => s.timezone);
  const setTimezone = useAppStore((s) => s.setTimezone);

  return (
    <div
      role="group"
      aria-label={TOP_BAR_COPY.timezoneLabel}
      className="flex h-8 items-center rounded-md border border-border p-0.5"
    >
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={timezone === mode}
          onClick={() => setTimezone(mode)}
          className={cn(
            "h-6 rounded-sm px-2 font-mono text-[12px]",
            timezone === mode
              ? "bg-accent text-accent-foreground"
              : "text-muted-fg hover:text-text",
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
