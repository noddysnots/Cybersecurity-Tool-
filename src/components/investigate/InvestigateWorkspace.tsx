"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  INVESTIGATE_TOASTS,
  LOGS_COPY,
  QUERY_COPY,
  WORKSPACE_COPY,
} from "@/content/investigate";
import { applyOverrides } from "@/lib/alerts";
import {
  ALL_LOGS,
  LOGS_VIEW_KEY,
  buildAlertQuery,
  centeredWindow,
  countByType,
  defaultView,
  filterLogs,
  fromWindow,
  incidentTime,
  toWindow,
  type TimeWindow,
} from "@/lib/logs";
import { railStepForGuideIndex } from "@/content/guide-steps";
import {
  GUIDE_ACTION_EVENT,
  GUIDE_PIN_LOGS,
  isGuideActionEvent,
  requestGuideAction,
  tabForGuideAction,
} from "@/lib/guide-actions";
import { appendClause, buildClause, parseQuery } from "@/lib/query-parser";
import { evidenceIdFor, useAppStore } from "@/lib/store";
import type { Alert, GuideActionId, LogRecord, LogType, StepId } from "@/types";

const INVESTIGATE_GUIDE_ACTIONS = new Set<GuideActionId>([
  "confirm-window",
  "set-tab-traffic",
  "set-tab-decryption",
  "set-tab-url",
  "set-tab-system",
  "set-tab-config",
  "set-tab-threat",
  "pin-scenario-a-logs",
  "pin-scenario-b-logs",
  "pin-scenario-c-logs",
]);
import { ConsoleDrawer } from "@/components/console";
import { AlertHeader } from "./AlertHeader";
import { EvidenceTray } from "./EvidenceTray";
import type { CellActionHandlers, FilterableField } from "./columns";
import { LogDetailDrawer } from "./LogDetailDrawer";
import { LogEmpty, LogError, LogSkeleton } from "./LogStates";
import { LogTabs } from "./LogTabs";
import { LogsTable } from "./LogsTable";
import { QueryBar } from "./QueryBar";
import { StepRail } from "./StepRail";
import { TimeScopeBar } from "./TimeScopeBar";
import { TimelineStrip } from "./TimelineStrip";

const LOADING_MS = 400;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, select, textarea, [role='combobox'], [role='menu']") !== null
  );
}

interface InvestigateWorkspaceProps {
  alert: Alert | null;
}

export function InvestigateWorkspace({ alert: baseAlert }: InvestigateWorkspaceProps) {
  const overrides = useAppStore((s) => s.alertOverrides);
  const alert = useMemo(() => {
    if (!baseAlert) return null;
    return applyOverrides([baseAlert], overrides)[0] ?? baseAlert;
  }, [baseAlert, overrides]);

  const viewKey = alert?.id ?? LOGS_VIEW_KEY;
  const hydrated = useAppStore((s) => s.hydrated);
  const timezone = useAppStore((s) => s.timezone);
  const density = useAppStore((s) => s.density);
  const savedView = useAppStore((s) => s.views[viewKey]);
  const evidence = useAppStore((s) => s.evidence[alert?.id ?? ""] ?? []);
  const stepsDone = useAppStore((s) => s.stepsDone[alert?.id ?? ""] ?? []);
  const patchView = useAppStore((s) => s.patchView);
  const pinEvidence = useAppStore((s) => s.pinEvidence);
  const unpinEvidence = useAppStore((s) => s.unpinEvidence);
  const moveEvidence = useAppStore((s) => s.moveEvidence);
  const setStepDone = useAppStore((s) => s.setStepDone);
  const pushToast = useAppStore((s) => s.pushToast);
  const guideOn = useAppStore((s) => s.guideOn);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const guideProgress = useAppStore((s) => s.guideProgress);
  const pendingGuideAction = useAppStore((s) => s.pendingGuideAction);
  const setPendingGuideAction = useAppStore((s) => s.setPendingGuideAction);

  const base = useMemo(() => defaultView(alert), [alert]);
  const view = savedView ?? base;

  const queryInputRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState(view.query);
  /** Tracks the last query we synced from the store so typing is not overwritten. */
  const [boundQuery, setBoundQuery] = useState(view.query);
  const [boundKey, setBoundKey] = useState(viewKey);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [settledKey, setSettledKey] = useState<string | null>(null);

  if (viewKey !== boundKey) {
    setBoundKey(viewKey);
    setBoundQuery(view.query);
    setDraftQuery(view.query);
  } else if (view.query !== boundQuery && draftQuery === boundQuery) {
    setBoundQuery(view.query);
    setDraftQuery(view.query);
  }

  const parsed = useMemo(() => parseQuery(view.query), [view.query]);
  const scope = useMemo(() => toWindow(view), [view]);

  const matched = useMemo(() => {
    try {
      const predicate = parsed.ok ? parsed.predicate : () => true;
      return filterLogs(ALL_LOGS, scope, predicate);
    } catch {
      return null;
    }
  }, [parsed, scope]);

  const counts = useMemo(
    () => (matched ? countByType(matched) : countByType([])),
    [matched],
  );
  const tabRows = useMemo(
    () => (matched ? matched.filter((log) => log.type === view.tab) : []),
    [matched, view.tab],
  );

  const runKey = `${view.query}|${view.windowStart}|${view.windowEnd}|${view.tab}`;
  useEffect(() => {
    const timer = setTimeout(() => setSettledKey(runKey), LOADING_MS);
    return () => clearTimeout(timer);
  }, [runKey]);
  const loading = !hydrated || settledKey !== runKey;

  const updateView = useCallback(
    (patch: Partial<typeof view>) => {
      patchView(viewKey, patch, base);
    },
    [patchView, viewKey, base],
  );

  const setWindow = useCallback(
    (window: TimeWindow) => {
      updateView(fromWindow(window));
    },
    [updateView],
  );

  const runQuery = useCallback(() => {
    setBoundQuery(draftQuery);
    updateView({ query: draftQuery });
    if (alert) setStepDone(alert.id, "logs", true);
  }, [alert, draftQuery, setStepDone, updateView]);

  const copyValue = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        pushToast(INVESTIGATE_TOASTS.copied(value));
      } catch {
        pushToast(INVESTIGATE_TOASTS.copied(value));
      }
    },
    [pushToast],
  );

  const pinLog = useCallback(
    (logId: string) => {
      if (!alert) return;
      const added = pinEvidence(alert.id, logId);
      if (added) {
        pushToast(INVESTIGATE_TOASTS.pinned);
        setStepDone(alert.id, "logs", true);
      }
    },
    [alert, pinEvidence, pushToast, setStepDone],
  );

  const unpinLog = useCallback(
    (logId: string) => {
      if (!alert) return;
      unpinEvidence(alert.id, evidenceIdFor(logId));
      pushToast(INVESTIGATE_TOASTS.unpinned);
    },
    [alert, pushToast, unpinEvidence],
  );

  const isPinned = useCallback(
    (logId: string) => evidence.some((item) => item.kind === "log" && item.logId === logId),
    [evidence],
  );

  const applyClause = useCallback(
    (field: FilterableField, value: string, mode: "include" | "exclude") => {
      const clause = buildClause(field, value, mode);
      const next = appendClause(draftQuery || view.query, clause);
      setDraftQuery(next);
      setBoundQuery(next);
      updateView({ query: next });
      pushToast(
        mode === "include" ? INVESTIGATE_TOASTS.filtered(value) : INVESTIGATE_TOASTS.excluded(value),
      );
      if (alert) setStepDone(alert.id, "logs", true);
    },
    [alert, draftQuery, pushToast, setStepDone, updateView, view.query],
  );

  const actions: CellActionHandlers = useMemo(
    () => ({
      onFilter: (field, value) => applyClause(field, value, "include"),
      onExclude: (field, value) => applyClause(field, value, "exclude"),
      onCopy: (value) => {
        void copyValue(value);
      },
      onPin: pinLog,
      onUnpin: unpinLog,
      isPinned,
      canPin: Boolean(alert),
    }),
    [alert, applyClause, copyValue, isPinned, pinLog, unpinLog],
  );

  const detailLog = detailId ? (tabRows.find((r) => r.id === detailId) ?? ALL_LOGS.find((r) => r.id === detailId) ?? null) : null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isTypingTarget(event.target)) return;
        event.preventDefault();
        queryInputRef.current?.focus();
        return;
      }
      if (event.key === "Escape" && detailId) {
        event.preventDefault();
        setDetailId(null);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if ((event.key === "j" || event.key === "k") && tabRows.length > 0) {
        event.preventDefault();
        const index = activeId ? tabRows.findIndex((r) => r.id === activeId) : -1;
        const next =
          event.key === "j"
            ? Math.min(tabRows.length - 1, Math.max(0, index + 1))
            : Math.max(0, index <= 0 ? 0 : index - 1);
        setActiveId(tabRows[next].id);
        return;
      }
      if (event.key === "Enter" && activeId) {
        event.preventDefault();
        setDetailId(activeId);
        return;
      }
      if (event.key === "p" && activeId && alert) {
        event.preventDefault();
        if (isPinned(activeId)) unpinLog(activeId);
        else pinLog(activeId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, alert, detailId, isPinned, pinLog, tabRows, unpinLog]);

  const confirmScope = useCallback(() => {
    if (!alert) return;
    setStepDone(alert.id, "scope", true);
    pushToast(INVESTIGATE_TOASTS.windowConfirmed);
  }, [alert, pushToast, setStepDone]);

  useEffect(() => {
    function onGuideAction(event: Event) {
      if (!isGuideActionEvent(event)) return;
      const { id } = event.detail;
      if (id === "confirm-window") {
        confirmScope();
        return;
      }
      const tab = tabForGuideAction(id);
      if (tab) {
        updateView({ tab });
        return;
      }
      if (!alert) return;
      if (id === "pin-scenario-a-logs") {
        for (const logId of GUIDE_PIN_LOGS.A) pinLog(logId);
        return;
      }
      if (id === "pin-scenario-b-logs") {
        for (const logId of GUIDE_PIN_LOGS.B) pinLog(logId);
        return;
      }
      if (id === "pin-scenario-c-logs") {
        for (const logId of GUIDE_PIN_LOGS.C) pinLog(logId);
      }
    }
    window.addEventListener(GUIDE_ACTION_EVENT, onGuideAction);
    return () => window.removeEventListener(GUIDE_ACTION_EVENT, onGuideAction);
  }, [alert, confirmScope, pinLog, updateView]);

  useEffect(() => {
    if (!pendingGuideAction || !INVESTIGATE_GUIDE_ACTIONS.has(pendingGuideAction)) return;
    const action = pendingGuideAction;
    setPendingGuideAction(null);
    requestGuideAction(action);
  }, [pendingGuideAction, setPendingGuideAction]);

  const guideRailStep =
    guideOn && alert?.scenarioId && activeScenario === alert.scenarioId
      ? railStepForGuideIndex(activeScenario, guideProgress[activeScenario] ?? 0)
      : undefined;

  const toggleStep = (step: StepId) => {
    if (!alert) return;
    setStepDone(alert.id, step, !stepsDone.includes(step));
  };

  const widen = () => {
    if (!alert) return;
    setWindow(centeredWindow(incidentTime(alert), 60 * 60_000));
  };

  const openLog = (log: LogRecord) => {
    setActiveId(log.id);
    setDetailId(log.id);
  };

  if (matched === null) {
    return (
      <div className="p-6">
        <LogError
          onRetry={() => {
            setLoadError(false);
            setSettledKey(null);
          }}
        />
      </div>
    );
  }

  void loadError;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      {alert ? <AlertHeader alert={alert} /> : (
        <header className="border-b border-border bg-panel px-4 py-3">
          <h1 className="text-base font-medium text-text">{LOGS_COPY.title}</h1>
          <p className="mt-1 text-[13px] text-muted-fg">{LOGS_COPY.intro}</p>
        </header>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {alert ? (
          <StepRail done={stepsDone} onToggle={toggleStep} guideCurrent={guideRailStep} />
        ) : null}

        <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            <TimeScopeBar
              alert={alert}
              view={view}
              logs={ALL_LOGS}
              timezone={timezone}
              onChange={setWindow}
              onConfirm={confirmScope}
              confirmed={Boolean(alert && stepsDone.includes("scope"))}
            />
            <TimelineStrip
              logs={matched}
              view={view}
              onSelectType={(tab) => updateView({ tab })}
            />
            <LogTabs
              counts={counts}
              active={view.tab}
              onChange={(tab: LogType) => updateView({ tab })}
            />
            <QueryBar
              ref={queryInputRef}
              value={draftQuery}
              onChange={setDraftQuery}
              onRun={runQuery}
              onReset={
                alert
                  ? () => {
                      const q = buildAlertQuery(alert);
                      setDraftQuery(q);
                      setBoundQuery(q);
                      updateView({ query: q });
                    }
                  : undefined
              }
              hasAlert={Boolean(alert)}
            />
            {!parsed.ok ? (
              <div className="p-4 text-[13px] text-muted-fg">{QUERY_COPY.invalidBody}</div>
            ) : loading ? (
              <div className="min-h-[16rem]">
                <LogSkeleton />
              </div>
            ) : tabRows.length === 0 ? (
              <LogEmpty
                canWiden={Boolean(alert)}
                onWiden={alert ? widen : undefined}
                onClearQuery={() => {
                  setDraftQuery("");
                  setBoundQuery("");
                  updateView({ query: "" });
                }}
              />
            ) : (
              <div className="flex h-[min(32rem,55vh)] min-h-[18rem] flex-col border-b border-border">
                <LogsTable
                  type={view.tab}
                  rows={tabRows}
                  timezone={timezone}
                  density={density}
                  activeId={activeId}
                  onActiveId={setActiveId}
                  onOpen={openLog}
                  actions={actions}
                />
              </div>
            )}
          </div>
          <ConsoleDrawer
            alertId={alert?.id ?? null}
            onCommandSuccess={
              alert
                ? () => {
                    if (!stepsDone.includes("console")) setStepDone(alert.id, "console", true);
                  }
                : undefined
            }
          />
        </div>

        {alert ? (
          <EvidenceTray
            items={evidence}
            timezone={timezone}
            onRemove={(itemId) => {
              unpinEvidence(alert.id, itemId);
              pushToast(INVESTIGATE_TOASTS.unpinned);
            }}
            onMove={(itemId, direction) => moveEvidence(alert.id, itemId, direction)}
            onOpen={(logId) => {
              setActiveId(logId);
              setDetailId(logId);
            }}
          />
        ) : null}
      </div>

      <LogDetailDrawer
        log={detailLog}
        timezone={timezone}
        canPin={Boolean(alert)}
        pinned={detailLog ? isPinned(detailLog.id) : false}
        onClose={() => setDetailId(null)}
        onPin={() => detailLog && pinLog(detailLog.id)}
        onUnpin={() => detailLog && unpinLog(detailLog.id)}
        onCopy={(label, value) => {
          void label;
          void copyValue(value);
        }}
      />
    </div>
  );
}

export function AlertNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-3 p-8">
      <h1 className="text-lg font-medium text-text">{WORKSPACE_COPY.alertNotFoundTitle}</h1>
      <p className="text-[13px] text-muted-fg">{WORKSPACE_COPY.alertNotFoundBody}</p>
      <Link href="/alerts" className="inline-flex text-[13px] text-accent hover:underline">
        {WORKSPACE_COPY.backToAlerts}
      </Link>
    </div>
  );
}
