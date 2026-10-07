import { questionsForCase } from "@/content/questions";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import type { PlaybookStep } from "@/types";

export type StepGate = {
  unlocked: boolean;
  done: boolean;
  reason: string;
};

export function hasAcknowledged(state: TicketCaseState): boolean {
  return state.thread.some((m) => m.kind === "acknowledge") || state.step !== "intake";
}

export function scopeUnlocksEvidence(state: TicketCaseState): boolean {
  return state.answeredQuestions.includes("when") && state.answeredQuestions.includes("who");
}

function fixDone(state: TicketCaseState): boolean {
  if (state.caseKey === "meet-quic") {
    return state.fixApplied && state.pushJobPhase === "success";
  }
  return state.fixApplied;
}

/** Playbook rail gates. Evidence / Compare / Reproduce unlock after Scope (When + Who). */
export function getPlaybookGates(state: TicketCaseState): Record<PlaybookStep, StepGate> {
  const acknowledged = hasAcknowledged(state);
  const scopeReady = scopeUnlocksEvidence(state);
  const evidenceDone = state.evidenceComplete;
  const compareDone = state.compareComplete;
  const reproduceDone = state.reproduceComplete;
  const proveDone = state.proveComplete;
  const fixed = fixDone(state);

  const gates: Record<PlaybookStep, StepGate> = {
    intake: {
      unlocked: true,
      done: acknowledged,
      reason: acknowledged ? "Intake complete." : "Start here.",
    },
    scope: {
      unlocked: acknowledged,
      done: scopeReady,
      reason: acknowledged
        ? scopeReady
          ? "When and Who answered."
          : "Answer When and Who to unlock Evidence."
        : "Complete Intake first.",
    },
    evidence: {
      unlocked: scopeReady,
      done: evidenceDone,
      reason: scopeReady
        ? evidenceDone
          ? "Evidence reviewed."
          : "Review logs for the failing user, pin useful rows."
        : "Answer When and Who in Scope to unlock Evidence.",
    },
    isolate: {
      unlocked: evidenceDone,
      done: compareDone,
      reason: evidenceDone
        ? compareDone
          ? "Comparison pinned."
          : "Compare failing vs working and pin the diff."
        : "Complete Evidence (pin a row or continue) to unlock Compare.",
    },
    reproduce: {
      unlocked: compareDone,
      done: reproduceDone,
      reason: compareDone
        ? reproduceDone
          ? "Retry requested."
          : "Ask the customer to retry and watch live logs."
        : "Complete Compare to unlock Reproduce.",
    },
    prove: {
      unlocked: reproduceDone,
      done: proveDone,
      reason: reproduceDone
        ? proveDone
          ? "Hypothesis proven."
          : "Run policy match or branch CLI to prove the cause."
        : "Complete Reproduce to unlock Prove.",
    },
    fix: {
      unlocked: proveDone,
      done: fixed,
      reason: proveDone
        ? fixed
          ? "Fix applied."
          : state.caseKey === "meet-quic"
            ? "Request approval, then push the corrected Block-QUIC rule."
            : "Send the revert command and wait for the customer to apply it."
        : "Complete Prove to unlock Fix.",
    },
    verify: {
      unlocked: fixed,
      done: state.verified && state.customerConfirmed,
      reason: fixed
        ? state.customerConfirmed
          ? "Customer confirmed."
          : state.verified
            ? "Ask the customer to confirm."
            : "Re-run the failing test, then ask the customer to confirm."
        : "Apply the fix to unlock Verify.",
    },
    rca: {
      unlocked: state.customerConfirmed,
      done: state.closed,
      reason: state.customerConfirmed
        ? state.closed
          ? "Closed."
          : "Draft RCA and close."
        : "Customer confirmation required before RCA and close.",
    },
  };

  return gates;
}

const SELECTABLE_WHEN_UNLOCKED: PlaybookStep[] = [
  "intake",
  "scope",
  "evidence",
  "isolate",
  "reproduce",
  "prove",
  "fix",
  "verify",
  "rca",
];

export function canSelectStep(state: TicketCaseState, step: PlaybookStep): boolean {
  const gate = getPlaybookGates(state)[step];
  if (gate.done) return true;
  return gate.unlocked && SELECTABLE_WHEN_UNLOCKED.includes(step);
}

export function unansweredQuestionIds(state: TicketCaseState): string[] {
  const questions = questionsForCase(state.caseKey);
  return questions
    .map((q) => q.id)
    .filter(
      (id) =>
        !state.answeredQuestions.includes(id) && !state.pendingQuestions.includes(id),
    );
}

export function isCaseTicketId(id: string): id is CaseTicketId {
  return id === "TKT-24817" || id === "TKT-24823";
}
