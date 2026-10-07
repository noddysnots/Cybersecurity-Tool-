import { describe, expect, it } from "vitest";
import {
  QUERY_FIELDS,
  QUERY_OPERATORS,
  appendClause,
  buildClause,
  parseQuery,
  tokenize,
  type QueryError,
} from "@/lib/query-parser";
import type { LogRecord } from "@/types";

const decryptRow: LogRecord = {
  id: "t1",
  type: "traffic",
  time: "2026-10-06T08:47:42.000Z",
  srcIp: "10.20.14.37",
  dstIp: "13.110.54.20",
  srcUser: "rahul.mehta@acme.io",
  dstPort: 443,
  app: "ssl",
  rule: "Allow-SaaS-Business",
  action: "allow",
  sessionEndReason: "decrypt-error",
  device: "gp-gw-mumbai-01",
};

const threatRow: LogRecord = {
  id: "t2",
  type: "threat",
  time: "2026-10-06T03:42:05.000Z",
  srcIp: "10.40.2.15",
  dstIp: "10.40.0.2",
  dstPort: 53,
  app: "dns",
  rule: "Allow-Prod-Outbound",
  action: "sinkhole",
  threatName: "Generic C2 beacon",
  device: "awsmumbai-sc-gw",
};

const systemRow: LogRecord = {
  id: "t3",
  type: "system",
  time: "2026-10-06T06:12:08.000Z",
  device: "pune-fw-01",
  message: "Tunnel state changed",
};

function match(query: string, log: LogRecord): boolean {
  const result = parseQuery(query);
  if (!result.ok) throw new Error(`expected valid query, got: ${result.error.message}`);
  return result.predicate(log);
}

function failure(query: string): QueryError {
  const result = parseQuery(query);
  if (result.ok) throw new Error(`expected an error for: ${query}`);
  return result.error;
}

describe("query parser: valid queries", () => {
  it("parses the PAN-OS style example", () => {
    const q = "( addr.src in 10.20.14.37 ) and ( app eq ssl )";
    expect(match(q, decryptRow)).toBe(true);
    expect(match(q, threatRow)).toBe(false);
  });

  it("accepts conditions without parentheses", () => {
    expect(match("app eq ssl and action eq allow", decryptRow)).toBe(true);
    expect(match("app eq ssl and action eq deny", decryptRow)).toBe(false);
  });

  it("treats an empty query as match all", () => {
    expect(match("", decryptRow)).toBe(true);
    expect(match("   ", systemRow)).toBe(true);
  });

  it("supports every field", () => {
    expect(match("addr.src eq 10.20.14.37", decryptRow)).toBe(true);
    expect(match("addr.dst eq 13.110.54.20", decryptRow)).toBe(true);
    expect(match("user.src eq rahul.mehta@acme.io", decryptRow)).toBe(true);
    expect(match("app eq ssl", decryptRow)).toBe(true);
    expect(match("rule eq Allow-SaaS-Business", decryptRow)).toBe(true);
    expect(match("action eq allow", decryptRow)).toBe(true);
    expect(match("url.category eq business-and-economy", { ...decryptRow, urlCategory: "business-and-economy" })).toBe(true);
    expect(match('threat.name eq "Generic C2 beacon"', threatRow)).toBe(true);
    expect(match("port.dst eq 443", decryptRow)).toBe(true);
    expect(match("device eq pune-fw-01", systemRow)).toBe(true);
  });

  it("supports neq and treats a missing field as not equal", () => {
    expect(match("app neq ssl", decryptRow)).toBe(false);
    expect(match("app neq dns", decryptRow)).toBe(true);
    expect(match("addr.src neq 10.20.14.37", systemRow)).toBe(true);
    expect(match("addr.src eq 10.20.14.37", systemRow)).toBe(false);
  });

  it("supports contains, case insensitive", () => {
    expect(match("threat.name contains c2", threatRow)).toBe(true);
    expect(match("threat.name contains ransomware", threatRow)).toBe(false);
    expect(match("rule contains saas", decryptRow)).toBe(true);
    expect(match("threat.name contains c2", systemRow)).toBe(false);
  });

  it("supports in with CIDR ranges and lists", () => {
    expect(match("addr.src in 10.20.0.0/16", decryptRow)).toBe(true);
    expect(match("addr.src in 10.21.0.0/16", decryptRow)).toBe(false);
    expect(match("addr.src in 10.40.2.15,10.20.14.37", decryptRow)).toBe(true);
    expect(match("app in ssl,web-browsing", decryptRow)).toBe(true);
    expect(match("app in dns,web-browsing", decryptRow)).toBe(false);
    expect(match("port.dst in 53,443", decryptRow)).toBe(true);
  });

  it("supports quoted values with spaces", () => {
    expect(match('threat.name eq "Generic C2 beacon"', threatRow)).toBe(true);
    expect(match('threat.name contains "C2 beacon"', threatRow)).toBe(true);
  });

  it("is case insensitive for fields, operators and connectors", () => {
    expect(match("( APP EQ ssl ) AND ( Action Eq allow )", decryptRow)).toBe(true);
  });

  it("exposes the supported fields and operators", () => {
    expect([...QUERY_FIELDS].sort()).toEqual(
      [
        "action",
        "addr.dst",
        "addr.src",
        "app",
        "device",
        "port.dst",
        "rule",
        "threat.name",
        "url.category",
        "user.src",
      ].sort(),
    );
    expect([...QUERY_OPERATORS]).toEqual(["eq", "neq", "in", "contains"]);
  });
});

describe("query parser: nested queries and precedence", () => {
  it("lets and bind tighter than or", () => {
    // a or (b and c)
    const q = "app eq dns or app eq ssl and action eq deny";
    expect(match(q, threatRow)).toBe(true); // dns
    expect(match(q, decryptRow)).toBe(false); // ssl but allow
  });

  it("honours parentheses over precedence", () => {
    const q = "( app eq dns or app eq ssl ) and action eq allow";
    expect(match(q, decryptRow)).toBe(true);
    expect(match(q, threatRow)).toBe(false); // dns but sinkhole
  });

  it("handles deep nesting", () => {
    expect(match("((((app eq ssl))))", decryptRow)).toBe(true);
    const q =
      "( ( addr.src in 10.20.14.37 ) and ( ( app eq ssl ) or ( app eq web-browsing ) ) ) and ( action neq deny )";
    expect(match(q, decryptRow)).toBe(true);
    expect(match(q, threatRow)).toBe(false);
  });

  it("parses parentheses glued to words", () => {
    expect(match("(app eq ssl)and(action eq allow)", decryptRow)).toBe(true);
  });
});

describe("query parser: invalid queries", () => {
  it("reports an unknown field with its position", () => {
    const err = failure("( addr.source in 10.0.0.1 )");
    expect(err.message).toMatch(/unknown field/i);
    expect("( addr.source in 10.0.0.1 )".slice(err.start, err.end)).toBe("addr.source");
  });

  it("reports an unknown operator with its position", () => {
    const q = "app equals ssl";
    const err = failure(q);
    expect(err.message).toMatch(/unknown operator/i);
    expect(q.slice(err.start, err.end)).toBe("equals");
  });

  it("reports a missing value at the end of input", () => {
    const q = "app eq";
    const err = failure(q);
    expect(err.message).toMatch(/value/i);
    expect(err.start).toBe(q.length);
  });

  it("reports a missing operator", () => {
    const err = failure("app");
    expect(err.message).toMatch(/operator/i);
  });

  it("reports an unclosed parenthesis at the opening one", () => {
    const q = "( app eq ssl";
    const err = failure(q);
    expect(err.message).toMatch(/closing parenthesis/i);
    expect(err.start).toBe(0);
    expect(err.end).toBe(1);
  });

  it("reports an unexpected closing parenthesis", () => {
    const q = "app eq ssl )";
    const err = failure(q);
    expect(err.message).toMatch(/unexpected/i);
    expect(q.slice(err.start, err.end)).toBe(")");
  });

  it("reports empty parentheses", () => {
    const q = "( ) and app eq ssl";
    const err = failure(q);
    expect(err.message).toMatch(/condition/i);
    expect(q.slice(err.start, err.end)).toBe(")");
  });

  it("reports a trailing connector", () => {
    const q = "app eq ssl and";
    const err = failure(q);
    expect(err.message).toMatch(/condition/i);
    expect(err.start).toBe(q.length);
  });

  it("reports a leading connector", () => {
    const q = "and app eq ssl";
    const err = failure(q);
    expect(q.slice(err.start, err.end)).toBe("and");
  });

  it("reports two conditions with no connector", () => {
    const q = "app eq ssl action eq allow";
    const err = failure(q);
    expect(err.message).toMatch(/and.*or/i);
    expect(q.slice(err.start, err.end)).toBe("action");
  });

  it("reports an unterminated quote", () => {
    const q = 'threat.name eq "Generic C2';
    const err = failure(q);
    expect(err.message).toMatch(/quote/i);
    expect(err.start).toBe(q.indexOf('"'));
  });

  it("reports an invalid address", () => {
    const q = "addr.src in 10.20.14.999";
    const err = failure(q);
    expect(err.message).toMatch(/address/i);
    expect(q.slice(err.start, err.end)).toBe("10.20.14.999");
  });

  it("reports an invalid CIDR prefix", () => {
    const err = failure("addr.src in 10.20.0.0/40");
    expect(err.message).toMatch(/address/i);
  });

  it("reports an invalid port", () => {
    const q = "port.dst eq https";
    const err = failure(q);
    expect(err.message).toMatch(/port/i);
    expect(q.slice(err.start, err.end)).toBe("https");
  });

  it("reports the first problem in a nested query", () => {
    const q = "( ( app eq ssl ) and ( bogus eq 1 ) )";
    const err = failure(q);
    expect(q.slice(err.start, err.end)).toBe("bogus");
  });
});

describe("tokenize", () => {
  it("splits words, quotes and parentheses with positions", () => {
    const tokens = tokenize('(app eq "a b")');
    expect(tokens.map((t) => t.text)).toEqual(["(", "app", "eq", "a b", ")"]);
    expect(tokens[3]).toMatchObject({ kind: "string", start: 8, end: 13 });
  });
});

describe("query building helpers", () => {
  it("builds clauses per field", () => {
    expect(buildClause("addr.src", "10.20.14.37", "include")).toBe("( addr.src in 10.20.14.37 )");
    expect(buildClause("addr.src", "10.20.14.37", "exclude")).toBe("( addr.src neq 10.20.14.37 )");
    expect(buildClause("rule", "Allow-SaaS-Business", "include")).toBe("( rule eq Allow-SaaS-Business )");
    expect(buildClause("threat.name", "Generic C2 beacon", "exclude")).toBe(
      '( threat.name neq "Generic C2 beacon" )',
    );
  });

  it("appends a clause with and, wrapping an existing or", () => {
    expect(appendClause("", "( app eq ssl )")).toBe("( app eq ssl )");
    expect(appendClause("( addr.src in 1.1.1.1 )", "( app eq ssl )")).toBe(
      "( addr.src in 1.1.1.1 ) and ( app eq ssl )",
    );
    expect(appendClause("app eq dns or app eq ssl", "( action eq allow )")).toBe(
      "( app eq dns or app eq ssl ) and ( action eq allow )",
    );
  });

  it("produces queries that parse", () => {
    const q = appendClause(
      "( addr.src in 10.20.14.37 )",
      buildClause("threat.name", "Generic C2 beacon", "include"),
    );
    expect(parseQuery(q).ok).toBe(true);
  });
});
