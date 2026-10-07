import { describe, expect, it } from "vitest";

import { findObjectByName, whereUsed } from "@/lib/where-used";

describe("where-used", () => {
  it("links svc-quic-block to Block-QUIC", () => {
    const obj = findObjectByName("svc-quic-block");
    expect(obj?.kind).toBe("service");
    const usages = whereUsed("svc-quic-block");
    expect(usages.some((u) => u.ruleName === "Block-QUIC")).toBe(true);
  });
});
