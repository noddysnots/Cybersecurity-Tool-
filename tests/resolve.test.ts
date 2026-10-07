import { beforeEach, describe, expect, it } from "vitest";
import alerts from "@/data/alerts.json";
import {
  defaultResolutionDraft,
  emptyResolutionDraft,
  finalizeActionFor,
  policyRulesAfter,
  policyRulesBefore,
  resolveGate,
  runScenarioVerify,
} from "@/lib/resolve";
import { useAppStore } from "@/lib/store";
import type { Alert, ResolutionDraft } from "@/types";

const allAlerts = alerts as Alert[];
const alertA = allAlerts.find((a) => a.id === "ALR-1042")!;
const alertB = allAlerts.find((a) => a.id === "ALR-1037")!;
const alertC = allAlerts.find((a) => a.id === "ALR-1049")!;

function draft(partial: Partial<ResolutionDraft> = {}): ResolutionDraft {
  return { ...emptyResolutionDraft(), rootCauseKind: "misconfiguration", ...partial };
}

describe("resolve verify gate", () => {
  it("blocks A and B until verifyPassed is true", () => {
    expect(resolveGate(alertA, draft({ verifyPassed: null })).enabled).toBe(false);
    expect(resolveGate(alertA, draft({ verifyPassed: false })).enabled).toBe(false);
    expect(resolveGate(alertA, draft({ verifyPassed: true })).enabled).toBe(true);

    expect(resolveGate(alertB, draft({ rootCauseKind: "config_drift", verifyPassed: true })).enabled).toBe(
      true,
    );
    expect(
      resolveGate(alertB, draft({ rootCauseKind: "config_drift", verifyPassed: null })).reason,
    ).toBe("disabledNeedVerify");
  });

  it("enables C when package is generated even before verify", () => {
    const blocked = resolveGate(
      alertC,
      draft({ rootCauseKind: "true_threat", packageGenerated: false }),
    );
    expect(blocked.enabled).toBe(false);
    expect(blocked.reason).toBe("disabledNeedPackage");

    const ready = resolveGate(
      alertC,
      draft({ rootCauseKind: "true_threat", packageGenerated: true }),
    );
    expect(ready.enabled).toBe(true);
  });

  it("requires a root cause kind", () => {
    const gate = resolveGate(alertA, draft({ rootCauseKind: null, verifyPassed: true }));
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toBe("disabledNeedRootCause");
  });
});

describe("runScenarioVerify", () => {
  it("passes A only after scenario fix stages No-Decrypt-Pinned-SaaS", () => {
    const before = runScenarioVerify("A", {}, draft());
    expect(before.passed).toBe(false);
    expect(before.output).toContain("Decrypt-All-Outbound");

    const after = runScenarioVerify("A", { A: true }, draft());
    expect(after.passed).toBe(true);
    expect(after.output).toContain("No-Decrypt-Pinned-SaaS");
  });

  it("passes B only after apply fix", () => {
    const before = runScenarioVerify("B", {}, draft({ rootCauseKind: "config_drift" }));
    expect(before.passed).toBe(false);
    expect(before.output).toContain("failed");

    const after = runScenarioVerify("B", { B: true }, draft({ rootCauseKind: "config_drift" }));
    expect(after.passed).toBe(true);
    expect(after.output).toContain("succeeded");
  });

  it("passes C when quarantine and package are both ready", () => {
    const partial = runScenarioVerify(
      "C",
      {},
      draft({ rootCauseKind: "true_threat", packageGenerated: true, quarantineTagged: false }),
    );
    expect(partial.passed).toBe(false);

    const full = runScenarioVerify(
      "C",
      { C: true },
      draft({ rootCauseKind: "true_threat", packageGenerated: true, quarantineTagged: true }),
    );
    expect(full.passed).toBe(true);
  });
});

describe("policy diff for scenario A", () => {
  it("inserts No-Decrypt-Pinned-SaaS above Decrypt-All-Outbound", () => {
    const before = policyRulesBefore();
    const after = policyRulesAfter();
    const decryptBefore = before.findIndex((r) => r.name === "Decrypt-All-Outbound");
    const newIdx = after.findIndex((r) => r.name === "No-Decrypt-Pinned-SaaS");
    const decryptAfter = after.findIndex((r) => r.name === "Decrypt-All-Outbound");
    expect(newIdx).toBeGreaterThan(-1);
    expect(newIdx).toBeLessThan(decryptAfter);
    expect(after[newIdx].order).toBeLessThan(after[decryptAfter].order);
    expect(decryptBefore).toBeGreaterThan(-1);
  });
});

describe("finalize action", () => {
  it("maps scenario and root cause to resolve or escalate", () => {
    expect(finalizeActionFor("A", "misconfiguration")).toBe("resolve");
    expect(finalizeActionFor("B", "config_drift")).toBe("resolve");
    expect(finalizeActionFor("C", "true_threat")).toBe("escalate");
    expect(finalizeActionFor("A", "false_positive")).toBe("false_positive");
    expect(finalizeActionFor(undefined, "true_threat")).toBe("escalate");
  });
});

describe("resolution store", () => {
  beforeEach(() => {
    useAppStore.getState().resetDemo();
  });

  it("patches resolution drafts and appends audit events for Priya Nair", () => {
    const s = useAppStore.getState();
    s.patchResolution("ALR-1042", defaultResolutionDraft(alertA));
    s.appendAudit("ALR-1042", "Opened resolution");
    s.setScenarioFix("A", true);
    s.setAlertOverride("ALR-1042", { status: "resolved" });

    const state = useAppStore.getState();
    expect(state.resolutions["ALR-1042"]?.rootCauseKind).toBe("misconfiguration");
    expect(state.auditTrail["ALR-1042"]?.[0]?.actor).toBe("Priya Nair");
    expect(state.scenarioFixes.A).toBe(true);
    expect(state.alertOverrides["ALR-1042"]?.status).toBe("resolved");
  });
});
