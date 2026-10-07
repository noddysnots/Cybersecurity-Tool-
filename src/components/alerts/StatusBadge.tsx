import {
  CheckCircle2,
  CircleDot,
  CircleSlash,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { STATUS_LABELS } from "@/content/alerts";
import type { AlertStatus } from "@/types";

const ICONS: Record<AlertStatus, LucideIcon> = {
  new: CircleDot,
  investigating: Search,
  resolved: CheckCircle2,
  escalated: TrendingUp,
  false_positive: CircleSlash,
};

export function StatusBadge({ status }: { status: AlertStatus }) {
  const Icon = ICONS[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-text">
      <Icon className="size-3.5 shrink-0 text-muted-fg" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
