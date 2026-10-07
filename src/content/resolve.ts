import type { RootCauseKind, ScenarioId } from "@/types";

export const RESOLVE_COPY = {
  pageLabel: "Resolution",
  loadingLabel: "Loading resolution",
  alertNotFoundTitle: "Alert not found",
  alertNotFoundBody: "No alert matches this link. Go back to the alerts queue and pick one.",
  backToAlerts: "Back to alerts",
  backToInvestigate: "Investigate",
  errorTitle: "Could not load resolution",
  errorBody: "Something went wrong while reading this alert. Try again, or go back to the queue.",
  retry: "Try again",
  rootCauseTitle: "Root cause",
  rootCauseKindLabel: "Cause type",
  rootCauseTextLabel: "Root cause detail",
  rootCauseTextPlaceholder: "Short statement of what caused this alert",
  outcomeTitle: "Outcome",
  evidenceTitle: "Pinned evidence",
  evidenceEmpty: "No evidence pinned yet. Pin log rows or console output during investigation.",
  evidenceMissing: "Pinned log no longer available",
  closureTitle: "Closure note",
  closureLabel: "Note for the ticket",
  verifyTitle: "Verify",
  verifyRun: "Run verify",
  verifyRerun: "Run again",
  verifyIdle: "Run the verify step before closing.",
  verifyPass: "Verify passed",
  verifyFail: "Verify failed",
  verifyPassHint: "The check matches the expected result. You can close this alert.",
  verifyFailHint: "The check did not match. Stage or apply the fix, then run verify again.",
  verifyCommandLabel: "Command",
  auditTitle: "Audit trail",
  auditEmpty: "No actions recorded yet.",
  auditActor: "Priya Nair",
  resolveAlert: "Resolve alert",
  escalateIr: "Escalate to IR",
  disabledNeedVerify: "Run verify and wait for a pass before closing.",
  disabledNeedPackage: "Generate the escalation package (copy or download) before escalating.",
  disabledNeedRootCause: "Select a root cause type before closing.",
  toastResolved: "Alert resolved",
  toastEscalated: "Alert escalated to IR",
  toastFalsePositive: "Alert marked false positive",
  toastStaged: "Policy change staged",
  toastApplied: "Fix applied on pune-fw-01",
  toastQuarantine: "Host added to quarantine group",
  toastCopied: "Escalation package copied",
  toastDownloaded: "Escalation package downloaded",
  toastVerifyPass: "Verify passed",
  toastVerifyFail: "Verify failed",
  genericOutcomeTitle: "Document and close",
  genericOutcomeBody:
    "This alert has no guided fix path. Record the root cause, write a closure note, then resolve or escalate.",
} as const;

export const ROOT_CAUSE_OPTIONS: readonly { id: RootCauseKind; label: string }[] = [
  { id: "misconfiguration", label: "Misconfiguration" },
  { id: "config_drift", label: "Config drift" },
  { id: "true_threat", label: "True threat" },
  { id: "false_positive", label: "False positive" },
  { id: "other", label: "Other" },
];

export const ROOT_CAUSE_LABELS: Record<RootCauseKind, string> = {
  misconfiguration: "Misconfiguration",
  config_drift: "Config drift",
  true_threat: "True threat",
  false_positive: "False positive",
  other: "Other",
};

export const POLICY_FIX_COPY = {
  title: "Policy fix",
  intro: "Stage a no-decrypt rule above Decrypt-All-Outbound for certificate pinned SaaS.",
  beforeLabel: "Before",
  afterLabel: "After",
  stage: "Stage change",
  staged: "Change staged",
  newRule: "No-Decrypt-Pinned-SaaS",
  highlightHint: "New rule highlighted above Decrypt-All-Outbound",
} as const;

export const CONFIG_FIX_COPY = {
  title: "Config fix",
  intro: "Branch and Prisma IPsec profiles disagree on PFS after CHG-4471.",
  branchLabel: "pune-fw-01 (branch)",
  prismaLabel: "Prisma side",
  apply: "Apply fix on pune-fw-01",
  applied: "Fix applied",
  mismatchHint: "PFS group mismatch highlighted",
} as const;

export const ESCALATION_COPY = {
  title: "Escalation package",
  intro: "Do not change policy. Quarantine the host and hand IR a package with evidence.",
  timelineTitle: "Timeline",
  iocsTitle: "Indicators of compromise",
  evidenceTitle: "Pinned evidence",
  assetsTitle: "Affected assets",
  quarantine: "Add host to quarantine group",
  quarantined: "Host in quarantine group",
  copyText: "Copy as text",
  downloadMd: "Download .md",
  packageReady: "Package ready for IR",
} as const;

export const DEFAULT_ROOT_CAUSE: Record<ScenarioId, { kind: RootCauseKind; text: string }> = {
  A: {
    kind: "misconfiguration",
    text: "Decryption exclusion missing for certificate pinned Salesforce traffic.",
  },
  B: {
    kind: "config_drift",
    text: "Config drift after change CHG-4471: PFS group mismatch on ipsec-prisma.",
  },
  C: {
    kind: "true_threat",
    text: "Compromised workload with command and control beaconing. Not a misconfiguration.",
  },
};

export const AUDIT_ACTIONS = {
  opened: "Opened resolution",
  setRootCauseKind: (label: string) => `Set root cause type to ${label}`,
  setRootCauseText: "Updated root cause detail",
  updatedClosure: "Updated closure note",
  stagedPolicy: "Staged decryption policy change (No-Decrypt-Pinned-SaaS)",
  appliedConfig: "Applied PFS revert on pune-fw-01 (group19 to group14)",
  quarantine: "Added prod-api-07 to quarantine group",
  copiedPackage: "Copied escalation package as text",
  downloadedPackage: "Downloaded escalation package (.md)",
  ranVerify: (passed: boolean) => (passed ? "Verify passed" : "Verify failed"),
  resolved: "Resolved alert",
  escalated: "Escalated alert to IR",
  falsePositive: "Marked alert false positive",
} as const;
