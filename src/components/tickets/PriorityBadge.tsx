import { AlertTriangle, CircleAlert, Info, ShieldAlert } from "lucide-react";

import { priorityTone } from "@/lib/home-metrics";
import type { TicketPriority } from "@/types";
import { cn } from "@/lib/utils";

const ICONS = {
  P1: ShieldAlert,
  P2: AlertTriangle,
  P3: CircleAlert,
  P4: Info,
} as const;

type PriorityBadgeProps = {
  priority: TicketPriority;
  className?: string;
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const Icon = ICONS[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-border px-1.5 py-0.5 text-xs",
        className,
      )}
      style={{ color: priorityTone(priority) }}
      aria-label={`Priority ${priority}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span>{priority}</span>
    </span>
  );
}
