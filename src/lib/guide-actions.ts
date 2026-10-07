/** Run Guide "Do it for me" actions against the case engine. */

import { getConversation } from "@/content/conversations";
import type { GuideActionId } from "@/content/guide";
import {
  useCaseEngine,
  type CaseTicketId,
} from "@/lib/case-engine";
import { unansweredQuestionIds } from "@/lib/playbook";
import { useUiPrefs } from "@/lib/ui-prefs";
import type { EvidenceSource, PlaybookStep } from "@/types";

function pinStub(
  ticketId: CaseTicketId,
  source: EvidenceSource,
  label: string,
  refId: string,
) {
  useCaseEngine.getState().pinEvidence(ticketId, {
    id: `guide-${refId}-${ticketId}`,
    source,
    label,
    refId,
    note: "Pinned by Guide",
  });
}

function finishCase1Push(ticketId: CaseTicketId) {
  const advance = () => {
    const cur = useCaseEngine.getState().tickets[ticketId];
    if (!cur || cur.caseKey !== "meet-quic") return;
    if (cur.pushJobPhase === "success" || cur.pushJobPhase === "idle") return;
    useCaseEngine.getState().advancePushJob(ticketId);
    window.setTimeout(advance, 40);
  };
  advance();
}

function ensureFixApplied(ticketId: CaseTicketId) {
  let cur = useCaseEngine.getState().tickets[ticketId];
  if (!cur) return;
  if (!cur.approvalGranted) {
    if (!cur.approvalRequested) {
      useCaseEngine.getState().requestApproval(ticketId);
    }
    useCaseEngine.getState().receiveApproval(ticketId);
    cur = useCaseEngine.getState().tickets[ticketId];
  }
  if (cur && !cur.fixApplied) {
    useCaseEngine.getState().applyFix(ticketId);
    if (cur.caseKey === "meet-quic") {
      finishCase1Push(ticketId);
    }
  } else if (cur?.caseKey === "meet-quic" && cur.pushJobPhase !== "success") {
    finishCase1Push(ticketId);
  }
}

export function runGuideAction(
  ticketId: CaseTicketId,
  action: GuideActionId,
): void {
  const engine = useCaseEngine.getState();
  const state = engine.tickets[ticketId];
  if (!state) return;

  const script = getConversation(state.caseKey);
  const go = (step: PlaybookStep) => engine.setStep(ticketId, step);

  switch (action) {
    case "acknowledge": {
      go("intake");
      if (state.status === "open") {
        engine.acknowledge(ticketId, script.events.acknowledge);
      } else {
        go("scope");
      }
      return;
    }
    case "ask-scope-critical": {
      go("scope");
      const ids = unansweredQuestionIds(state);
      if (ids.length === 0) {
        if (
          state.answeredQuestions.includes("when") &&
          state.answeredQuestions.includes("who")
        ) {
          go("evidence");
        }
        return;
      }
      engine.askAllQuestions(ticketId, ids);
      window.setTimeout(() => {
        useCaseEngine.getState().deliverPendingAnswers(ticketId);
      }, 50);
      return;
    }
    case "complete-evidence": {
      go("evidence");
      if (state.pinnedEvidence.length === 0) {
        pinStub(
          ticketId,
          state.caseKey === "meet-quic" ? "traffic" : "system",
          state.caseKey === "meet-quic"
            ? "Block-QUIC deny for ankit.gupta"
            : "IKE NO_PROPOSAL_CHOSEN on Pune",
          "evidence",
        );
      }
      engine.completeEvidence(ticketId);
      return;
    }
    case "pin-compare": {
      go("isolate");
      pinStub(
        ticketId,
        state.caseKey === "meet-quic" ? "traffic" : "network",
        state.caseKey === "meet-quic"
          ? "Failing vs working user diff"
          : "Pune vs Mumbai crypto diff",
        "compare",
      );
      engine.completeCompare(ticketId);
      return;
    }
    case "start-reproduce": {
      go("reproduce");
      const retryBody =
        state.caseKey === "meet-quic"
          ? "Ankit, please retry joining the Meet call now. I am watching traffic logs live."
          : "Rohit, please have a user at Pune retry cloud access now. I am watching system and tunnel logs live.";
      if (!state.reproduceStarted) {
        engine.askReproduceRetry(ticketId, retryBody);
      }
      engine.completeReproduce(ticketId);
      return;
    }
    case "run-prove": {
      go("prove");
      if (state.caseKey === "pune-tunnel") {
        useUiPrefs.getState().setConsoleMode("branch");
        useUiPrefs.getState().setConsoleOpen(true);
      }
      pinStub(
        ticketId,
        state.caseKey === "meet-quic" ? "policy" : "tool",
        state.caseKey === "meet-quic"
          ? "Policy match Block-QUIC deny"
          : "Branch CLI IPsec SA fail",
        "prove",
      );
      engine.completeProve(ticketId);
      return;
    }
    case "request-fix-approval": {
      go("fix");
      if (!state.approvalRequested) {
        engine.requestApproval(ticketId);
      }
      window.setTimeout(() => {
        ensureFixApplied(ticketId);
      }, 80);
      return;
    }
    case "verify-and-confirm": {
      go("verify");
      ensureFixApplied(ticketId);
      window.setTimeout(() => {
        const verifyResult = useCaseEngine.getState().verify(ticketId);
        if (!verifyResult.ok) return;
        useCaseEngine.getState().requestCustomerConfirm(ticketId);
        window.setTimeout(() => {
          useCaseEngine.getState().receiveCustomerConfirm(ticketId);
        }, 40);
      }, 200);
      return;
    }
    case "close-rca": {
      go("rca");
      ensureFixApplied(ticketId);
      window.setTimeout(() => {
        const latest = useCaseEngine.getState().tickets[ticketId];
        if (!latest) return;
        if (!latest.verified) {
          useCaseEngine.getState().verify(ticketId);
        }
        if (!useCaseEngine.getState().tickets[ticketId]?.customerConfirmed) {
          if (!useCaseEngine.getState().tickets[ticketId]?.confirmRequested) {
            useCaseEngine.getState().requestCustomerConfirm(ticketId);
          }
          useCaseEngine.getState().receiveCustomerConfirm(ticketId);
        }
        useCaseEngine.getState().ensureRcaDraft(ticketId);
        useCaseEngine.getState().closeTicket(ticketId);
      }, 240);
      return;
    }
  }
}
