import { ALERTS_COPY, SEVERITY_LABELS } from "@/content/alerts";
import { SEVERITIES } from "@/lib/alerts";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types";
import { SEVERITY_ICON_COLORS, SEVERITY_ICONS } from "./SeverityBadge";

interface SeveritySummaryProps {
  counts: Record<Severity, number>;
  total: number;
  active?: Severity;
  onChange: (severity: Severity | undefined) => void;
}

function pillClass(pressed: boolean) {
  return cn(
    "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[13px] text-text",
    pressed ? "border-accent bg-accent/10" : "border-border bg-panel hover:bg-surface",
  );
}

/** Compact severity counts that double as filters. Counts respect every other active filter. */
export function SeveritySummary({ counts, total, active, onChange }: SeveritySummaryProps) {
  return (
    <div role="group" aria-label={ALERTS_COPY.summaryLabel} className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-pressed={!active}
        onClick={() => onChange(undefined)}
        className={pillClass(!active)}
      >
        {ALERTS_COPY.summaryAll}
        <span className="tabular-nums text-muted-fg">{total}</span>
      </button>
      {SEVERITIES.map((severity) => {
        const Icon = SEVERITY_ICONS[severity];
        const pressed = active === severity;
        return (
          <button
            key={severity}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(pressed ? undefined : severity)}
            className={pillClass(pressed)}
          >
            <Icon className={cn("size-3.5", SEVERITY_ICON_COLORS[severity])} aria-hidden="true" />
            {SEVERITY_LABELS[severity]}
            <span className="tabular-nums text-muted-fg">{counts[severity]}</span>
          </button>
        );
      })}
    </div>
  );
}
