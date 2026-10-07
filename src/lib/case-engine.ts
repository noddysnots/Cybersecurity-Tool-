import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  CASE_1_CONVERSATION,
  CASE_2_CONVERSATION,
  getConversation,
} from "@/content/conversations";
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

export interface TicketCaseState {
  ticketId: CaseTicketId;
  caseKey: CaseKey;
  status: TicketStatus;
  step: PlaybookStep;
  answeredQuestions: string[];
  keyFindings: string[];
  pinnedEvidence: Evidence[];
  thread: Message[];
  approvalRequested: boolean;
  approvalGranted: boolean;
  fixApplied: boolean;
  verified: boolean;
  customerConfirmed: boolean;
  closed: boolean;
  pushJobPhase:
    | "idle"
    | "queued"
    | "validating"
    | "pushing-india-west"
    | "pushing-india-south"
    | "success";
}

export interface CaseEngineState {
  tickets: Record<CaseTicketId, TicketCaseState>;
  askQuestion: (ticketId: CaseTicketId, questionId: string) => void;
  askAllQuestions: (ticketId: CaseTicketId, questionIds: string[]) => void;
  markKeyFinding: (ticketId: CaseTicketId, questionId: string) => void;
  pinEvidence: (ticketId: CaseTicketId, evidence: Omit<Evidence, "ticketId" | "pinnedAt">) => void;
  unpinEvidence: (ticketId: CaseTicketId, evidenceId: string) => void;
  setStep: (ticketId: CaseTicketId, step: PlaybookStep) => void;
  requestApproval: (ticketId: CaseTicketId) => void;
  receiveApproval: (ticketId: CaseTicketId) => void;
  applyFix: (ticketId: CaseTicketId) => void;
  advancePushJob: (ticketId: CaseTicketId) => void;
  verify: (ticketId: CaseTicketId) => { ok: boolean; reason: string };
  requestCustomerConfirm: (ticketId: CaseTicketId) => void;
  receiveCustomerConfirm: (ticketId: CaseTicketId) => void;
  closeTicket: (ticketId: CaseTicketId) => { ok: boolean; reason: string };
  resetDemo: () => void;
}

function isoNow(): string {
  return now().toISOString();
}

function msgId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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
    keyFindings: [],
    pinnedEvidence: [],
    thread: intakeThread(caseKey, ticketId),
    approvalRequested: false,
    approvalGranted: false,
    fixApplied: false,
    verified: false,
    customerConfirmed: false,
    closed: false,
    pushJobPhase: "idle",
  };
}

function createInitialTickets(): Record<CaseTicketId, TicketCaseState> {
  return {
    "TKT-24817": initialTicket("meet-quic"),
    "TKT-24823": initialTicket("pune-tunnel"),
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
    [ticketId]: updater(tickets[ticketId]),
  };
}

function appendCustomerReply(
  state: TicketCaseState,
  questionId: string,
): TicketCaseState {
  if (state.answeredQuestions.includes(questionId)) {
    return state;
  }
  const script = getConversation(state.caseKey);
  const body = script.questions[questionId];
  if (!body) {
    return state;
  }
  const ask: Message = {
    id: msgId("ask"),
    ticketId: state.ticketId,
    author: "engineer",
    authorName: "Priya Nair",
    body: `Scoping: ${questionId.replaceAll("_", " ")}`,
    createdAt: isoNow(),
    kind: "scope-ask",
    questionId,
  };
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
  return {
    ...state,
    status: state.status === "open" ? "in_progress" : state.status,
    answeredQuestions: [...state.answeredQuestions, questionId],
    thread: [...state.thread, ask, reply],
  };
}

export const useCaseEngine = create<CaseEngineState>()(
  persist(
    (set, get) => ({
      tickets: createInitialTickets(),

      askQuestion(ticketId, questionId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) =>
            appendCustomerReply(current, questionId),
          ),
        }));
      },

      askAllQuestions(ticketId, questionIds) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) =>
            questionIds.reduce(
              (acc, questionId) => appendCustomerReply(acc, questionId),
              current,
            ),
          ),
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
            return {
              ...current,
              keyFindings: [...current.keyFindings, questionId],
            };
          }),
        }));
      },

      pinEvidence(ticketId, evidence) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => ({
            ...current,
            pinnedEvidence: [
              ...current.pinnedEvidence,
              {
                ...evidence,
                ticketId,
                pinnedAt: isoNow(),
              },
            ],
          })),
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

      setStep(ticketId, step) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => ({
            ...current,
            step,
          })),
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
            return {
              ...current,
              approvalRequested: true,
              status: "pending_customer",
              thread: [...current.thread, message],
            };
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
            return {
              ...current,
              approvalGranted: true,
              status: "in_progress",
              thread: [...current.thread, message],
            };
          }),
        }));
      },

      applyFix(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (!current.approvalGranted || current.fixApplied) {
              return current;
            }
            return {
              ...current,
              fixApplied: true,
              pushJobPhase: current.caseKey === "meet-quic" ? "queued" : "success",
              step: "verify",
            };
          }),
        }));
      },

      advancePushJob(ticketId) {
        const order: TicketCaseState["pushJobPhase"][] = [
          "queued",
          "validating",
          "pushing-india-west",
          "pushing-india-south",
          "success",
        ];
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (current.caseKey !== "meet-quic" || !current.fixApplied) {
              return current;
            }
            const idx = order.indexOf(current.pushJobPhase);
            if (idx < 0 || idx >= order.length - 1) {
              return current;
            }
            return { ...current, pushJobPhase: order[idx + 1] };
          }),
        }));
      },

      verify(ticketId) {
        const current = get().tickets[ticketId];
        if (!current.fixApplied) {
          return { ok: false, reason: "Cannot verify before the fix is applied." };
        }
        if (current.caseKey === "meet-quic" && current.pushJobPhase !== "success") {
          return { ok: false, reason: "Cannot verify until the config push finishes." };
        }
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (ticket) => ({
            ...ticket,
            verified: true,
            step: "verify",
          })),
        }));
        return { ok: true, reason: "Verify passed." };
      },

      requestCustomerConfirm(ticketId) {
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (current) => {
            if (!current.verified) {
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
            return {
              ...current,
              status: "pending_customer",
              thread: [...current.thread, message],
            };
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
            return {
              ...current,
              customerConfirmed: true,
              status: "resolved",
              thread: [...current.thread, message],
            };
          }),
        }));
      },

      closeTicket(ticketId) {
        const current = get().tickets[ticketId];
        if (!current.customerConfirmed) {
          return { ok: false, reason: "Cannot close before the customer confirms." };
        }
        set((state) => ({
          tickets: withTicket(state.tickets, ticketId, (ticket) => ({
            ...ticket,
            closed: true,
            status: "closed",
            step: "rca",
          })),
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
  return state.tickets[ticketId];
}

export const CASE_1_SCRIPT = CASE_1_CONVERSATION;
export const CASE_2_SCRIPT = CASE_2_CONVERSATION;
