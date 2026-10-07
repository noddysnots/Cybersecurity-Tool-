import {
  CircleAlert,
  CircleArrowDown,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { SEVERITY_LABELS } from "@/content/alerts";
import type { Severity } from "@/types";

const ICONS: Record<Severity, LucideIcon> = {
  critical: OctagonAlert,
  high: TriangleAlert,
  medium: CircleAlert,
  low: CircleArrowDown,
  info: Info,
};

const ICON_COLORS: Record<Severity, string> = {
  critical: "text-severity-critical",
  high: "text-severity-high",
  medium: "text-severity-medium",
  low: "text-severity-low",
  info: "text-severity-info",
};

/** Severity is icon plus label plus color, never color alone. Label stays in text color for contrast. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const Icon = ICONS[severity];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-text">
      <Icon className={`size-4 shrink-0 ${ICON_COLORS[severity]}`} aria-hidden="true" />
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export { ICONS as SEVERITY_ICONS, ICON_COLORS as SEVERITY_ICON_COLORS };
