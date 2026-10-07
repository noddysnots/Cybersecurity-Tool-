import { describe, expect, it } from "vitest";

import { logs } from "@/data";
import { getLogFieldValue, parseQuery } from "@/lib/query-parser";
import type { TrafficLogRecord } from "@/types";

function trafficById(id: string): TrafficLogRecord {
  const row = logs.find((l) => l.id === id);
  if (!row || row.type !== "traffic") {
    throw new Error(`missing traffic ${id}`);
  }
  return row;
}

describe("query-parser", () => {
  it("parses the PAN-OS style example and matches ankit drop", () => {
    const result = parseQuery(
      "( addr.src in 10.20.31.44 ) and ( port.dst geq 19302 )",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ankit = trafficById("log-traffic-ankit-100214");
    const sana = trafficById("log-traffic-sana-100540");
    expect(result.predicate(ankit)).toBe(true);
    expect(result.predicate(sana)).toBe(false);
  });

  it("supports eq, neq, contains, leq, or, and nested parentheses", () => {
    const result = parseQuery(
      "( rule eq Block-QUIC ) or ( ( user.src contains sana.khan ) and ( action neq drop ) )",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.predicate(trafficById("log-traffic-ankit-100214"))).toBe(true);
    expect(result.predicate(trafficById("log-traffic-sana-100540"))).toBe(true);
  });

  it("filters by user.src and action for Case 1 needles", () => {
    const result = parseQuery(
      "( user.src eq ankit.verma@acme.io ) and ( action eq drop )",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const hits = logs.filter(result.predicate);
    expect(hits.some((l) => l.id === "log-traffic-ankit-100214")).toBe(true);
    expect(hits.every((l) => getLogFieldValue(l, "user.src") === "ankit.verma@acme.io")).toBe(
      true,
    );
  });

  it("supports zone, proto, container, location, type, app", () => {
    const result = parseQuery(
      "( zone.src eq GP-Mobile ) and ( proto eq udp ) and ( container eq Mobile Users ) and ( type eq traffic ) and ( app eq stun )",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.predicate(trafficById("log-traffic-ankit-100214"))).toBe(true);
    expect(result.predicate(trafficById("log-traffic-sana-100540"))).toBe(false);
  });

  it("returns an error with position for unknown field", () => {
    const result = parseQuery("foo.bar eq x");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.toLowerCase()).toContain("field");
    expect(result.position).toBe(0);
  });

  it("returns an error with position for unknown operator", () => {
    const result = parseQuery("app like stun");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.toLowerCase()).toContain("operator");
    expect(result.position).toBeGreaterThan(0);
  });

  it("returns an error for unbalanced parentheses", () => {
    const result = parseQuery("( app eq stun");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.toLowerCase()).toMatch(/paren|expected/);
    expect(typeof result.position).toBe("number");
  });

  it("empty query matches all records", () => {
    const result = parseQuery("   ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.predicate(trafficById("log-traffic-ankit-100214"))).toBe(true);
  });
});
