import { describe, expect, it } from "vitest";

import { useCaseEngine } from "@/lib/case-engine";
import {
  computeSla,
  getActiveWorkableTickets,
  getOpenPlatformAlerts,
  getPuneTrafficTrend,
  getRecentConfigChanges,
  getRemoteNetworkHealth,
  getTopBlockedApps,
} from "@/lib/home-metrics";
import { tickets } from "@/data";

describe("home-metrics", () => {
  it("lists the two workable tickets with SLA", () => {
    useCaseEngine.getState().resetDemo();
    const active = getActiveWorkableTickets();
    expect(active.map((a) => a.ticket.id)).toEqual(["TKT-24823", "TKT-24817"]);
    expect(active[0].sla.label.length).toBeGreaterThan(0);
  });

  it("shows Pune down until Case 2 is fixed", () => {
    useCaseEngine.getState().resetDemo();
    expect(getRemoteNetworkHealth().puneState).toBe("down");
    expect(getRemoteNetworkHealth().up).toBe(11);
  });

  it("surfaces CHG-5120 and CHG-4471 in recent config", () => {
    const recent = getRecentConfigChanges(5);
    const ids = recent.map((c) => c.changeId);
    expect(ids).toContain("CHG-5120");
    expect(ids).toContain("CHG-4471");
  });

  it("ranks stun as the top blocked app", () => {
    const apps = getTopBlockedApps();
    expect(apps[0]?.app).toBe("stun");
    expect(apps[0]?.count).toBeGreaterThan(0);
  });

  it("marks the Pune traffic cliff after 11:42", () => {
    const trend = getPuneTrafficTrend();
    const after = trend.find((p) => p.label === "11:45");
    expect(after?.count).toBe(0);
  });

  it("keeps the Pune tunnel alert open until fixed", () => {
    useCaseEngine.getState().resetDemo();
    expect(getOpenPlatformAlerts().some((a) => a.id === "ALT-88421")).toBe(true);
  });

  it("computes SLA from ticket openedAt and demo now", () => {
    const meet = tickets.find((t) => t.id === "TKT-24817");
    expect(meet).toBeTruthy();
    if (!meet) return;
    const sla = computeSla(meet);
    expect(sla.breached).toBe(false);
    expect(sla.remainingMinutes).toBeGreaterThan(0);
  });
});
