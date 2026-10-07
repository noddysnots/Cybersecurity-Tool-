import type { CaseKey, Evidence } from "@/types";

/** Copy and auto-draft RCA content. No em or en dashes. */

export const rcaCopy = {
  title: "RCA and close",
  summary: "Summary",
  timeline: "Timeline",
  rootCause: "Root cause",
  fix: "Fix",
  prevention: "Prevention",
  editableHint: "Edit any section before closing.",
  close: "Close ticket",
  closeDisabled: "Close is enabled only after the customer confirms the fix.",
  closed: "Ticket closed",
  toastClosed: "Ticket closed",
} as const;

export type RcaDraft = {
  summary: string;
  timeline: string[];
  rootCause: string;
  fix: string;
  prevention: string;
};

const CASE_1_BASE: RcaDraft = {
  summary:
    "Remote GlobalProtect users could not join Google Meet because CHG-5120 blocked Meet media ports.",
  timeline: [
    "5 Oct 23:41 IST: secops.vikram pushed CHG-5120 adding Block-QUIC with svc-quic-block (UDP 443, 19302-19309).",
    "6 Oct 09:05 IST: First customer complaints about Meet join failures for remote users.",
    "6 Oct 10:02 IST: ankit.verma@acme.io drops on UDP 19305 matching Block-QUIC.",
    "6 Oct 10:05 IST: sana.khan@acme.io office path allows Meet via Allow-Collab-Apps on Remote Networks.",
    "Policy match proved mobile user Meet media hits Block-QUIC deny.",
    "Approved fix: Block-QUIC uses application quic with application-default; svc-quic-block removed; pushed to India West and India South.",
    "Ankit confirmed Meet works.",
  ],
  rootCause:
    "Block-QUIC used a port-based service object covering UDP 19302-19309, which Google Meet media uses. App-ID quic was not used, so legitimate Meet media was dropped for Mobile Users only.",
  fix:
    "Changed Block-QUIC to application quic with service application-default and removed svc-quic-block. Pushed to Prisma Access locations India West and India South.",
  prevention:
    "Prefer App-ID over port-based blocks for QUIC. Add Google Meet media to the change test checklist before push.",
};

const CASE_2_BASE: RcaDraft = {
  summary:
    "Pune-Branch-01 lost cloud and internet access after IPsec Phase 2 failed with NO_PROPOSAL_CHOSEN.",
  timeline: [
    "6 Oct 11:30 to 11:40 IST: CHG-4471 change window on pune-fw-01.",
    "6 Oct 11:36 IST: netops.admin set ipsec-prisma dh-group to group19.",
    "6 Oct 11:42 IST: Platform alert: Pune-Branch-01 tunnel down. IKE up, IPsec down.",
    "Branch CLI showed NO_PROPOSAL_CHOSEN (peer group14 vs local group19).",
    "Customer applied revert to group14 and committed.",
    "IPsec SA established; Pune remote network returned up; Rohit confirmed Pune is back.",
  ],
  rootCause:
    "Config drift during CHG-4471: branch IPsec crypto profile ipsec-prisma PFS DH group changed to group19 while Prisma Access expects group14. Phase 1 stayed up; Phase 2 failed.",
  fix:
    "Customer ran set network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group group14 and committed. TAC did not change the branch firewall.",
  prevention:
    "Add a post-change tunnel check (IKE and IPsec SA) to the branch change template before closing the window.",
};

export function baseRcaDraft(caseKey: CaseKey): RcaDraft {
  return caseKey === "meet-quic"
    ? { ...CASE_1_BASE, timeline: [...CASE_1_BASE.timeline] }
    : { ...CASE_2_BASE, timeline: [...CASE_2_BASE.timeline] };
}

/** Merge pinned evidence labels into the timeline when present. */
export function draftRcaFromEvidence(
  caseKey: CaseKey,
  pinned: Evidence[],
): RcaDraft {
  const draft = baseRcaDraft(caseKey);
  if (pinned.length === 0) {
    return draft;
  }
  const evidenceLines = pinned.map(
    (item) => `Evidence: ${item.label}${item.note ? ` (${item.note})` : ""}`,
  );
  return {
    ...draft,
    timeline: [...draft.timeline.slice(0, -2), ...evidenceLines, ...draft.timeline.slice(-2)],
  };
}
