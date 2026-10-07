import type { ScopeQuestion } from "@/types";

/** Standard TAC scoping questions from PLAN section 3. */
export const SCOPE_QUESTIONS: ScopeQuestion[] = [
  {
    id: "what_fails",
    label: "What exactly fails? Exact error text or screenshot.",
    order: 1,
    summaryKey: "what",
  },
  {
    id: "when",
    label: "When did it start? Exact time and timezone of the first failure and of one recent failure.",
    order: 2,
    summaryKey: "when",
  },
  {
    id: "who",
    label:
      "Who is affected? All users, a location, a connection type (GlobalProtect vs branch), an OS?",
    order: 3,
    summaryKey: "who",
  },
  {
    id: "changes",
    label:
      "Any changes? Policy pushes, upgrades, ISP or network changes, new certificates.",
    order: 4,
    summaryKey: "changes",
  },
  {
    id: "consistent",
    label: "Is it consistent or intermittent?",
    order: 5,
  },
  {
    id: "other_apps",
    label: "What else is affected? Other apps working?",
    order: 6,
  },
  {
    id: "examples",
    label: "One failing user and one working user, with times.",
    order: 7,
    summaryKey: "examples",
  },
  {
    id: "workaround",
    label: "Is there a workaround? What is the business impact?",
    order: 8,
  },
];

/** Case 2 adds ISP and device questions used in the conversation script. */
export const CASE_2_EXTRA_QUESTIONS: ScopeQuestion[] = [
  {
    id: "isp",
    label: "Is the ISP link up? Can the firewall reach the internet?",
    order: 9,
  },
  {
    id: "device",
    label: "What is the branch firewall model and hostname?",
    order: 10,
  },
];

export function questionsForCase(caseKey: "meet-quic" | "pune-tunnel"): ScopeQuestion[] {
  if (caseKey === "pune-tunnel") {
    return [...SCOPE_QUESTIONS, ...CASE_2_EXTRA_QUESTIONS];
  }
  return SCOPE_QUESTIONS;
}
