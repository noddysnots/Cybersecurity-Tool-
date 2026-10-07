import { describe, expect, it } from "vitest";
import alerts from "@/data/alerts.json";
import {
  ALL_LOGS,
  buildAlertQuery,
  countByType,
  defaultView,
  filterLogs,
  toWindow,
} from "@/lib/logs";
import { parseQuery } from "@/lib/query-parser";
import type { Alert } from "@/types";

const alertA = alerts.find((a) => a.id === "ALR-1042") as Alert;
const alertB = alerts.find((a) => a.id === "ALR-1037") as Alert;
const alertC = alerts.find((a) => a.id === "ALR-1049") as Alert;

function scopedRows(alert: Alert) {
  const view = defaultView(alert);
  const parsed = parseQuery(view.query);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error("query failed");
  return filterLogs(ALL_LOGS, toWindow(view), parsed.predicate);
}

describe("Scenario A default investigation scope", () => {
  it("prefills a query for the affected source IP", () => {
    expect(buildAlertQuery(alertA)).toBe("( addr.src in 10.20.14.37 )");
  });

  it("surfaces decrypt-error traffic and pinned-cert decryption rows in +/-15m", () => {
    const view = defaultView(alertA);
    const rows = scopedRows(alertA);
    const decryptError = rows.filter(
      (r) => r.type === "traffic" && r.sessionEndReason === "decrypt-error",
    );
    const pinnedCert = rows.filter(
      (r) =>
        r.type === "decryption" &&
        r.message?.includes("Certificate pinned: client rejected forward proxy certificate"),
    );

    expect(decryptError.length).toBeGreaterThan(0);
    expect(pinnedCert.length).toBeGreaterThan(0);
    expect(countByType(rows).traffic).toBeGreaterThan(0);
    expect(countByType(rows).decryption).toBeGreaterThan(0);
    // Default tab should land on a type that has rows (traffic for A).
    expect(view.tab).toBe("traffic");
  });
});

describe("Scenario B and C default scopes surface key evidence", () => {
  it("Scenario B finds NO_PROPOSAL_CHOSEN system rows and the PFS config change", () => {
    const rows = scopedRows(alertB);
    expect(rows.some((r) => r.type === "system" && r.message?.includes("NO_PROPOSAL_CHOSEN"))).toBe(
      true,
    );
    expect(
      rows.some(
        (r) =>
          r.type === "config" &&
          (r.message?.includes("group14") || r.message?.includes("group19")),
      ),
    ).toBe(true);
  });

  it("Scenario C finds C2 beacon threat rows from the compromised host", () => {
    const rows = scopedRows(alertC);
    expect(
      rows.some(
        (r) =>
          r.type === "threat" &&
          r.srcIp === "10.40.2.15" &&
          r.threatName === "Generic C2 beacon",
      ),
    ).toBe(true);
  });
});
