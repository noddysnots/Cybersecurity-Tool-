import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui";
import {
  EvidenceList,
  HistoryRca,
  IntakeStep,
  PlaybookRail,
  ReplyBox,
  ScopeStep,
  TicketHeader,
  TicketThread,
} from "@/components/workspace";
import { getHistoryTicket } from "@/content/history";
import { workspaceCopy } from "@/content/workspace";
import {
  useCaseEngine,
  type CaseTicketId,
} from "@/lib/case-engine";
import {
  canSelectStep,
  getPlaybookGates,
  isCaseTicketId,
  unansweredQuestionIds,
} from "@/lib/playbook";
import { findSeededTicket } from "@/lib/tickets-view";
import type { PlaybookStep, TicketStatus } from "@/types";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function typingDelayMs(): number {
  return prefersReducedMotion() ? 100 : 1400;
}

function TicketNotFound({ id }: { id: string }) {
  return (
    <div
      className="flex h-full items-center justify-center px-6 py-10"
      data-testid="ticket-not-found"
    >
      <div className="w-full max-w-lg rounded-[var(--radius-panel)] border border-border bg-surface-1 p-6">
        <p className="font-mono text-sm text-text-faint">{id}</p>
        <h1 className="mt-2 text-xl font-medium text-text">{workspaceCopy.notFoundTitle}</h1>
        <p className="mt-2 text-sm text-text-muted">{workspaceCopy.notFoundBody}</p>
        <div className="mt-5">
          <Button asChild>
            <Link to="/tickets">{workspaceCopy.backToTickets}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LaterStepPanel({ step }: { step: PlaybookStep }) {
  return (
    <div className="space-y-2 p-4" data-testid={`step-${step}`}>
      <h2 className="text-base font-medium capitalize text-text">{step}</h2>
      <p className="text-sm text-text-muted">{workspaceCopy.laterStep}</p>
    </div>
  );
}

function LockedStepPanel({ reason }: { reason: string }) {
  return (
    <div className="space-y-2 p-4" data-testid="step-locked">
      <h2 className="text-base font-medium text-text">{workspaceCopy.lockedPlaceholder}</h2>
      <p className="text-sm text-text-muted">{reason}</p>
    </div>
  );
}

function WorkableWorkspace({ ticketId }: { ticketId: CaseTicketId }) {
  const ticket = findSeededTicket(ticketId);
  const state = useCaseEngine((s) => s.tickets[ticketId]);
  const acknowledge = useCaseEngine((s) => s.acknowledge);
  const askQuestion = useCaseEngine((s) => s.askQuestion);
  const askAllQuestions = useCaseEngine((s) => s.askAllQuestions);
  const deliverAnswer = useCaseEngine((s) => s.deliverAnswer);
  const deliverPendingAnswers = useCaseEngine((s) => s.deliverPendingAnswers);
  const markKeyFinding = useCaseEngine((s) => s.markKeyFinding);
  const setStep = useCaseEngine((s) => s.setStep);
  const setStatus = useCaseEngine((s) => s.setStatus);
  const postReply = useCaseEngine((s) => s.postReply);

  const [asking, setAsking] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!ticket || !state) {
    return <TicketNotFound id={ticketId} />;
  }

  const seededTicket = ticket;
  const caseState = state;
  const gates = getPlaybookGates(caseState);
  const activeGate = gates[caseState.step];
  const typing = asking || caseState.pendingQuestions.length > 0;

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleDelivery(mode: "one" | "all", questionId?: string) {
    clearTimer();
    setAsking(true);
    timerRef.current = window.setTimeout(() => {
      if (mode === "all") {
        deliverPendingAnswers(ticketId);
      } else if (questionId) {
        deliverAnswer(ticketId, questionId);
      }
      setAsking(false);
      timerRef.current = null;
    }, typingDelayMs());
  }

  function handleAsk(questionId: string) {
    if (asking) return;
    askQuestion(ticketId, questionId);
    scheduleDelivery("one", questionId);
  }

  function handleAskAll() {
    if (asking) return;
    const ids = unansweredQuestionIds(caseState);
    if (ids.length === 0) return;
    askAllQuestions(ticketId, ids);
    scheduleDelivery("all");
  }

  function handleSelectStep(step: PlaybookStep) {
    if (!canSelectStep(caseState, step)) return;
    setStep(ticketId, step);
  }

  function renderStep() {
    if (!activeGate.unlocked && caseState.step !== "intake") {
      return <LockedStepPanel reason={activeGate.reason} />;
    }
    switch (caseState.step) {
      case "intake":
        return (
          <IntakeStep
            ticket={seededTicket}
            state={caseState}
            onAcknowledge={(body) => acknowledge(ticketId, body)}
          />
        );
      case "scope":
        return (
          <ScopeStep
            state={caseState}
            asking={typing}
            onAsk={handleAsk}
            onAskAll={handleAskAll}
            onMarkKeyFinding={(id) => markKeyFinding(ticketId, id)}
          />
        );
      case "evidence":
        return (
          <div className="space-y-2 p-4" data-testid="step-evidence">
            <h2 className="text-base font-medium text-text">Evidence</h2>
            <p className="text-sm text-text-muted">{gates.evidence.reason}</p>
          </div>
        );
      default:
        return <LaterStepPanel step={caseState.step} />;
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="ticket-workspace">
      <TicketHeader
        ticket={seededTicket}
        state={caseState}
        onStatusChange={(status: TicketStatus) => setStatus(ticketId, status)}
      />
      <div className="flex min-h-0 flex-1">
        <PlaybookRail state={caseState} onSelect={handleSelectStep} />
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto border-r border-border bg-bg">
          {renderStep()}
        </section>
        <aside className="flex w-[340px] shrink-0 flex-col bg-surface-1">
          <TicketThread messages={caseState.thread} typing={typing} />
          <EvidenceList items={caseState.pinnedEvidence} />
          <ReplyBox
            caseKey={caseState.caseKey}
            onSend={(body, internal) => postReply(ticketId, body, internal)}
          />
        </aside>
      </div>
    </div>
  );
}

function HistoryWorkspace({ ticketId }: { ticketId: string }) {
  const ticket = findSeededTicket(ticketId);
  const history = getHistoryTicket(ticketId);

  if (!ticket || !history) {
    return <TicketNotFound id={ticketId} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="ticket-workspace-history">
      <TicketHeader ticket={ticket} readOnly />
      <div className="border-b border-border bg-[color-mix(in_srgb,var(--warn)_10%,var(--surface-1))] px-4 py-2 text-xs text-text-muted">
        {workspaceCopy.readOnlyBanner}
      </div>
      <div className="flex min-h-0 flex-1">
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto border-r border-border">
          <HistoryRca rca={history.rca} />
        </section>
        <aside className="flex w-[340px] shrink-0 flex-col bg-surface-1">
          <TicketThread messages={history.thread} readOnly />
          <EvidenceList items={[]} />
          <div className="border-t border-border px-3 py-3 text-xs text-text-faint">
            Reply box disabled for closed history tickets.
          </div>
        </aside>
      </div>
    </div>
  );
}

export function TicketWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ?? "";

  if (!ticketId || !findSeededTicket(ticketId)) {
    return <TicketNotFound id={ticketId || "unknown"} />;
  }

  if (isCaseTicketId(ticketId)) {
    return <WorkableWorkspace ticketId={ticketId} />;
  }

  return <HistoryWorkspace ticketId={ticketId} />;
}
