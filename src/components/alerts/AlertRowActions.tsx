import { Ban, UserPlus } from "lucide-react";
import { ALERTS_COPY } from "@/content/alerts";
import { USER_NAME } from "@/content/shell";
import type { Alert } from "@/types";

interface AlertRowActionsProps {
  alert: Alert;
  onAssign: (alert: Alert) => void;
  onFalsePositive: (alert: Alert) => void;
}

const BUTTON =
  "inline-flex size-7 items-center justify-center rounded-md border border-border bg-panel text-text hover:bg-surface disabled:opacity-40";

export function AlertRowActions({ alert, onAssign, onFalsePositive }: AlertRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        aria-label={`${ALERTS_COPY.assignToMe}, ${alert.id}`}
        title={ALERTS_COPY.assignToMe}
        disabled={alert.assignee === USER_NAME}
        onClick={() => onAssign(alert)}
        className={BUTTON}
      >
        <UserPlus className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`${ALERTS_COPY.markFalsePositive}, ${alert.id}`}
        title={ALERTS_COPY.markFalsePositive}
        disabled={alert.status === "false_positive"}
        onClick={() => onFalsePositive(alert)}
        className={BUTTON}
      >
        <Ban className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
