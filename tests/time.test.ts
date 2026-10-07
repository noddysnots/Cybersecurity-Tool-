import { describe, expect, it } from "vitest";
import {
  DEMO_CLOCK,
  DEMO_CLOCK_ISO,
  formatAbsolute,
  hoursBeforeDemo,
  isWithinLast24h,
} from "@/lib/time";

describe("demo clock", () => {
  it("is fixed at Tue 6 Oct 2026 15:00 IST", () => {
    expect(DEMO_CLOCK_ISO).toBe("2026-10-06T09:30:00.000Z");
    expect(formatAbsolute(DEMO_CLOCK, "IST", "EEE d MMM yyyy HH:mm")).toBe(
      "Tue 6 Oct 2026 15:00 IST",
    );
    expect(formatAbsolute(DEMO_CLOCK, "UTC", "EEE d MMM yyyy HH:mm")).toBe(
      "Tue 6 Oct 2026 09:30 UTC",
    );
  });

  it("marks times within 24h before demo clock", () => {
    expect(isWithinLast24h(hoursBeforeDemo(1))).toBe(true);
    expect(isWithinLast24h(hoursBeforeDemo(23))).toBe(true);
    expect(isWithinLast24h(hoursBeforeDemo(25))).toBe(false);
  });
});
