import { beforeEach, describe, expect, it } from "vitest";
import alerts from "@/data/alerts.json";
import { SCENARIO_CARDS } from "@/content/shell";
import { DEFAULT_STATE, useAppStore } from "@/lib/store";

describe("app store", () => {
  beforeEach(() => {
    useAppStore.getState().resetDemo();
  });

  it("starts from defaults", () => {
    const s = useAppStore.getState();
    expect(s.timezone).toBe(DEFAULT_STATE.timezone);
    expect(s.theme).toBe("light");
    expect(s.splashSeen).toBe(false);
  });

  it("resetDemo restores every field", () => {
    const s = useAppStore.getState();
    s.setTimezone("UTC");
    s.setGuideOn(true);
    s.setAnnotationsOn(true);
    s.setTheme("dark");
    s.setActiveScenario("B");
    s.setSplashSeen(true);
    s.setNavCollapsed(true);
    s.setAlertOverride("ALR-1042", { status: "investigating", assignee: "Priya Nair" });
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState()).toMatchObject(DEFAULT_STATE);
  });

  it("does not throw when storage is unavailable", () => {
    expect(() => useAppStore.getState().setTheme("dark")).not.toThrow();
  });

  it("pins and reorders evidence per alert", () => {
    const s = useAppStore.getState();
    expect(s.pinEvidence("ALR-1042", "log-a")).toBe(true);
    expect(s.pinEvidence("ALR-1042", "log-a")).toBe(false);
    s.pinEvidence("ALR-1042", "log-b");
    s.moveEvidence("ALR-1042", "ev-log-b", -1);
    expect(
      useAppStore
        .getState()
        .evidence["ALR-1042"].filter((e) => e.kind === "log")
        .map((e) => e.logId),
    ).toEqual(["log-b", "log-a"]);
    s.unpinEvidence("ALR-1042", "ev-log-a");
    expect(
      useAppStore
        .getState()
        .evidence["ALR-1042"].filter((e) => e.kind === "log")
        .map((e) => e.logId),
    ).toEqual(["log-b"]);
  });

  it("tracks scenario fixes for console verify commands", () => {
    const s = useAppStore.getState();
    expect(s.scenarioFixes).toEqual({});
    s.setScenarioFix("A", true);
    s.setScenarioFix("B", true);
    expect(useAppStore.getState().scenarioFixes).toEqual({ A: true, B: true });
    s.setScenarioFix("A", false);
    expect(useAppStore.getState().scenarioFixes.A).toBe(false);
  });

  it("stores resolution drafts and audit trail", () => {
    const s = useAppStore.getState();
    s.patchResolution("ALR-1037", {
      rootCauseKind: "config_drift",
      rootCauseText: "PFS mismatch",
      closureNote: "note",
      quarantineTagged: false,
      packageGenerated: false,
      verifyPassed: null,
    });
    s.appendAudit("ALR-1037", "Applied fix");
    const state = useAppStore.getState();
    expect(state.resolutions["ALR-1037"]?.rootCauseKind).toBe("config_drift");
    expect(state.auditTrail["ALR-1037"]).toHaveLength(1);
    expect(state.auditTrail["ALR-1037"][0].actor).toBe("Priya Nair");
  });

  it("pins console output as evidence", () => {
    const s = useAppStore.getState();
    expect(s.pinConsoleEvidence("ALR-1042", "show clock", "Tue Oct 06")).toBe(true);
    expect(s.pinConsoleEvidence("ALR-1042", "show clock", "Tue Oct 06")).toBe(false);
    const item = useAppStore.getState().evidence["ALR-1042"].find((e) => e.kind === "console");
    expect(item?.kind).toBe("console");
    if (item?.kind === "console") {
      expect(item.command).toBe("show clock");
      expect(item.output).toBe("Tue Oct 06");
    }
  });
});

describe("scenario cards", () => {
  it("point at the matching alerts", () => {
    for (const card of SCENARIO_CARDS) {
      const alert = alerts.find((a) => a.id === card.alertId);
      expect(alert?.scenarioId).toBe(card.id);
    }
  });
});
