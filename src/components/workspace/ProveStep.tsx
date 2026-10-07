import { useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { proveCopy } from "@/content/console";
import {
  CASE_1_POLICY_DEFAULTS,
  CASE_2_SUGGESTED_COMMANDS,
  runPolicyMatch,
  type PolicyMatchResult,
} from "@/lib/console";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import { useCaseEngine } from "@/lib/case-engine";
import { useUiPrefs } from "@/lib/ui-prefs";
import type { Evidence } from "@/types";

type ProveStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  onPin: (evidence: Omit<Evidence, "ticketId" | "pinnedAt">) => void;
  onContinue: () => void;
};

export function ProveStep({ ticketId, state, onPin, onContinue }: ProveStepProps) {
  const tickets = useCaseEngine((s) => s.tickets);
  const setConsoleOpen = useUiPrefs((s) => s.setConsoleOpen);
  const setConsoleMode = useUiPrefs((s) => s.setConsoleMode);
  const setConsoleSeed = useUiPrefs((s) => s.setConsoleSeed);

  const [matchResult, setMatchResult] = useState<PolicyMatchResult | null>(null);
  const pinnedIds = useMemo(
    () => new Set(state.pinnedEvidence.map((e) => e.refId)),
    [state.pinnedEvidence],
  );

  const matchPinned = pinnedIds.has(`prove-policy-${ticketId}`);
  const consolePinned = state.pinnedEvidence.some((e) => e.source === "tool" && e.label.startsWith("Console:"));

  function runMatch() {
    const result = runPolicyMatch({ tickets }, CASE_1_POLICY_DEFAULTS);
    setMatchResult(result);
  }

  function pinMatch() {
    if (!matchResult || matchPinned) return;
    onPin({
      id: `ev-prove-policy-${ticketId}`,
      source: "policy",
      label: `Policy match: ${matchResult.summary}`,
      refId: `prove-policy-${ticketId}`,
      note: matchResult.detail,
    });
  }

  function openBranchCli(command?: string) {
    setConsoleMode("branch");
    setConsoleOpen(true);
    if (command) {
      setConsoleSeed(command);
    }
  }

  const canContinue =
    state.proveComplete ||
    (state.caseKey === "meet-quic" ? matchPinned : consolePinned || matchPinned);

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4" data-testid="step-prove">
      <div>
        <h2 className="text-base font-medium text-text">{proveCopy.title}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {state.caseKey === "meet-quic" ? proveCopy.case1Hint : proveCopy.case2Hint}
        </p>
      </div>

      {state.caseKey === "meet-quic" ? (
        <div
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
          data-testid="prove-policy-panel"
        >
          <p className="text-sm font-medium text-text">{proveCopy.matchResult}</p>
          <dl className="mt-3 grid gap-2 font-mono text-xs text-text-muted sm:grid-cols-2">
            <div>
              <dt className="text-text-faint">Source</dt>
              <dd className="text-text">{CASE_1_POLICY_DEFAULTS.source}</dd>
            </div>
            <div>
              <dt className="text-text-faint">Destination</dt>
              <dd className="text-text">{CASE_1_POLICY_DEFAULTS.destination}</dd>
            </div>
            <div>
              <dt className="text-text-faint">Protocol / port</dt>
              <dd className="text-text">
                {CASE_1_POLICY_DEFAULTS.protocol} / {CASE_1_POLICY_DEFAULTS.destinationPort}
              </dd>
            </div>
            <div>
              <dt className="text-text-faint">Zones</dt>
              <dd className="text-text">
                {CASE_1_POLICY_DEFAULTS.fromZone} to {CASE_1_POLICY_DEFAULTS.toZone}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" data-testid="prove-run-match" onClick={runMatch}>
              {proveCopy.runMatch}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid="prove-pin-match"
              disabled={!matchResult || matchPinned}
              title={
                !matchResult
                  ? "Run policy match first"
                  : matchPinned
                    ? proveCopy.pinned
                    : undefined
              }
              onClick={pinMatch}
            >
              {matchPinned ? proveCopy.pinned : proveCopy.pinResult}
            </Button>
          </div>
          {matchResult ? (
            <pre
              className="mt-3 overflow-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text"
              data-testid="prove-match-output"
            >
              {matchResult.detail}
            </pre>
          ) : null}
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
          data-testid="prove-console-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-text">{proveCopy.suggested}</p>
            <Button
              type="button"
              size="sm"
              data-testid="prove-open-console"
              onClick={() => openBranchCli()}
            >
              {proveCopy.openConsole}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CASE_2_SUGGESTED_COMMANDS.map((cmd, index) => (
              <button
                key={cmd}
                type="button"
                data-testid={`prove-chip-${index}`}
                className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-text hover:border-signal hover:text-signal"
                onClick={() => openBranchCli(cmd)}
              >
                {cmd}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-faint">
            Run commands in the console, then pin an output block to evidence.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          data-testid="prove-continue"
          disabled={!canContinue}
          title={canContinue ? undefined : proveCopy.continueHint}
          onClick={onContinue}
        >
          {proveCopy.continue}
        </Button>
        <p className="text-xs text-text-faint">{proveCopy.continueHint}</p>
      </div>
    </div>
  );
}
