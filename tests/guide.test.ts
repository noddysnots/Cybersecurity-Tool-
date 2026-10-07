import { describe, expect, it } from "vitest";
import { ANNOTATIONS } from "@/content/annotations";
import { GUIDE_STEPS } from "@/content/guide-steps";
import { useAppStore } from "@/lib/store";

describe("guide and annotations content", () => {
  it("defines steps for scenarios A, B, and C", () => {
    expect(GUIDE_STEPS.A.length).toBeGreaterThanOrEqual(6);
    expect(GUIDE_STEPS.B.length).toBeGreaterThanOrEqual(6);
    expect(GUIDE_STEPS.C.length).toBeGreaterThanOrEqual(6);
  });

  it("starts scenario A with the required time-first sentence", () => {
    expect(GUIDE_STEPS.A[0].body.startsWith("The user said around 2:20 PM. Set the window first.")).toBe(
      true,
    );
  });

  it("avoids em and en dashes in guide copy", () => {
    const text = Object.values(GUIDE_STEPS)
      .flat()
      .map((step) => `${step.title} ${step.body}`)
      .join("\n");
    expect(text).not.toMatch(/[—–]/);
  });

  it("keeps 5 to 7 annotation pins per screen", () => {
    for (const screen of ["alerts", "investigate", "resolve"] as const) {
      const count = ANNOTATIONS[screen].length;
      expect(count).toBeGreaterThanOrEqual(5);
      expect(count).toBeLessThanOrEqual(7);
    }
  });

  it("avoids em and en dashes in annotation copy", () => {
    const text = Object.values(ANNOTATIONS)
      .flat()
      .map((pin) => `${pin.decision} ${pin.problem} ${pin.metric}`)
      .join("\n");
    expect(text).not.toMatch(/[—–]/);
  });

  it("persists guide progress per scenario", () => {
    useAppStore.getState().resetDemo();
    useAppStore.getState().setGuideStep("A", 3);
    expect(useAppStore.getState().guideProgress.A).toBe(3);
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState().guideProgress).toEqual({});
  });
});
