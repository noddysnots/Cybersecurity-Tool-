import { describe, expect, it } from "vitest";

import {
  DEMO_NOW,
  DEMO_NOW_ISO,
  formatAbsolute,
  formatBothZones,
  formatDemoClock,
  now,
  toZone,
} from "@/lib/time";

describe("demo clock", () => {
  it("uses the fixed IST demo instant", () => {
    expect(DEMO_NOW_ISO).toBe("2026-10-06T06:35:00.000Z");
    expect(DEMO_NOW.toISOString()).toBe(DEMO_NOW_ISO);
    expect(formatDemoClock("IST")).toBe("Tue 6 Oct 2026, 12:05 IST");
    expect(formatDemoClock("UTC")).toBe("Tue 6 Oct 2026, 06:35 UTC");
  });

  it("returns a copy from now()", () => {
    const a = now();
    const b = now();
    expect(a.toISOString()).toBe(DEMO_NOW_ISO);
    expect(a).not.toBe(b);
  });

  it("formats IST and UTC helpers", () => {
    expect(toZone(DEMO_NOW, "IST")).toContain("+05:30");
    expect(toZone(DEMO_NOW, "UTC")).toMatch(/Z|\+00:00$/);
    expect(formatAbsolute(DEMO_NOW, "IST")).toBe("6 Oct 2026, 12:05:00 IST");
    expect(formatAbsolute(DEMO_NOW, "UTC")).toBe("6 Oct 2026, 06:35:00 UTC");
    expect(formatBothZones(DEMO_NOW)).toEqual({
      ist: "6 Oct 2026, 12:05:00 IST",
      utc: "6 Oct 2026, 06:35:00 UTC",
    });
  });
});
