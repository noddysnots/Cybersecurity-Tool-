/** Copy and proposed change data for Fix step. No em or en dashes. */

export const fixCopy = {
  title: "Fix",
  case1Hint:
    "Correct Block-QUIC to use App-ID quic with application-default, and remove svc-quic-block.",
  case2Hint:
    "TAC does not change the branch firewall. Send the exact revert for Rohit to apply and commit.",
  before: "Before",
  after: "After",
  objectRemoval: "Object removal",
  removeSvc: "svc-quic-block will be removed after the rule no longer references it.",
  requestApproval: "Request approval",
  approvalSent: "Approval requested",
  waitingApproval: "Waiting for customer approval…",
  pushConfig: "Push config",
  pushRunning: "Push in progress",
  pushDone: "Push complete",
  pushIdleHint: "Request approval, then push after the customer approves.",
  pushNeedApproval: "Customer approval required before push.",
  branchProfile: "Branch (pune-fw-01)",
  prismaProfile: "Prisma Access",
  cryptoField: "PFS DH group",
  revertCommand: "Revert command",
  copyCommand: "Copy",
  copied: "Copied",
  requestCustomerAction: "Request customer action",
  actionSent: "Customer action requested",
  waitingApply: "Waiting for customer to apply…",
  applied: "Customer applied the revert. Tunnel state will flip.",
  continueVerify: "Continue to Verify",
  field: "Field",
  app: "Application",
  service: "Service",
  action: "Action",
  ruleName: "Rule",
  container: "Container",
} as const;

export const CASE_1_RULE_DIFF = {
  ruleName: "Block-QUIC",
  container: "Mobile Users",
  before: {
    app: "any",
    service: "svc-quic-block",
    action: "drop",
  },
  after: {
    app: "quic",
    service: "application-default",
    action: "drop",
  },
  removeObject: {
    name: "svc-quic-block",
    protocol: "udp",
    ports: "443, 19302-19309",
  },
} as const;

export const CASE_2_CRYPTO_DIFF = {
  profile: "ipsec-prisma",
  field: "dh-group",
  branchValue: "group19",
  prismaValue: "group14",
  revertCommand:
    "set network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group group14",
  commitHint: "Then commit on pune-fw-01.",
} as const;

export const PUSH_STAGE_LABELS: Record<
  "queued" | "validating" | "pushing-india-west" | "pushing-india-south" | "success",
  string
> = {
  queued: "Queued",
  validating: "Validating",
  "pushing-india-west": "Pushing to India West",
  "pushing-india-south": "Pushing to India South",
  success: "Success",
};
