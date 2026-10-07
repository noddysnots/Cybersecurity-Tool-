import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  CASE_1_CONVERSATION,
  CASE_2_CONVERSATION,
  getConversation,
} from "@/content/conversations";
import { questionsForCase } from "@/content/questions";
import { draftRcaFromEvidence, type RcaDraft } from "@/content/rca";
import { now } from "@/lib/time";
import type {
  CaseKey,
  Evidence,
  Message,
  PlaybookStep,
  TicketStatus,
  TunnelState,
} from "@/types";

export const CASE_TICKET_IDS = {
  "meet-quic": "TKT-24817",
  "pune-tunnel": "TKT-24823",
} as const;

export type CaseTicketId = (typeof CASE_TICKET_IDS)[CaseKey];

export type AuditActor = "engineer" | "customer" | "system";

export type AuditEntry = {
  id: string;
  at: string;
  actor: AuditActor;
  actorName: string;
  action: string;
};

export type PushJobPhase =
  | "idle"
  | "queued"
  | "validating"
  | "pushing-india-west"
  | "pushing-india-south"
  | "success";

export interface TicketCaseState {
  ticketId: CaseTicketId;
  caseKey: CaseKey;
  status: TicketStatus;
  step: PlaybookStep;
  answeredQuestions: string[];
  pendingQuestions: string[];
  keyFindings: string[];
  pinnedEvidence: Evidence[];
  thread: Message[];
  evidenceComplete: boolean;
  compareComplete: boolean;
  reproduceStarted: boolean;
  reproduceComplete: boolean;
  proveComplete: boolean;
  approvalRequested: boolean;
  approvalGranted: boolean;
  fixApplied: boolean;
  verified: boolean;
  confirmRequested: boolean;
  customerConfirmed: boolean;
  closed: boolean;
  pushJobPhase: PushJobPhase;
  rcaDraft: RcaDraft | null;
  auditTrail: AuditEntry[];
}

export interface CaseEngineState {
  tickets: Record<CaseTicketId, TicketCaseState>;
  acknowledge: (ticketId: CaseTicketId, body: string) => void;
  askQuestion: (ticketId: CaseTicketId, questionId: string) => void;
  askAllQuestions: (ticketId: CaseTicketId, questionIds: string[]) => void;
  deliverAnswer: (ticketId: CaseTicketId, questionId: string) => void;
  deliverPendingAnswers: (ticketId: CaseTicketId) => void;
  markKeyFinding: (ticketId: CaseTicketId, questionId: string) => void;
  pinEvidence: (ticketId: CaseTicketId, evidence: Omit<Evidence, "ticketId" | "pinnedAt">) => void;
  unpinEvidence: (ticketId: CaseTicketId, evidenceId: string) => void;
  completeEvidence: (ticketId: CaseTicketId) => void;
  completeCompare: (ticketId: CaseTicketId) => void;
  askReproduceRetry: (ticketId: CaseTicketId, body: string) => void;
  completeReproduce: (ticketId: CaseTicketId) => void;
  completeProve: (ticketId: CaseTicketId) => void;
  setStep: (ticketId: CaseTicketId, step: PlaybookStep) => void;
  setStatus: (ticketId: CaseTicketId, status: TicketStatus) => void;
  postReply: (ticketId: CaseTicketId, body: string, internal?: boolean) => void;
  requestApproval: (ticketId: CaseTicketId) => void;
  receiveApproval: (ticketId: CaseTicketId) => void;
  applyFix: (ticketId: CaseTicketId) => void;
  advancePushJob: (ticketId: CaseTicketId) => void;
  verify: (ticketId: CaseTicketId) => { ok: boolean; reason: string };
  requestCustomerConfirm: (ticketId: CaseTicketId) => void;
  receiveCustomerConfirm: (ticketId: CaseTicketId) => void;
  updateRcaDraft: (ticketId: CaseTicketId, draft: RcaDraft) => void;
  ensureRcaDraft: (ticketId: CaseTicketId) => void;
  closeTicket: (ticketId: CaseTicketId) => { ok: boolean; reason: string };
  resetDemo: () => void;
}

function isoNow(): string {
  return now().toISOString();
}

function msgId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function audit(
  actor: AuditActor,
  actorName: string,
  action: string,
): AuditEntry {
  return {
    id: msgId("audit"),
    at: isoNow(),
    actor,
    actorName,
    action,
  };
}

function appendAudit(state: TicketCaseState, entry: AuditEntry): TicketCaseState {
  return {
    ...state,
    auditTrail: [...state.auditTrail, entry],
  };
}

function intakeThread(caseKey: CaseKey, ticketId: CaseTicketId): Message[] {
  const script = getConversation(caseKey);
  return [
    {
      id: `${ticketId}-intake`,
      ticketId,
      author: "customer",
      authorName: script.contactName,
      body: script.intake,
      createdAt: caseKey === "meet-quic" ? "2026-10-06T04:42:00.000Z" : "2026-10-06T06:14:00.000Z",
      kind: "intake",
    },
  ];
}

function initialTicket(caseKey: CaseKey): TicketCaseState {
  const ticketId = CASE_TICKET_IDS[caseKey];
  return {
    ticketId,
    caseKey,
    status: "open",
    step: "intake",
    answeredQuestions: [],
    pendingQuestions: [],
    keyFindings: [],
    pinnedEvidence: [],
    thread: intakeThread(caseKey, ticketId),
    evidenceComplete: false,
    compareComplete: false,
    reproduceStarted: false,
    reproduceComplete: false,
    proveComplete: false,
    approvalRequested: false,
    approvalGranted: false,
    fixApplied: false,
    verified: false,
    confirmRequested: false,
    customerConfirmed: false,
    closed: false,
    pushJobPhase: "idle",
    rcaDraft: null,
    auditTrail: [],
  };
}

function createInitialTickets(): Record<CaseTicketId, TicketCaseState> {
  return {
    "TKT-24817": initialTicket("meet-quic"),
    "TKT-24823": initialTicket("pune-tunnel"),
  };
}

function normalizeTicket(ticket: TicketCaseState): TicketCaseState {
  return {
    ...ticket,
    pendingQuestions: ticket.pendingQuestions ?? [],
    answeredQuestions: ticket.answeredQuestions ?? [],
    keyFindings: ticket.keyFindings ?? [],
    pinnedEvidence: ticket.pinnedEvidence ?? [],
    thread: ticket.thread ?? [],
    evidenceComplete: ticket.evidenceComplete ?? false,
    compareComplete: ticket.compareComplete ?? false,
    reproduceStarted: ticket.reproduceStarted ?? false,
    reproduceComplete: ticket.reproduceComplete ?? false,
    proveComplete: ticket.proveComplete ?? false,
    approvalRequested: ticket.approvalRequested ?? false,
    approvalGranted: ticket.approvalGranted ?? false,
    fixApplied: ticket.fixApplied ?? false,
    verified: ticket.verified ?? false,
    confirmRequested: ticket.confirmRequested ?? false,
    customerConfirmed: ticket.customerConfirmed ?? false,
    closed: ticket.closed ?? false,
    pushJobPhase: ticket.pushJobPhase ?? "idle",
    rcaDraft: ticket.rcaDraft ?? null,
    auditTrail: ticket.auditTrail ?? [],
  };
}

function safeStorage(): Storage {
  const memory = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key) {
      return memory.get(key) ?? null;
    },
    key(index) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key) {
      memory.delete(key);
    },
    setItem(key, value) {
      memory.set(key, value);
    },
  };

  if (typeof localStorage === "undefined") {
    return memoryStorage;
  }

  try {
    const probe = "__triage_case_engine_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return memoryStorage;
  }
}

function withTicket(
  tickets: Record<CaseTicketId, TicketCaseState>,
  ticketId: CaseTicketId,
  updater: (current: TicketCaseState) => TicketCaseState,
): Record<CaseTicketId, TicketCaseState> {
  return {
    ...tickets,
    [ticketId]: updater(normalizeTicket(tickets[ticketId])),
  };
}

function questionLabel(caseKey: CaseKey, questionId: string): string {
  const found = questionsForCase(caseKey).find((q) => q.id === questionId);
  return found?.label ?? questionId.replaceAll("_", " ");
}

function postAsk(
  state: TicketCaseState,
  questionId: string,
): TicketCaseState {
  if (
    state.answeredQuestions.includes(questionId) ||
    state.pendingQuestions.includes(questionId)
  ) {
    return state;
  }
  const ask: Message = {
    id: msgId("ask"),
    ticketId: state.ticketId,
    author: "engineer",
    authorName: "Priya Nair",
    body: questionLabel(state.caseKey, questionId),
    createdAt: isoNow(),
    kind: "scope-ask",
    questionId,
  };
  return {
    ...state,
    status: "pending_customer",
    pendingQuestions: [...state.pendingQuestions, questionId],
    thread: [...state.thread, ask],
  };
}

function postAskAll(
  state: TicketCaseState,
  questionIds: string[],
): TicketCaseState {
  const pending = questionIds.filter(
    (id) =>
      !state.answeredQuestions.includes(id) && !state.pendingQuestions.includes(id),
  );
  if (pending.length === 0) {
    return state;
  }
  const lines = pending.map(
    (id, index) => `${index + 1}. ${questionLabel(state.caseKey, id)}`,
  );
  const ask: Message = {
    id: msgId("ask-all"),
    ticketId: state.ticketId,
    author: "engineer",
    authorName: "Priya Nair",
    body: `To scope this issue, please answer the following:\n\n${lines.join("\n")}`,
    createdAt: isoNow(),
    kind: "scope-ask",
  };
  return {
    ...state,
    status: "pending_customer",
    pendingQuestions: [...state.pendingQuestions, ...pending],
    thread: [...state.thread, ask],
  };
}

function deliverOne(
  state: TicketCaseState,
  questionId: string,
): TicketCaseState {
  if (state.answeredQuestions.includes(questionId)) {
    return state;
  }
  if (!state.pendingQuestions.includes(questionId)) {
    return state;
  }
  const script = getConversation(state.caseKey);
  const body = script.questions[questionId];
  if (!body) {
    return {
      ...state,
      pendingQuestions: state.pendingQuestions.filter((id) => id !== questionId),
    };
  }
  const reply: Message = {
    id: msgId("reply"),
    ticketId: state.ticketId,
    author: "customer",
    authorName: script.contactName,
    body,
    createdAt: isoNow(),
    kind: "scope-reply",
    questionId,
  };
  const pendingQuestions = state.pendingQuestions.filter((id) => id !== questionId);
  return {
    ...state,
    answeredQuestions: [...state.answeredQuestions, questionId],
    pendingQuestions,
    status: pendingQuestions.length > 0 ? "pending_customer" : "in_progress",
    thread: [...state.thread, reply],
  };
}

export const useCaseEngine = create<CaseEngineState>()(
  persist(
    (set, get) => ({
      tickets: createInitialTickets(),

      acknowledge(ticketId, body) {
        const trimmed = body.trim();
        if (!trimmed) return;
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.thread.some((m) => m.kind === "acknowledge")) {
              return current;
            }
            const message: Message = {
              id: msgId("ack"),
              ticketId,
              author: "engineer",
              authorName: "Priya Nair",
              body: trimmed,
              createdAt: isoNow(),
              kind: "acknowledge",
            };
            return appendAudit(
              {
                ...current,
                status: "in_progress",
                step: "scope",
                thread: [...current.thread, message],
              },
              audit("engineer", "Priya Nair", "Acknowledged ticket and started Scope"),
            );
          }),
        }));
      },

      askQuestion(ticketId, questionId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            const next = postAsk(current, questionId);
            if (next === current) return current;
            return appendAudit(
              next,
              audit(
                "engineer",
                "Priya Nair",
                `Asked customer: ${questionLabel(current.caseKey, questionId)}`,
              ),
            );
          }),
        }));
      },

      askAllQuestions(ticketId, questionIds) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            const next = postAskAll(current, questionIds);
            if (next === current) return current;
            return appendAudit(
              next,
              audit("engineer", "Priya Nair", "Asked all remaining scope questions"),
            );
          }),
        }));
      },

      deliverAnswer(ticketId, questionId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            const next = deliverOne(current, questionId);
            if (next === current) return current;
            const script = getConversation(current.caseKey);
            return appendAudit(
              next,
              audit(
                "customer",
                script.contactName,
                `Answered: ${questionLabel(current.caseKey, questionId)}`,
              ),
            );
          }),
        }));
      },

      deliverPendingAnswers(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            const next = current.pendingQuestions.reduce(
              (acc, questionId) => deliverOne(acc, questionId),
              current,
            );
            if (next === current) return current;
            const script = getConversation(current.caseKey);
            return appendAudit(
              next,
              audit("customer", script.contactName, "Answered pending scope questions"),
            );
          }),
        }));
      },

      markKeyFinding(ticketId, questionId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (
              !current.answeredQuestions.includes(questionId) ||
              current.keyFindings.includes(questionId)
            ) {
              return current;
            }
            return appendAudit(
              {
                ...current,
                keyFindings: [...current.keyFindings, questionId],
              },
              audit(
                "engineer",
                "Priya Nair",
                `Marked key finding: ${questionLabel(current.caseKey, questionId)}`,
              ),
            );
          }),
        }));
      },

      pinEvidence(ticketId, evidence) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) =>
            appendAudit(
              {
                ...current,
                evidenceComplete: true,
                pinnedEvidence: [
                  ...current.pinnedEvidence,
                  {
                    ...evidence,
                    ticketId,
                    pinnedAt: isoNow(),
                  },
                ],
              },
              audit("engineer", "Priya Nair", `Pinned evidence: ${evidence.label}`),
            ),
          ),
        }));
      },

      unpinEvidence(ticketId, evidenceId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => ({
            ...current,
            pinnedEvidence: current.pinnedEvidence.filter((item) => item.id !== evidenceId),
          })),
        }));
      },

      completeEvidence(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.evidenceComplete) return current;
            return appendAudit(
              { ...current, evidenceComplete: true },
              audit("engineer", "Priya Nair", "Marked Evidence complete"),
            );
          }),
        }));
      },

      completeCompare(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.compareComplete) return current;
            return appendAudit(
              { ...current, compareComplete: true },
              audit("engineer", "Priya Nair", "Completed Compare"),
            );
          }),
        }));
      },

      askReproduceRetry(ticketId, body) {
        const trimmed = body.trim();
        if (!trimmed) return;
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.reproduceStarted) {
              return current;
            }
            const message: Message = {
              id: msgId("reproduce"),
              ticketId,
              author: "engineer",
              authorName: "Priya Nair",
              body: trimmed,
              createdAt: isoNow(),
              kind: "retry-request",
            };
            return appendAudit(
              {
                ...current,
                reproduceStarted: true,
                reproduceComplete: true,
                status: "pending_customer",
                thread: [...current.thread, message],
              },
              audit("engineer", "Priya Nair", "Asked customer to retry now"),
            );
          }),
        }));
      },

      completeReproduce(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.reproduceComplete) return current;
            return appendAudit(
              { ...current, reproduceComplete: true },
              audit("engineer", "Priya Nair", "Completed Reproduce"),
            );
          }),
        }));
      },

      completeProve(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.proveComplete) return current;
            return appendAudit(
              { ...current, proveComplete: true },
              audit("engineer", "Priya Nair", "Completed Prove; unlocked Fix"),
            );
          }),
        }));
      },

      setStep(ticketId, step) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => ({
            ...current,
            step,
          })),
        }));
      },

      setStatus(ticketId, status) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => ({
            ...current,
            status,
          })),
        }));
      },

      postReply(ticketId, body, internal = false) {
        const trimmed = body.trim();
        if (!trimmed) return;
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            const message: Message = {
              id: msgId(internal ? "note" : "reply"),
              ticketId,
              author: "engineer",
              authorName: "Priya Nair",
              body: trimmed,
              createdAt: isoNow(),
              kind: internal ? "note" : "reply",
            };
            return {
              ...current,
              status:
                internal || current.status === "resolved" || current.status === "closed"
                  ? current.status
                  : "pending_customer",
              thread: [...current.thread, message],
            };
          }),
        }));
      },

      requestApproval(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.approvalRequested) {
              return current;
            }
            const script = getConversation(current.caseKey);
            const message: Message = {
              id: msgId("approval-req"),
              ticketId,
              author: "engineer",
              authorName: "Priya Nair",
              body: script.events.approval_request,
              createdAt: isoNow(),
              kind: "approval-request",
            };
            const label =
              current.caseKey === "meet-quic"
                ? "Requested approval to push Block-QUIC fix"
                : "Requested customer action to revert ipsec-prisma DH group";
            return appendAudit(
              {
                ...current,
                approvalRequested: true,
                status: "pending_customer",
                thread: [...current.thread, message],
              },
              audit("engineer", "Priya Nair", label),
            );
          }),
        }));
      },

      receiveApproval(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (!current.approvalRequested || current.approvalGranted) {
              return current;
            }
            const script = getConversation(current.caseKey);
            const message: Message = {
              id: msgId("approval"),
              ticketId,
              author: "customer",
              authorName: script.contactName,
              body: script.events.approval,
              createdAt: isoNow(),
              kind: "approval",
            };
            let next: TicketCaseState = {
              ...current,
              approvalGranted: true,
              status: "in_progress",
              thread: [...current.thread, message],
            };
            next = appendAudit(
              next,
              audit(
                "customer",
                script.contactName,
                current.caseKey === "meet-quic"
                  ? "Approved config change"
                  : "Applied and committed revert",
              ),
            );
            // Case 2: customer apply flips tunnel state immediately.
            if (current.caseKey === "pune-tunnel" && !current.fixApplied) {
              next = appendAudit(
                {
                  ...next,
                  fixApplied: true,
                  pushJobPhase: "success",
                },
                audit("system", "System", "Pune tunnel state flipped to up"),
              );
            }
            return next;
          }),
        }));
      },

      applyFix(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (!current.approvalGranted) {
              return current;
            }
            if (current.caseKey === "meet-quic") {
              if (current.pushJobPhase !== "idle" && current.fixApplied) {
                return current;
              }
              if (current.pushJobPhase !== "idle") {
                return current;
              }
              return appendAudit(
                {
                  ...current,
                  fixApplied: true,
                  pushJobPhase: "queued",
                },
                audit("engineer", "Priya Nair", "Started config push (queued)"),
              );
            }
            if (current.fixApplied) {
              return current;
            }
            return appendAudit(
              {
                ...current,
                fixApplied: true,
                pushJobPhase: "success",
              },
              audit("system", "System", "Fix applied; Pune tunnel up"),
            );
          }),
        }));
      },

      advancePushJob(ticketId) {
        const order: PushJobPhase[] = [
          "queued",
          "validating",
          "pushing-india-west",
          "pushing-india-south",
          "success",
        ];
        const labels: Record<Exclude<PushJobPhase, "idle">, string> = {
          queued: "Push queued",
          validating: "Push validating",
          "pushing-india-west": "Pushing to India West",
          "pushing-india-south": "Pushing to India South",
          success: "Push succeeded",
        };
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.caseKey !== "meet-quic" || !current.fixApplied) {
              return current;
            }
            const idx = order.indexOf(current.pushJobPhase);
            if (idx < 0 || idx >= order.length - 1) {
              return current;
            }
            const nextPhase = order[idx + 1];
            if (!nextPhase || nextPhase === "idle") {
              return current;
            }
            const next: TicketCaseState = {
              ...current,
              pushJobPhase: nextPhase,
            };
            return appendAudit(
              next,
              audit("system", "System", labels[nextPhase]),
            );
          }),
        }));
      },

      verify(ticketId) {
        const current = normalizeTicket(get().tickets[ticketId]);
        if (!current.fixApplied) {
          return { ok: false, reason: "Cannot verify before the fix is applied." };
        }
        if (current.caseKey === "meet-quic" && current.pushJobPhase !== "success") {
          return { ok: false, reason: "Cannot verify until the config push finishes." };
        }
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (ticket) => {
            if (ticket.verified) {
              return ticket;
            }
            return appendAudit(
              {
                ...ticket,
                verified: true,
                step: "verify",
              },
              audit("engineer", "Priya Nair", "Re-ran failing test: passed"),
            );
          }),
        }));
        return { ok: true, reason: "Verify passed." };
      },

      requestCustomerConfirm(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (!current.verified || current.confirmRequested) {
              return current;
            }
            const script = getConversation(current.caseKey);
            const message: Message = {
              id: msgId("retry"),
              ticketId,
              author: "engineer",
              authorName: "Priya Nair",
              body: script.events.retry_request,
              createdAt: isoNow(),
              kind: "retry-request",
            };
            return appendAudit(
              {
                ...current,
                confirmRequested: true,
                status: "pending_customer",
                thread: [...current.thread, message],
              },
              audit("engineer", "Priya Nair", "Asked customer to confirm the fix"),
            );
          }),
        }));
      },

      receiveCustomerConfirm(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (!current.verified || current.customerConfirmed) {
              return current;
            }
            const script = getConversation(current.caseKey);
            const message: Message = {
              id: msgId("confirm"),
              ticketId,
              author: "customer",
              authorName: script.contactName,
              body: script.events.confirm,
              createdAt: isoNow(),
              kind: "confirm",
            };
            return appendAudit(
              {
                ...current,
                customerConfirmed: true,
                confirmRequested: true,
                status: "in_progress",
                rcaDraft:
                  current.rcaDraft ??
                  draftRcaFromEvidence(current.caseKey, current.pinnedEvidence),
                thread: [...current.thread, message],
              },
              audit("customer", script.contactName, "Confirmed fix worked"),
            );
          }),
        }));
      },

      updateRcaDraft(ticketId, draft) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => ({
            ...current,
            rcaDraft: draft,
          })),
        }));
      },

      ensureRcaDraft(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.rcaDraft) return current;
            return {
              ...current,
              rcaDraft: draftRcaFromEvidence(current.caseKey, current.pinnedEvidence),
            };
          }),
        }));
      },

      closeTicket(ticketId) {
        const current = normalizeTicket(get().tickets[ticketId]);
        if (!current.customerConfirmed) {
          return { ok: false, reason: "Cannot close before the customer confirms." };
        }
        if (current.closed) {
          return { ok: true, reason: "Ticket already closed." };
        }
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (ticket) =>
            appendAudit(
              {
                ...ticket,
                closed: true,
                status: "resolved",
                step: "rca",
                rcaDraft:
                  ticket.rcaDraft ??
                  draftRcaFromEvidence(ticket.caseKey, ticket.pinnedEvidence),
              },
              audit("engineer", "Priya Nair", "Closed ticket (Resolved)"),
            ),
          ),
        }));
        return { ok: true, reason: "Ticket closed." };
      },

      resetDemo() {
        try {
          localStorage.removeItem("triage-case-engine");
        } catch {
          // ignore storage failures
        }
        set({ tickets: createInitialTickets() });
      },
    }),
    {
      name: "triage-case-engine",
      storage: createJSONStorage(() => safeStorage()),
      merge: (persisted, current) => {
        const p = persisted as Partial<CaseEngineState> | undefined;
        if (!p?.tickets) return current;
        return {
          ...current,
          ...p,
          tickets: {
            "TKT-24817": normalizeTicket({
              ...current.tickets["TKT-24817"],
              ...p.tickets["TKT-24817"],
            }),
            "TKT-24823": normalizeTicket({
              ...current.tickets["TKT-24823"],
              ...p.tickets["TKT-24823"],
            }),
          },
        };
      },
    },
  ),
);

/** Derived: Pune tunnel is down until Case 2 fix is applied. */
export function selectPuneTunnelStatus(
  state: Pick<CaseEngineState, "tickets">,
): TunnelState {
  return state.tickets["TKT-24823"].fixApplied ? "up" : "down";
}

export type MeetFlowContext = "mobile-user" | "remote-network";

/** Derived: which security rule a Meet media flow matches. */
export function selectMeetRuleMatch(
  state: Pick<CaseEngineState, "tickets">,
  context: MeetFlowContext = "mobile-user",
): { rule: string; action: "allow" | "drop"; container: string } {
  if (context === "remote-network") {
    return {
      rule: "Allow-Collab-Apps",
      action: "allow",
      container: "Remote Networks",
    };
  }
  const fixed = state.tickets["TKT-24817"].fixApplied;
  if (fixed) {
    return {
      rule: "Allow-Collab-Apps",
      action: "allow",
      container: "Mobile Users",
    };
  }
  return {
    rule: "Block-QUIC",
    action: "drop",
    container: "Mobile Users",
  };
}

/** Derived: whether verify would pass for the ticket. */
export function selectVerifyPasses(
  state: Pick<CaseEngineState, "tickets">,
  ticketId: CaseTicketId,
): boolean {
  const ticket = state.tickets[ticketId];
  if (!ticket.fixApplied) {
    return false;
  }
  if (ticket.caseKey === "meet-quic" && ticket.pushJobPhase !== "success") {
    return false;
  }
  return true;
}

export function selectCanClose(
  state: Pick<CaseEngineState, "tickets">,
  ticketId: CaseTicketId,
): boolean {
  return state.tickets[ticketId].customerConfirmed && !state.tickets[ticketId].closed;
}

export function getTicketCase(
  state: Pick<CaseEngineState, "tickets">,
  ticketId: CaseTicketId,
): TicketCaseState {
  return normalizeTicket(state.tickets[ticketId]);
}

export const CASE_1_SCRIPT = CASE_1_CONVERSATION;
export const CASE_2_SCRIPT = CASE_2_CONVERSATION;
