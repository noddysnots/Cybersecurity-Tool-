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

/** Playbook rail gates for Phase 4 (Intake + Scope fully workable). */
export function getPlaybookGates(state: TicketCaseState): Record<PlaybookStep, StepGate> {
  const acknowledged = hasAcknowledged(state);
  const scopeReady = scopeUnlocksEvidence(state);

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
      done: false,
      reason: scopeReady
        ? "Evidence explorer arrives in Phase 5."
        : "Answer When and Who in Scope to unlock Evidence.",
    },
    isolate: {
      unlocked: false,
      done: false,
      reason: "Compare arrives in Phase 5 after Evidence.",
    },
    reproduce: {
      unlocked: false,
      done: false,
      reason: "Reproduce arrives in Phase 5 after Compare.",
    },
    prove: {
      unlocked: false,
      done: false,
      reason: "Prove tools arrive in Phase 6.",
    },
    fix: {
      unlocked: false,
      done: false,
      reason: "Fix arrives in Phase 7 after Prove.",
    },
    verify: {
      unlocked: false,
      done: false,
      reason: "Verify arrives in Phase 7 after Fix.",
    },
    rca: {
      unlocked: false,
      done: false,
      reason: "RCA and close arrive in Phase 7 after customer confirmation.",
    },
  };

  if (state.fixApplied) {
    gates.fix = { unlocked: true, done: true, reason: "Fix applied." };
    gates.verify = {
      unlocked: true,
      done: state.verified,
      reason: state.verified ? "Verified." : "Re-run the failing test.",
    };
  }
  if (state.customerConfirmed) {
    gates.rca = {
      unlocked: true,
      done: state.closed,
      reason: state.closed ? "Closed." : "Draft RCA and close.",
    };
  }

  return gates;
}

export function canSelectStep(state: TicketCaseState, step: PlaybookStep): boolean {
  const gate = getPlaybookGates(state)[step];
  if (gate.done) return true;
  return gate.unlocked && (step === "intake" || step === "scope" || step === "evidence");
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
