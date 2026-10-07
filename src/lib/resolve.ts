import decryptionRulesData from "@/data/decryption-rules.json";
import { DEFAULT_ROOT_CAUSE, ROOT_CAUSE_LABELS } from "@/content/resolve";
import { runCommand } from "@/lib/console/commands";
import { getLogById } from "@/lib/logs";
import type {
  Alert,
  DecryptionRule,
  EvidenceItem,
  ResolutionDraft,
  RootCauseKind,
  ScenarioFixes,
  ScenarioId,
} from "@/types";

const decryptionRules = decryptionRulesData as DecryptionRule[];

/** New rule staged for Scenario A, placed above Decrypt-All-Outbound. */
export const NO_DECRYPT_PINNED_RULE: DecryptionRule = {
  id: "DR-FIX-A",
  name: "No-Decrypt-Pinned-SaaS",
  order: 5,
  fromZone: "trust",
  toZone: "untrust",
  source: "any",
  urlCategory: "business-and-economy",
  type: "ssl-forward-proxy",
  action: "no-decrypt",
  hitCount: 0,
  description: "Exclude certificate pinned SaaS (*.salesforce.com).",
};

export const VERIFY_COMMANDS: Record<Exclude<ScenarioId, "C">, string> = {
  A: "test decryption-policy-match category business-and-economy from trust to untrust source 10.20.14.37 destination 13.110.54.20",
  B: "test vpn ipsec-sa tunnel tun-prisma-pune",
};

export interface VerifyResult {
  command: string;
  output: string;
  passed: boolean;
}

export function emptyResolutionDraft(): ResolutionDraft {
  return {
    rootCauseKind: null,
    rootCauseText: "",
    closureNote: "",
    quarantineTagged: false,
    packageGenerated: false,
    verifyPassed: null,
  };
}

export function defaultResolutionDraft(alert: Alert): ResolutionDraft {
  const base = emptyResolutionDraft();
  const scenario = alert.scenarioId;
  if (!scenario) return base;
  const preset = DEFAULT_ROOT_CAUSE[scenario];
  return {
    ...base,
    rootCauseKind: preset.kind,
    rootCauseText: preset.text,
    closureNote: draftClosureNote(alert, [], preset.kind, preset.text),
  };
}

export function evidenceSummaryLine(item: EvidenceItem): string {
  if (item.kind === "console") {
    return `Console: ${item.command}`;
  }
  const log = getLogById(item.logId);
  if (!log) return `Log ${item.logId} (missing)`;
  const detail =
    log.rule ?? log.threatName ?? log.sessionEndReason ?? log.message ?? log.app ?? log.type;
  return `${log.type}: ${detail}`;
}

export function draftClosureNote(
  alert: Alert,
  evidence: EvidenceItem[],
  kind: RootCauseKind | null,
  rootCauseText: string,
): string {
  const kindLabel = kind ? ROOT_CAUSE_LABELS[kind] : "Unspecified";
  const lines = [
    `Alert ${alert.id}: ${alert.title}`,
    `Root cause (${kindLabel}): ${rootCauseText.trim() || "Not stated."}`,
    "",
    "Evidence:",
  ];
  if (evidence.length === 0) {
    lines.push("- None pinned.");
  } else {
    for (const item of evidence) {
      lines.push(`- ${evidenceSummaryLine(item)}`);
    }
  }
  if (alert.scenarioId === "A") {
    lines.push("", "Action: Stage No-Decrypt-Pinned-SaaS above Decrypt-All-Outbound. Verify with decryption-policy-match.");
  } else if (alert.scenarioId === "B") {
    lines.push("", "Action: Revert PFS group to group14 on pune-fw-01. Verify with test vpn ipsec-sa.");
  } else if (alert.scenarioId === "C") {
    lines.push("", "Action: Tag prod-api-07 into quarantine. Escalate package to IR. Do not change policy.");
  }
  return lines.join("\n");
}

/** Decryption rules as shown before staging Scenario A. */
export function policyRulesBefore(): DecryptionRule[] {
  return [...decryptionRules].sort((a, b) => a.order - b.order);
}

/** Decryption rules after staging: new rule at order 5, later rules shift down. */
export function policyRulesAfter(): DecryptionRule[] {
  const shifted = decryptionRules.map((rule) =>
    rule.order >= 5 ? { ...rule, order: rule.order + 1 } : rule,
  );
  return [...shifted, NO_DECRYPT_PINNED_RULE].sort((a, b) => a.order - b.order);
}

export interface ConfigDiffLine {
  key: string;
  branch: string;
  prisma: string;
  mismatch: boolean;
}

/** Side-by-side IPsec profile lines for Scenario B (before apply). */
export function configDiffBefore(): ConfigDiffLine[] {
  return [
    { key: "encryption", branch: "aes-256-cbc", prisma: "aes-256-cbc", mismatch: false },
    { key: "authentication", branch: "sha256", prisma: "sha256", mismatch: false },
    { key: "dh-group (IKE)", branch: "group14", prisma: "group14", mismatch: false },
    { key: "pfs (IPsec)", branch: "group19", prisma: "group14", mismatch: true },
    { key: "lifetime", branch: "3600", prisma: "3600", mismatch: false },
  ];
}

/** After apply: branch PFS reverted to group14. */
export function configDiffAfter(): ConfigDiffLine[] {
  return configDiffBefore().map((line) =>
    line.key === "pfs (IPsec)"
      ? { ...line, branch: "group14", mismatch: false }
      : line,
  );
}

export interface EscalationIoc {
  type: string;
  value: string;
}

export function escalationIocs(): EscalationIoc[] {
  return [
    { type: "host", value: "prod-api-07" },
    { type: "ip", value: "10.40.2.15" },
    { type: "domain", value: "update-check.cdn-sync.net" },
    { type: "ip", value: "185.220.101.47" },
    { type: "file", value: "agent-update.sh" },
    { type: "threat", value: "Generic C2 beacon" },
  ];
}

export function escalationTimeline(): { time: string; event: string }[] {
  return [
    { time: "08:57 IST", event: "WildFire malicious verdict for agent-update.sh from 185.220.101.47" },
    { time: "09:12 IST", event: "First C2 beacon DNS to update-check.cdn-sync.net (sinkhole)" },
    { time: "09:12 to 15:00 IST", event: "Beacon every ~60s with small fixed byte counts" },
    { time: "15:00 IST", event: "Alert ALR-1049 under investigation; host to be quarantined" },
  ];
}

export function escalationAssets(): string[] {
  return ["prod-api-07 (10.40.2.15)", "SC-AWS-Mumbai", "Dynamic address group: quarantine"];
}

export function buildEscalationMarkdown(
  alert: Alert,
  evidence: EvidenceItem[],
  draft: ResolutionDraft,
): string {
  const lines = [
    `# Escalation: ${alert.id}`,
    "",
    `## Summary`,
    alert.summary,
    "",
    `## Root cause`,
    draft.rootCauseText || DEFAULT_ROOT_CAUSE.C.text,
    "",
    `## Timeline`,
    ...escalationTimeline().map((t) => `- ${t.time}: ${t.event}`),
    "",
    `## Indicators of compromise`,
    ...escalationIocs().map((ioc) => `- ${ioc.type}: \`${ioc.value}\``),
    "",
    `## Affected assets`,
    ...escalationAssets().map((a) => `- ${a}`),
    "",
    `## Pinned evidence`,
  ];
  if (evidence.length === 0) {
    lines.push("- None pinned.");
  } else {
    for (const item of evidence) {
      lines.push(`- ${evidenceSummaryLine(item)}`);
    }
  }
  lines.push("", `## Closure note`, draft.closureNote || "(empty)", "");
  return lines.join("\n");
}

export function buildEscalationPlainText(
  alert: Alert,
  evidence: EvidenceItem[],
  draft: ResolutionDraft,
): string {
  return buildEscalationMarkdown(alert, evidence, draft)
    .replace(/^#+ /gm, "")
    .replace(/`/g, "");
}

export function runScenarioVerify(
  scenarioId: ScenarioId,
  scenarioFixes: ScenarioFixes,
  draft: ResolutionDraft,
): VerifyResult {
  if (scenarioId === "C") {
    const passed = Boolean(draft.packageGenerated && draft.quarantineTagged);
    return {
      command: "escalation package + quarantine",
      output: passed
        ? "Quarantine tagged. Escalation package generated."
        : [
            draft.quarantineTagged ? "Quarantine: tagged" : "Quarantine: not tagged",
            draft.packageGenerated ? "Package: generated" : "Package: not generated",
          ].join("\n"),
      passed,
    };
  }

  const command = VERIFY_COMMANDS[scenarioId];
  const result = runCommand(command, { mode: "branch", scenarioFixes });
  const output = result.ok ? result.output : result.message;
  const passed =
    scenarioId === "A"
      ? output.includes("No-Decrypt-Pinned-SaaS")
      : output.includes("succeeded");
  return { command, output, passed };
}

export type FinalizeAction = "resolve" | "escalate" | "false_positive";

export function finalizeActionFor(
  scenarioId: ScenarioId | undefined,
  kind: RootCauseKind | null,
): FinalizeAction {
  if (kind === "false_positive") return "false_positive";
  if (scenarioId === "C" || kind === "true_threat") return "escalate";
  return "resolve";
}

export interface GateResult {
  enabled: boolean;
  reason: string | null;
}

/**
 * Final button enablement: root cause required; scenario A/B need verify pass;
 * scenario C enables when the package is generated or verify already passed.
 */
export function resolveGate(
  alert: Alert,
  draft: ResolutionDraft,
): GateResult {
  if (!draft.rootCauseKind) {
    return { enabled: false, reason: "disabledNeedRootCause" };
  }

  const scenario = alert.scenarioId;
  if (!scenario) {
    return { enabled: true, reason: null };
  }

  if (scenario === "C") {
    if (draft.packageGenerated || draft.verifyPassed === true) {
      return { enabled: true, reason: null };
    }
    return { enabled: false, reason: "disabledNeedPackage" };
  }

  if (draft.verifyPassed !== true) {
    return { enabled: false, reason: "disabledNeedVerify" };
  }
  return { enabled: true, reason: null };
}
