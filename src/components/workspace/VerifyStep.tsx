import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { verifyCopy } from "@/content/verify";
import {
  CASE_1_POLICY_DEFAULTS,
  runPolicyMatch,
  runTunnelStatus,
} from "@/lib/console";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import { selectPuneTunnelStatus, useCaseEngine } from "@/lib/case-engine";

type VerifyStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  asking: boolean;
  onVerify: () => { ok: boolean; reason: string };
  onRequestConfirm: () => void;
  onReceiveConfirm: () => void;
  onContinue: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function VerifyStep({
  ticketId,
  state,
  asking,
  onVerify,
  onRequestConfirm,
  onReceiveConfirm,
  onContinue,
}: VerifyStepProps) {
  const tickets = useCaseEngine((s) => s.tickets);
  const puneState = useCaseEngine((s) => selectPuneTunnelStatus(s));
  const [output, setOutput] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current !== null) {
        window.clearTimeout(confirmTimer.current);
      }
    };
  }, []);

  function handleRerun() {
    const result = onVerify();
    if (!result.ok) {
      setVerifyError(result.reason);
      setOutput(null);
      return;
    }
    setVerifyError(null);
    if (state.caseKey === "meet-quic") {
      const match = runPolicyMatch({ tickets }, CASE_1_POLICY_DEFAULTS);
      setOutput(match.detail);
    } else {
      const tunnel = runTunnelStatus({ tickets });
      setOutput(
        [
          tunnel.output,
          "",
          `Remote network Pune-Branch-01: ${puneState}`,
          "Traffic from 10.60.0.0/16 resumed in logs.",
        ].join("\n"),
      );
    }
  }

  function handleAskConfirm() {
    if (!state.verified || state.confirmRequested || asking) return;
    onRequestConfirm();
    if (confirmTimer.current !== null) {
      window.clearTimeout(confirmTimer.current);
    }
    confirmTimer.current = window.setTimeout(() => {
      onReceiveConfirm();
      confirmTimer.current = null;
    }, prefersReducedMotion() ? 100 : 1400);
  }

  const canConfirm = state.verified && !state.confirmRequested;
  const canContinue = state.customerConfirmed;

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4" data-testid="step-verify">
      <div>
        <h2 className="text-base font-medium text-text">{verifyCopy.title}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {state.caseKey === "meet-quic" ? verifyCopy.case1Hint : verifyCopy.case2Hint}
        </p>
      </div>

      <div
        className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
        data-testid="verify-rerun-panel"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            data-testid="verify-rerun"
            disabled={
              !state.fixApplied ||
              (state.caseKey === "meet-quic" && state.pushJobPhase !== "success")
            }
            title={
              !state.fixApplied
                ? verifyCopy.rerunNeedFix
                : state.caseKey === "meet-quic" && state.pushJobPhase !== "success"
                  ? verifyCopy.rerunNeedPush
                  : undefined
            }
            onClick={handleRerun}
          >
            {verifyCopy.rerun}
          </Button>
          {state.verified ? (
            <span className="text-xs text-signal" data-testid="verify-passed">
              {verifyCopy.rerunPassed}
            </span>
          ) : null}
        </div>
        {verifyError ? (
          <p className="mt-2 text-xs text-danger" data-testid="verify-error">
            {verifyError}
          </p>
        ) : null}
        {output ? (
          <pre
            className="mt-3 overflow-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text"
            data-testid="verify-output"
          >
            {output}
          </pre>
        ) : null}
        {state.caseKey === "meet-quic" && state.verified ? (
          <p className="mt-2 text-xs text-text-muted">
            Meet media matches Allow-Collab-Apps allow on Mobile Users.
          </p>
        ) : null}
        {state.caseKey === "pune-tunnel" && state.fixApplied ? (
          <p className="mt-2 text-xs text-text-muted" data-testid="verify-pune-up">
            {verifyCopy.homeHint} Current: Pune-Branch-01 {puneState}.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          data-testid="verify-ask-confirm"
          disabled={!canConfirm}
          title={!state.verified ? "Re-run the test first" : state.confirmRequested ? verifyCopy.confirmSent : undefined}
          onClick={handleAskConfirm}
        >
          {state.confirmRequested ? verifyCopy.confirmSent : verifyCopy.askConfirm}
        </Button>
        {state.confirmRequested && !state.customerConfirmed ? (
          <p className="text-xs text-text-faint">{verifyCopy.waitingConfirm}</p>
        ) : null}
        {state.customerConfirmed ? (
          <p className="text-xs text-signal" data-testid="verify-confirmed">
            {verifyCopy.confirmed}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          data-testid="verify-continue"
          disabled={!canContinue}
          title={canContinue ? undefined : "Customer confirmation required"}
          onClick={onContinue}
        >
          {verifyCopy.continueRca}
        </Button>
      </div>
      <span className="sr-only">{ticketId}</span>
    </div>
  );
}
