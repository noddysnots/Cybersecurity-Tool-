"use client";

import { Compass } from "lucide-react";
import Link from "next/link";
import { ALERTS_COPY, TOASTS } from "@/content/alerts";
import { USER_NAME } from "@/content/shell";
import { entityList } from "@/lib/alerts";
import { useAppStore } from "@/lib/store";
import { formatAbsolute, formatRelative } from "@/lib/time";
import type { Alert } from "@/types";
import { AlertRowActions } from "./AlertRowActions";
import { EntityChips } from "./EntityChips";

export function TitleCell({ alert }: { alert: Alert }) {
  const guideOn = useAppStore((s) => s.guideOn);
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Link
          href={`/investigate/${alert.id}`}
          className="truncate text-[13px] font-medium text-text hover:underline"
        >
          {alert.title}
        </Link>
        {guideOn && alert.scenarioId ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-accent px-1.5 text-[11px] text-text">
            <Compass className="size-3 text-accent" aria-hidden="true" />
            {ALERTS_COPY.guidedBadge}
          </span>
        ) : null}
      </div>
      <div className="font-mono text-[12px] text-muted-fg">{alert.id}</div>
    </div>
  );
}

export function EntitiesCell({ alert }: { alert: Alert }) {
  return <EntityChips entities={entityList(alert)} />;
}

export function FirstSeenCell({ alert }: { alert: Alert }) {
  const timezone = useAppStore((s) => s.timezone);
  return (
    <time
      dateTime={alert.createdAt}
      title={formatAbsolute(alert.createdAt, timezone)}
      className="text-[13px] text-text"
    >
      {formatRelative(alert.createdAt, timezone)}
    </time>
  );
}

export function AssigneeCell({ alert }: { alert: Alert }) {
  if (!alert.assignee) {
    return <span className="text-[13px] text-muted-fg">{ALERTS_COPY.unassigned}</span>;
  }
  return (
    <span className="text-[13px] text-text">
      {alert.assignee}
      {alert.assignee === USER_NAME ? (
        <span className="text-muted-fg">{` (${ALERTS_COPY.youSuffix})`}</span>
      ) : null}
    </span>
  );
}

export function ActionsCell({ alert }: { alert: Alert }) {
  const setAlertOverride = useAppStore((s) => s.setAlertOverride);
  const pushToast = useAppStore((s) => s.pushToast);
  return (
    <AlertRowActions
      alert={alert}
      onAssign={(a) => {
        setAlertOverride(a.id, { assignee: USER_NAME });
        pushToast(TOASTS.assigned(a.id));
      }}
      onFalsePositive={(a) => {
        setAlertOverride(a.id, { status: "false_positive" });
        pushToast(TOASTS.falsePositive(a.id));
      }}
    />
  );
}
