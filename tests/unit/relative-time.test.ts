import { describe, expect, it } from "vitest";

import { formatRelativeAgo, modifiedMarker, withinHours } from "@/lib/relative-time";
import { DEMO_NOW } from "@/lib/time";

describe("relative-time", () => {
  it("formats Block-QUIC modified time as 12h ago from demo clock", () => {
    // Block-QUIC modifiedAt: 2026-10-05T18:11:00.000Z; demo now 2026-10-06T06:35:00.000Z
    expect(formatRelativeAgo("2026-10-05T18:11:00.000Z", DEMO_NOW)).toBe("12h ago");
    expect(modifiedMarker("2026-10-05T18:11:00.000Z", DEMO_NOW)).toBe("Modified 12h ago");
    expect(withinHours("2026-10-05T18:11:00.000Z", 24, DEMO_NOW)).toBe(true);
  });

  it("formats minutes and days", () => {
    expect(formatRelativeAgo("2026-10-06T06:20:00.000Z", DEMO_NOW)).toBe("15m ago");
    expect(formatRelativeAgo("2026-10-03T06:35:00.000Z", DEMO_NOW)).toBe("3d ago");
  });
});
