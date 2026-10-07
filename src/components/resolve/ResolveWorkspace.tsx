"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EntityChips } from "@/components/alerts/EntityChips";
import { SeverityBadge } from "@/components/alerts/SeverityBadge";
import { StatusBadge } from "@/components/alerts/StatusBadge";
import {
  AUDIT_ACTIONS,
  RESOLVE_COPY,
  ROOT_CAUSE_LABELS,
} from "@/content/resolve";
import { applyOverrides, entityList } from "@/lib/alerts";
import {
  buildEscalationMarkdown,
  buildEscalationPlainText,
  defaultResolutionDraft,
  draftClosureNote,
  finalizeActionFor,
  resolveGate,
  runScenarioVerify,
  type VerifyResult,
} from "@/lib/resolve";
import { USER_NAME } from "@/content/shell";
import {
  GUIDE_ACTION_EVENT,
  isGuideActionEvent,
  requestGuideAction,
} from "@/lib/guide-actions";
import { useAppStore } from "@/lib/store";
import type { Alert, AlertStatus, GuideActionId, RootCauseKind } from "@/types";

const RESOLVE_GUIDE_ACTIONS = new Set<GuideActionId>([
  "set-root-misconfiguration",
  "set-root-config-drift",
  "set-root-true-threat",
  "stage-policy-a",
  "apply-config-b",
  "prepare-escalation-c",
  "run-verify",
]);
import { AuditTrail } from "./AuditTrail";
import { ClosureNote } from "./ClosureNote";
import { EvidencePanel } from "./EvidencePanel";
import { OutcomePanel } from "./OutcomePanel";
import { ResolveFooter } from "./ResolveFooter";
import { RootCausePanel } from "./RootCausePanel";
import { VerifyStep } from "./VerifyStep";

const LOADING_MS = 350;

interface ResolveWorkspaceProps {
  alert: Alert;
}

export function ResolveWorkspace({ alert: baseAlert }: ResolveWorkspaceProps) {
  const router = useRouter();
  const overrides = useAppStore((s) => s.alertOverrides);
  const alert = useMemo(
    () => applyOverrides([baseAlert], overrides)[0] ?? baseAlert,
    [baseAlert, overrides],
  );

  const hydrated = useAppStore((s) => s.hydrated);
  const timezone = useAppStore((s) => s.timezone);
  const evidence = useAppStore((s) => s.evidence[alert.id] ?? []);
  const savedDraft = useAppStore((s) => s.resolutions[alert.id]);
  const auditEvents = useAppStore((s) => s.auditTrail[alert.id] ?? []);
  const scenarioFixes = useAppStore((s) => s.scenarioFixes);
  const patchResolution = useAppStore((s) => s.patchResolution);
  const appendAudit = useAppStore((s) => s.appendAudit);
  const setScenarioFix = useAppStore((s) => s.setScenarioFix);
  const setAlertOverride = useAppStore((s) => s.setAlertOverride);
  const setStepDone = useAppStore((s) => s.setStepDone);
  const pushToast = useAppStore((s) => s.pushToast);
  const pendingGuideAction = useAppStore((s) => s.pendingGuideAction);
  const setPendingGuideAction = useAppStore((s) => s.setPendingGuideAction);

  const draft = savedDraft ?? defaultResolutionDraft(alert);
  const seededRef = useRef(false);
  const openedRef = useRef(false);
  const lastTextAudit = useRef(draft.rootCauseText);

  const [loadError, setLoadError] = useState(false);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [lastVerify, setLastVerify] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!hydrated || seededRef.current) return;
    seededRef.current = true;
    if (!savedDraft) {
      patchResolution(alert.id, defaultResolutionDraft(alert));
    }
  }, [alert, hydrated, patchResolution, savedDraft]);

  useEffect(() => {
    if (!hydrated || openedRef.current) return;
    openedRef.current = true;
    if ((useAppStore.getState().auditTrail[alert.id] ?? []).length === 0) {
      appendAudit(alert.id, AUDIT_ACTIONS.opened);
    }
  }, [alert.id, appendAudit, hydrated]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledKey(alert.id), LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [alert.id]);

  const showLoading = !hydrated || settledKey !== alert.id;

  const action = finalizeActionFor(alert.scenarioId, draft.rootCauseKind);
  const gate = resolveGate(alert, draft);
  const entities = entityList(alert);

  function ensureDraft() {
    if (!savedDraft) {
      patchResolution(alert.id, defaultResolutionDraft(alert));
    }
  }

  function handleKindChange(kind: RootCauseKind) {
    ensureDraft();
    const note = draftClosureNote(alert, evidence, kind, draft.rootCauseText);
    patchResolution(alert.id, {
      rootCauseKind: kind,
      closureNote: draft.closureNote.trim() ? draft.closureNote : note,
      verifyPassed: null,
    });
    setLastVerify(null);
    appendAudit(alert.id, AUDIT_ACTIONS.setRootCauseKind(ROOT_CAUSE_LABELS[kind]));
  }

  function handleTextChange(text: string) {
    ensureDraft();
    patchResolution(alert.id, { rootCauseText: text });
  }

  function handleTextBlur() {
    if (draft.rootCauseText === lastTextAudit.current) return;
    lastTextAudit.current = draft.rootCauseText;
    appendAudit(alert.id, AUDIT_ACTIONS.setRootCauseText);
  }

  function handleClosureChange(value: string) {
    ensureDraft();
    patchResolution(alert.id, { closureNote: value });
  }

  function handleStageA() {
    setScenarioFix("A", true);
    patchResolution(alert.id, { verifyPassed: null });
    setLastVerify(null);
    appendAudit(alert.id, AUDIT_ACTIONS.stagedPolicy);
    pushToast(RESOLVE_COPY.toastStaged);
  }

  function handleApplyB() {
    setScenarioFix("B", true);
    patchResolution(alert.id, { verifyPassed: null });
    setLastVerify(null);
    appendAudit(alert.id, AUDIT_ACTIONS.appliedConfig);
    pushToast(RESOLVE_COPY.toastApplied);
  }

  function handleQuarantine() {
    patchResolution(alert.id, { quarantineTagged: true, verifyPassed: null });
    setLastVerify(null);
    appendAudit(alert.id, AUDIT_ACTIONS.quarantine);
    pushToast(RESOLVE_COPY.toastQuarantine);
  }

  function markPackageReady(source: "copy" | "download") {
    setScenarioFix("C", true);
    patchResolution(alert.id, { packageGenerated: true, verifyPassed: null });
    setLastVerify(null);
    appendAudit(
      alert.id,
      source === "copy" ? AUDIT_ACTIONS.copiedPackage : AUDIT_ACTIONS.downloadedPackage,
    );
  }

  async function handleCopyPackage() {
    const text = buildEscalationPlainText(alert, evidence, draft);
    try {
      await navigator.clipboard.writeText(text);
      markPackageReady("copy");
      pushToast(RESOLVE_COPY.toastCopied);
    } catch {
      markPackageReady("copy");
      pushToast(RESOLVE_COPY.toastCopied);
    }
  }

  function handleDownloadPackage() {
    const md = buildEscalationMarkdown(alert, evidence, draft);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${alert.id}-escalation.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    markPackageReady("download");
    pushToast(RESOLVE_COPY.toastDownloaded);
  }

  function handleVerify() {
    if (!alert.scenarioId) {
      const passed = true;
      const result: VerifyResult = {
        command: "n/a",
        output: "No scenario verify command for this alert.",
        passed,
      };
      setLastVerify(result);
      patchResolution(alert.id, { verifyPassed: passed });
      return;
    }
    setVerifyBusy(true);
    window.setTimeout(() => {
      const fixes = useAppStore.getState().scenarioFixes;
      const current = useAppStore.getState().resolutions[alert.id] ?? draft;
      const result = runScenarioVerify(alert.scenarioId!, fixes, current);
      setLastVerify(result);
      patchResolution(alert.id, { verifyPassed: result.passed });
      appendAudit(alert.id, AUDIT_ACTIONS.ranVerify(result.passed));
      pushToast(result.passed ? RESOLVE_COPY.toastVerifyPass : RESOLVE_COPY.toastVerifyFail);
      setVerifyBusy(false);
    }, 400);
  }

  useEffect(() => {
    function onGuideAction(event: Event) {
      if (!isGuideActionEvent(event)) return;
      const { id } = event.detail;
      if (id === "set-root-misconfiguration") {
        handleKindChange("misconfiguration");
        return;
      }
      if (id === "set-root-config-drift") {
        handleKindChange("config_drift");
        return;
      }
      if (id === "set-root-true-threat") {
        handleKindChange("true_threat");
        return;
      }
      if (id === "stage-policy-a") {
        handleStageA();
        handleVerify();
        return;
      }
      if (id === "apply-config-b") {
        handleApplyB();
        handleVerify();
        return;
      }
      if (id === "prepare-escalation-c") {
        handleQuarantine();
        void handleCopyPackage();
        return;
      }
      if (id === "run-verify") {
        handleVerify();
      }
    }
    window.addEventListener(GUIDE_ACTION_EVENT, onGuideAction);
    return () => window.removeEventListener(GUIDE_ACTION_EVENT, onGuideAction);
  });

  useEffect(() => {
    if (!pendingGuideAction || !RESOLVE_GUIDE_ACTIONS.has(pendingGuideAction)) return;
    if (showLoading) return;
    const action = pendingGuideAction;
    setPendingGuideAction(null);
    requestGuideAction(action);
  }, [pendingGuideAction, setPendingGuideAction, showLoading]);

  function handleComplete() {
    if (!gate.enabled) return;
    const status: AlertStatus =
      action === "escalate"
        ? "escalated"
        : action === "false_positive"
          ? "false_positive"
          : "resolved";
    setAlertOverride(alert.id, { status, assignee: USER_NAME });
    setStepDone(alert.id, "resolve", true);
    appendAudit(
      alert.id,
      action === "escalate"
        ? AUDIT_ACTIONS.escalated
        : action === "false_positive"
          ? AUDIT_ACTIONS.falsePositive
          : AUDIT_ACTIONS.resolved,
    );
    pushToast(
      action === "escalate"
        ? RESOLVE_COPY.toastEscalated
        : action === "false_positive"
          ? RESOLVE_COPY.toastFalsePositive
          : RESOLVE_COPY.toastResolved,
    );
    router.push("/alerts");
  }

  if (showLoading) {
    return (
      <div
        role="status"
        aria-label={RESOLVE_COPY.loadingLabel}
        className="space-y-3 p-6"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-panel" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3 p-6" role="alert">
        <div>
          <p className="text-sm font-medium text-text">{RESOLVE_COPY.errorTitle}</p>
          <p className="mt-1 text-[13px] text-muted-fg">{RESOLVE_COPY.errorBody}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setSettledKey(null);
          }}
          className="rounded-md bg-accent px-3 py-1.5 text-[13px] text-white hover:opacity-90"
        >
          {RESOLVE_COPY.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-panel px-4 py-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-base font-medium text-text">{alert.title}</h1>
            <span className="font-mono text-[12px] text-muted-fg">{alert.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SeverityBadge severity={alert.severity} />
            <StatusBadge status={alert.status} />
            <span className="text-[12px] text-muted-fg">{RESOLVE_COPY.pageLabel}</span>
          </div>
          {entities.length > 0 ? (
            <div>
              <EntityChips entities={entities} />
            </div>
          ) : null}
        </div>
        <Link
          href={`/investigate/${alert.id}`}
          className="rounded-md border border-border px-3 py-1.5 text-[13px] text-text hover:bg-surface"
        >
          {RESOLVE_COPY.backToInvestigate}
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(260px,320px)]">
          <div className="space-y-4">
            <RootCausePanel
              kind={draft.rootCauseKind}
              text={draft.rootCauseText}
              onKindChange={handleKindChange}
              onTextChange={handleTextChange}
              onTextBlur={handleTextBlur}
            />
          </div>

          <div className="space-y-4">
            <OutcomePanel
              scenarioId={alert.scenarioId}
              draft={draft}
              evidence={evidence}
              stagedA={Boolean(scenarioFixes.A)}
              appliedB={Boolean(scenarioFixes.B)}
              onStageA={handleStageA}
              onApplyB={handleApplyB}
              onQuarantine={handleQuarantine}
              onCopyPackage={() => void handleCopyPackage()}
              onDownloadPackage={handleDownloadPackage}
            />
            <AuditTrail events={auditEvents} timezone={timezone} />
          </div>

          <div className="space-y-4">
            <EvidencePanel items={evidence} timezone={timezone} />
            <ClosureNote value={draft.closureNote} onChange={handleClosureChange} />
            {alert.scenarioId ? (
              <VerifyStep result={lastVerify} onRun={handleVerify} busy={verifyBusy} />
            ) : null}
          </div>
        </div>
      </div>

      <ResolveFooter
        action={action}
        enabled={gate.enabled}
        disabledReason={gate.reason}
        onComplete={handleComplete}
      />
    </div>
  );
}

export function ResolveAlertNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-3 p-8">
      <h1 className="text-lg font-medium text-text">{RESOLVE_COPY.alertNotFoundTitle}</h1>
      <p className="text-[13px] text-muted-fg">{RESOLVE_COPY.alertNotFoundBody}</p>
      <Link href="/alerts" className="inline-flex text-[13px] text-accent hover:underline">
        {RESOLVE_COPY.backToAlerts}
      </Link>
    </div>
  );
}
