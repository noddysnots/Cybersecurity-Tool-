import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import {
  CASE_1_RULE_DIFF,
  CASE_2_CRYPTO_DIFF,
  PUSH_STAGE_LABELS,
  fixCopy,
} from "@/content/fix";
import type { CaseTicketId, PushJobPhase, TicketCaseState } from "@/lib/case-engine";

type FixStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  asking: boolean;
  onRequestApproval: () => void;
  onReceiveApproval: () => void;
  onPushConfig: () => void;
  onAdvancePush: () => void;
  onContinue: () => void;
};

const PUSH_ORDER: Exclude<PushJobPhase, "idle">[] = [
  "queued",
  "validating",
  "pushing-india-west",
  "pushing-india-south",
  "success",
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageDelayMs(): number {
  return prefersReducedMotion() ? 80 : 1200;
}

export function FixStep({
  state,
  asking,
  onRequestApproval,
  onReceiveApproval,
  onPushConfig,
  onAdvancePush,
  onContinue,
}: FixStepProps) {
  const [copied, setCopied] = useState(false);
  const pushTimers = useRef<number[]>([]);
  const approvalTimer = useRef<number | null>(null);
  const advanceRef = useRef(onAdvancePush);
  advanceRef.current = onAdvancePush;

  useEffect(() => {
    return () => {
      for (const id of pushTimers.current) {
        window.clearTimeout(id);
      }
      pushTimers.current = [];
      if (approvalTimer.current !== null) window.clearTimeout(approvalTimer.current);
    };
  }, []);

  function schedulePushStages() {
    for (const id of pushTimers.current) {
      window.clearTimeout(id);
    }
    pushTimers.current = [];
    // queued is set immediately by onPushConfig; advance through the remaining 4 stages.
    const delay = stageDelayMs();
    for (let i = 1; i <= 4; i += 1) {
      const id = window.setTimeout(() => {
        advanceRef.current();
      }, delay * i);
      pushTimers.current.push(id);
    }
  }

  function handleRequestApproval() {
    if (state.approvalRequested || asking) return;
    onRequestApproval();
    if (approvalTimer.current !== null) {
      window.clearTimeout(approvalTimer.current);
    }
    approvalTimer.current = window.setTimeout(() => {
      onReceiveApproval();
      approvalTimer.current = null;
    }, prefersReducedMotion() ? 100 : 1400);
  }

  function handlePushConfig() {
    if (!state.approvalGranted || state.pushJobPhase !== "idle") return;
    onPushConfig();
    schedulePushStages();
  }

  async function copyRevert() {
    try {
      await navigator.clipboard.writeText(CASE_2_CRYPTO_DIFF.revertCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const pushComplete =
    state.caseKey === "meet-quic"
      ? state.pushJobPhase === "success"
      : state.fixApplied;
  const canContinue = pushComplete;

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4" data-testid="step-fix">
      <div>
        <h2 className="text-base font-medium text-text">{fixCopy.title}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {state.caseKey === "meet-quic" ? fixCopy.case1Hint : fixCopy.case2Hint}
        </p>
      </div>

      {state.caseKey === "meet-quic" ? (
        <>
          <div
            className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-1"
            data-testid="fix-rule-diff"
          >
            <div className="border-b border-border px-4 py-2 text-sm font-medium text-text">
              {CASE_1_RULE_DIFF.ruleName} / {CASE_1_RULE_DIFF.container}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs text-text-faint">
                <tr>
                  <th className="px-4 py-2 font-medium">{fixCopy.field}</th>
                  <th className="px-4 py-2 font-medium">{fixCopy.before}</th>
                  <th className="px-4 py-2 font-medium">{fixCopy.after}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs text-text">
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-text-muted">{fixCopy.app}</td>
                  <td className="px-4 py-2">{CASE_1_RULE_DIFF.before.app}</td>
                  <td className="bg-[color-mix(in_srgb,var(--signal)_12%,transparent)] px-4 py-2 text-signal">
                    {CASE_1_RULE_DIFF.after.app}
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-text-muted">{fixCopy.service}</td>
                  <td className="px-4 py-2">{CASE_1_RULE_DIFF.before.service}</td>
                  <td className="bg-[color-mix(in_srgb,var(--signal)_12%,transparent)] px-4 py-2 text-signal">
                    {CASE_1_RULE_DIFF.after.service}
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-text-muted">{fixCopy.action}</td>
                  <td className="px-4 py-2">{CASE_1_RULE_DIFF.before.action}</td>
                  <td className="px-4 py-2">{CASE_1_RULE_DIFF.after.action}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
            data-testid="fix-object-removal"
          >
            <p className="text-sm font-medium text-text">{fixCopy.objectRemoval}</p>
            <p className="mt-1 font-mono text-xs text-danger line-through">
              {CASE_1_RULE_DIFF.removeObject.name}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {CASE_1_RULE_DIFF.removeObject.protocol}{" "}
              {CASE_1_RULE_DIFF.removeObject.ports}. {fixCopy.removeSvc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="fix-request-approval"
              disabled={state.approvalRequested}
              title={state.approvalRequested ? fixCopy.approvalSent : undefined}
              onClick={handleRequestApproval}
            >
              {state.approvalRequested ? fixCopy.approvalSent : fixCopy.requestApproval}
            </Button>
            {state.approvalRequested && !state.approvalGranted ? (
              <p className="text-xs text-text-faint">{fixCopy.waitingApproval}</p>
            ) : null}
            <Button
              type="button"
              size="sm"
              data-testid="fix-push-config"
              disabled={!state.approvalGranted || state.pushJobPhase !== "idle"}
              title={
                !state.approvalGranted
                  ? fixCopy.pushNeedApproval
                  : state.pushJobPhase !== "idle"
                    ? fixCopy.pushRunning
                    : undefined
              }
              onClick={handlePushConfig}
            >
              {state.pushJobPhase === "success"
                ? fixCopy.pushDone
                : state.pushJobPhase !== "idle"
                  ? fixCopy.pushRunning
                  : fixCopy.pushConfig}
            </Button>
          </div>

          {state.pushJobPhase !== "idle" ? (
            <ol
              className="space-y-2 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
              data-testid="fix-push-stages"
            >
              {PUSH_ORDER.map((phase) => {
                const currentIdx = PUSH_ORDER.indexOf(
                  state.pushJobPhase === "idle" ? "queued" : state.pushJobPhase,
                );
                const phaseIdx = PUSH_ORDER.indexOf(phase);
                const done = phaseIdx < currentIdx || state.pushJobPhase === "success";
                const active = phase === state.pushJobPhase && state.pushJobPhase !== "success";
                const success = state.pushJobPhase === "success" && phase === "success";
                return (
                  <li
                    key={phase}
                    className="flex items-center gap-2 text-sm"
                    data-testid={`push-stage-${phase}`}
                    data-state={success || done ? "done" : active ? "active" : "pending"}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        success || done
                          ? "bg-signal"
                          : active
                            ? "animate-pulse bg-accent"
                            : "bg-border-strong"
                      }`}
                      aria-hidden
                    />
                    <span
                      className={
                        success || done
                          ? "text-signal"
                          : active
                            ? "text-text"
                            : "text-text-faint"
                      }
                    >
                      {PUSH_STAGE_LABELS[phase]}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-xs text-text-faint">{fixCopy.pushIdleHint}</p>
          )}
        </>
      ) : (
        <>
          <div
            className="grid gap-3 sm:grid-cols-2"
            data-testid="fix-crypto-diff"
          >
            <div className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4">
              <p className="text-xs text-text-faint">{fixCopy.branchProfile}</p>
              <p className="mt-2 font-mono text-sm text-text">{CASE_2_CRYPTO_DIFF.profile}</p>
              <p className="mt-3 text-xs text-text-muted">{fixCopy.cryptoField}</p>
              <p className="mt-1 font-mono text-base text-danger">{CASE_2_CRYPTO_DIFF.branchValue}</p>
            </div>
            <div className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4">
              <p className="text-xs text-text-faint">{fixCopy.prismaProfile}</p>
              <p className="mt-2 font-mono text-sm text-text">{CASE_2_CRYPTO_DIFF.profile}</p>
              <p className="mt-3 text-xs text-text-muted">{fixCopy.cryptoField}</p>
              <p className="mt-1 font-mono text-base text-signal">{CASE_2_CRYPTO_DIFF.prismaValue}</p>
            </div>
          </div>

          <div
            className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
            data-testid="fix-revert-command"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-text">{fixCopy.revertCommand}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                data-testid="fix-copy-command"
                onClick={() => void copyRevert()}
              >
                {copied ? fixCopy.copied : fixCopy.copyCommand}
              </Button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text">
              {CASE_2_CRYPTO_DIFF.revertCommand}
            </pre>
            <p className="mt-2 text-xs text-text-muted">{CASE_2_CRYPTO_DIFF.commitHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="fix-request-approval"
              disabled={state.approvalRequested}
              title={state.approvalRequested ? fixCopy.actionSent : undefined}
              onClick={handleRequestApproval}
            >
              {state.approvalRequested
                ? fixCopy.actionSent
                : fixCopy.requestCustomerAction}
            </Button>
            {state.approvalRequested && !state.approvalGranted ? (
              <p className="text-xs text-text-faint">{fixCopy.waitingApply}</p>
            ) : null}
            {state.fixApplied ? (
              <p className="text-xs text-signal" data-testid="fix-applied-note">
                {fixCopy.applied}
              </p>
            ) : null}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          data-testid="fix-continue"
          disabled={!canContinue}
          title={canContinue ? undefined : fixCopy.pushIdleHint}
          onClick={onContinue}
        >
          {fixCopy.continueVerify}
        </Button>
      </div>
    </div>
  );
}
