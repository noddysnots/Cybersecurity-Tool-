import { describe, expect, it } from "vitest";
import alertsData from "@/data/alerts.json";
import {
  DEFAULT_FILTERS,
  UNASSIGNED,
  applyOverrides,
  countActiveFilters,
  filterAlerts,
  parseFilters,
  serializeFilters,
  severityCounts,
} from "@/lib/alerts";
import type { Alert } from "@/types";

const alerts = alertsData as Alert[];

describe("alert filters in the URL", () => {
  it("round trips every filter", () => {
    const params = new URLSearchParams(
      "severity=high&status=new&category=threat&range=4h&assignee=Priya+Nair&q=prod",
    );
    const filters = parseFilters(params);
    expect(filters).toEqual({
      severity: "high",
      status: "new",
      category: "threat",
      range: "4h",
      assignee: "Priya Nair",
      q: "prod",
    });
    expect(parseFilters(new URLSearchParams(serializeFilters(filters)))).toEqual(filters);
  });

  it("drops unknown values and omits defaults", () => {
    const filters = parseFilters(new URLSearchParams("severity=bogus&range=9y"));
    expect(filters).toEqual(DEFAULT_FILTERS);
    expect(serializeFilters(filters)).toBe("");
    expect(countActiveFilters(filters)).toBe(0);
  });
});

describe("filterAlerts", () => {
  it("returns everything by default", () => {
    expect(filterAlerts(alerts, DEFAULT_FILTERS)).toHaveLength(alerts.length);
  });

  it("filters by severity, status and category together", () => {
    const result = filterAlerts(alerts, { ...DEFAULT_FILTERS, severity: "medium", status: "new" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((a) => a.severity === "medium" && a.status === "new")).toBe(true);
  });

  it("finds an alert by id and by entity, case insensitive", () => {
    expect(filterAlerts(alerts, { ...DEFAULT_FILTERS, q: "alr-1042" }).map((a) => a.id)).toContain(
      "ALR-1042",
    );
    expect(filterAlerts(alerts, { ...DEFAULT_FILTERS, q: "10.20.14.37" }).map((a) => a.id)).toContain(
      "ALR-1042",
    );
  });

  it("filters unassigned alerts", () => {
    const result = filterAlerts(alerts, { ...DEFAULT_FILTERS, assignee: UNASSIGNED });
    expect(result.every((a) => !a.assignee)).toBe(true);
  });

  it("limits to the time range relative to the demo clock", () => {
    const hour = filterAlerts(alerts, { ...DEFAULT_FILTERS, range: "1h" });
    expect(hour.map((a) => a.id)).toContain("ALR-1042");
    expect(hour.length).toBeLessThan(alerts.length);
  });

  it("can skip a filter so severity counts ignore the severity filter", () => {
    const counts = severityCounts(
      filterAlerts(alerts, { ...DEFAULT_FILTERS, severity: "critical" }, ["severity"]),
    );
    expect(counts.medium).toBeGreaterThan(0);
  });
});

describe("applyOverrides", () => {
  it("merges status and assignee without mutating the source", () => {
    const merged = applyOverrides(alerts, {
      "ALR-1042": { status: "false_positive", assignee: "Priya Nair" },
    });
    const alert = merged.find((a) => a.id === "ALR-1042");
    expect(alert?.status).toBe("false_positive");
    expect(alert?.assignee).toBe("Priya Nair");
    expect(alerts.find((a) => a.id === "ALR-1042")?.status).toBe("new");
  });
});
