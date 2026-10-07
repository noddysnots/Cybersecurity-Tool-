/** Guide coach mark copy for both cases. No em or en dashes. */

import type { CaseKey, PlaybookStep } from "@/types";

export const guideChrome = {
  title: "Guide",
  next: "Next",
  back: "Back",
  skip: "Skip",
  doItForMe: "Do it for me",
  stepOf: "of",
  whyLabel: "Why a TAC engineer does this",
  whatLabel: "What to do",
  skippedHint: "Guide skipped for this case. Turn Guide on again from the top bar to resume.",
  missingAnchor: "Open this playbook step to see the guided control.",
} as const;

export type GuideActionId =
  | "acknowledge"
  | "ask-scope-critical"
  | "complete-evidence"
  | "pin-compare"
  | "start-reproduce"
  | "run-prove"
  | "request-fix-approval"
  | "verify-and-confirm"
  | "close-rca";

export type GuideStepDef = {
  id: string;
  caseKey: CaseKey;
  playbookStep: PlaybookStep;
  /** Matches data-guide-anchor on a real control. */
  anchor: string;
  title: string;
  /** What to do. Case 1 first step must start with the PLAN first line. */
  what: string;
  why: string;
  action: GuideActionId;
};

export const CASE_1_GUIDE_STEPS: GuideStepDef[] = [
  {
    id: "c1-intake",
    caseKey: "meet-quic",
    playbookStep: "intake",
    anchor: "intake-acknowledge",
    title: "Intake",
    what: "Do not open logs yet. First find out when it started, who is affected, and what changed. Acknowledge the ticket so the customer knows you are on it, then move to Scope.",
    why: "A first response starts the SLA clock honestly and keeps the customer from opening duplicate tickets while you still have no evidence.",
    action: "acknowledge",
  },
  {
    id: "c1-scope",
    caseKey: "meet-quic",
    playbookStep: "scope",
    anchor: "scope-ask-all",
    title: "Scope",
    what: "Ask When and Who at minimum. Prefer Ask all at once so the customer answers the full TAC checklist in one reply.",
    why: "Without a time window and affected users, every log search is noise. Scope decides the Evidence query before you touch Logs.",
    action: "ask-scope-critical",
  },
  {
    id: "c1-evidence",
    caseKey: "meet-quic",
    playbookStep: "evidence",
    anchor: "evidence-continue",
    title: "Evidence",
    what: "Review the pre-scoped traffic rows for ankit.gupta around 10:02 IST. Pin a Block-QUIC deny, then continue when the window is clear.",
    why: "Pinned evidence becomes the immutable spine for Compare, Prove, Fix, and RCA. You should never re-hunt the same row later.",
    action: "complete-evidence",
  },
  {
    id: "c1-compare",
    caseKey: "meet-quic",
    playbookStep: "isolate",
    anchor: "compare-pin",
    title: "Compare",
    what: "Compare failing user ankit.gupta with working user neha.rao. Pin the comparison when rule, container, or action differ.",
    why: "Failing vs working is the fastest policy root cause path. A highlighted diff beats scrolling two log tabs by hand.",
    action: "pin-compare",
  },
  {
    id: "c1-reproduce",
    caseKey: "meet-quic",
    playbookStep: "reproduce",
    anchor: "reproduce-ask-retry",
    title: "Reproduce",
    what: "Ask the customer to retry Meet now, watch the live stream, then start a short packet capture if STUN fails.",
    why: "Live reproduce proves the issue is current, not a stale log artifact, and captures STUN with no responses for media path proof.",
    action: "start-reproduce",
  },
  {
    id: "c1-prove",
    caseKey: "meet-quic",
    playbookStep: "prove",
    anchor: "prove-run-match",
    title: "Prove",
    what: "Run Security policy match with the Meet flow pre-filled. Expect Block-QUIC deny. Pin the result.",
    why: "Policy match is the same proof a TAC engineer runs on the firewall before proposing a change. Never fix on a hunch.",
    action: "run-prove",
  },
  {
    id: "c1-fix",
    caseKey: "meet-quic",
    playbookStep: "fix",
    anchor: "fix-request-approval",
    title: "Fix",
    what: "Review the Block-QUIC diff and svc-quic-block removal. Request customer approval, then push config after approval lands.",
    why: "Written approval plus a smallest-change diff prevents unapproved pushes and keeps rollback obvious.",
    action: "request-fix-approval",
  },
  {
    id: "c1-verify",
    caseKey: "meet-quic",
    playbookStep: "verify",
    anchor: "verify-rerun",
    title: "Verify",
    what: "Re-run the policy match. It should allow. Then ask the customer to confirm Meet works.",
    why: "Verify is the gate that stops reopen tickets. Close only after the failing test passes and the customer confirms.",
    action: "verify-and-confirm",
  },
  {
    id: "c1-rca",
    caseKey: "meet-quic",
    playbookStep: "rca",
    anchor: "rca-close",
    title: "RCA, close",
    what: "Review the auto-drafted RCA from Scope and pinned evidence. Edit if needed, then close only after customer confirmation.",
    why: "A clean RCA teaches the next engineer and feeds prevention. Closing early without confirm is how tickets reopen in 7 days.",
    action: "close-rca",
  },
];

export const CASE_2_GUIDE_STEPS: GuideStepDef[] = [
  {
    id: "c2-intake",
    caseKey: "pune-tunnel",
    playbookStep: "intake",
    anchor: "intake-acknowledge",
    title: "Intake",
    what: "Pune is down on the Home health tile. Acknowledge TKT-24823, confirm it is a Remote Networks case, then Scope before opening branch CLI.",
    why: "Branch downs look like ISP failures until you ask what changed. Intake sets product and contact so Scope questions land with the right owner.",
    action: "acknowledge",
  },
  {
    id: "c2-scope",
    caseKey: "pune-tunnel",
    playbookStep: "scope",
    anchor: "scope-ask-all",
    title: "Scope",
    what: "Ask When and Who, plus whether any crypto or IKE profile changed. Ask all at once if the site contact can answer now.",
    why: "Tunnel cases live or die on the change window. CHG-4471 will only surface if you ask about recent config changes early.",
    action: "ask-scope-critical",
  },
  {
    id: "c2-evidence",
    caseKey: "pune-tunnel",
    playbookStep: "evidence",
    anchor: "evidence-continue",
    title: "Evidence",
    what: "Open the pre-scoped system and config strip for Pune. Pin the NO_PROPOSAL_CHOSEN / CHG-4471 signals, then continue.",
    why: "Phase 1 up with Phase 2 fail is a crypto mismatch pattern. Pinning it early keeps Prove and Fix honest.",
    action: "complete-evidence",
  },
  {
    id: "c2-compare",
    caseKey: "pune-tunnel",
    playbookStep: "isolate",
    anchor: "compare-pin",
    title: "Compare",
    what: "Compare Pune-Branch-01 with Mumbai-Branch-02. Pin the IPsec crypto profile diff when PFS groups disagree.",
    why: "A healthy sibling branch is the control. Diffing peer profiles isolates customer-side change from cloud outage.",
    action: "pin-compare",
  },
  {
    id: "c2-reproduce",
    caseKey: "pune-tunnel",
    playbookStep: "reproduce",
    anchor: "reproduce-ask-retry",
    title: "Reproduce",
    what: "Ask the site to retry the tunnel bring-up and watch live IKE. Start pcap if you need NO_PROPOSAL_CHOSEN on the wire.",
    why: "Live IKE proves the failure is current and matches the config audit timestamp, not a stale flap from yesterday.",
    action: "start-reproduce",
  },
  {
    id: "c2-prove",
    caseKey: "pune-tunnel",
    playbookStep: "prove",
    anchor: "prove-open-console",
    title: "Prove",
    what: "Open Branch firewall CLI and run the suggested show commands for IKE SA, IPsec SA, and tunnel status. Pin the output.",
    why: "CLI is ground truth on the branch. Policy match will not explain a Phase 2 reject; the SA tables will.",
    action: "run-prove",
  },
  {
    id: "c2-fix",
    caseKey: "pune-tunnel",
    playbookStep: "fix",
    anchor: "fix-request-approval",
    title: "Fix",
    what: "Show the crypto revert (PFS back to group14). Request approval. After approval, the customer applies and Pune returns up.",
    why: "You do not push onto the customer firewall without sign-off. The diff plus revert command is the change package.",
    action: "request-fix-approval",
  },
  {
    id: "c2-verify",
    caseKey: "pune-tunnel",
    playbookStep: "verify",
    anchor: "verify-rerun",
    title: "Verify",
    what: "Re-run tunnel status. Pune should be up. Ask the customer to confirm site traffic is restored.",
    why: "Home health and remote network status must flip together. Customer confirm is still required before close.",
    action: "verify-and-confirm",
  },
  {
    id: "c2-rca",
    caseKey: "pune-tunnel",
    playbookStep: "rca",
    anchor: "rca-close",
    title: "RCA, close",
    what: "Confirm the RCA names CHG-4471 and the PFS mismatch. Close after customer confirmation.",
    why: "Documenting the bad DH change prevents the next engineer from repeating it on another branch profile.",
    action: "close-rca",
  },
];

export function guideStepsForCase(caseKey: CaseKey): GuideStepDef[] {
  return caseKey === "meet-quic" ? CASE_1_GUIDE_STEPS : CASE_2_GUIDE_STEPS;
}
