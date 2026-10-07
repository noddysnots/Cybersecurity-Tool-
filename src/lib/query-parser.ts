import type { LogRecord, LogType } from "@/types";

export const QUERY_FIELDS = [
  "addr.src",
  "addr.dst",
  "user.src",
  "app",
  "rule",
  "action",
  "zone.src",
  "zone.dst",
  "port.dst",
  "proto",
  "container",
  "location",
  "type",
] as const;

export type QueryField = (typeof QUERY_FIELDS)[number];

export const QUERY_OPERATORS = [
  "eq",
  "neq",
  "in",
  "contains",
  "geq",
  "leq",
] as const;

export type QueryOperator = (typeof QUERY_OPERATORS)[number];

export type LogPredicate = (record: LogRecord) => boolean;

export type ParseQuerySuccess = {
  ok: true;
  predicate: LogPredicate;
};

export type ParseQueryFailure = {
  ok: false;
  error: string;
  position: number;
};

export type ParseQueryResult = ParseQuerySuccess | ParseQueryFailure;

const FIELD_SET = new Set<string>(QUERY_FIELDS);
const OP_SET = new Set<string>(QUERY_OPERATORS);

type TokenKind =
  | "field"
  | "op"
  | "value"
  | "and"
  | "or"
  | "lparen"
  | "rparen"
  | "eof";

type Token = {
  kind: TokenKind;
  value: string;
  position: number;
};

function isField(name: string): name is QueryField {
  return FIELD_SET.has(name);
}

function isOp(name: string): name is QueryOperator {
  return OP_SET.has(name);
}

function tokenize(input: string): Token[] | ParseQueryFailure {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i]!)) i += 1;
    if (i >= input.length) break;
    const start = i;
    const ch = input[i]!;
    if (ch === "(") {
      tokens.push({ kind: "lparen", value: "(", position: start });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen", value: ")", position: start });
      i += 1;
      continue;
    }
    while (i < input.length && !/\s/.test(input[i]!) && input[i] !== "(" && input[i] !== ")") {
      i += 1;
    }
    const raw = input.slice(start, i);
    const lower = raw.toLowerCase();
    if (lower === "and") {
      tokens.push({ kind: "and", value: "and", position: start });
    } else if (lower === "or") {
      tokens.push({ kind: "or", value: "or", position: start });
    } else if (isField(raw) || isField(lower)) {
      tokens.push({ kind: "field", value: isField(raw) ? raw : lower, position: start });
    } else if (isOp(lower)) {
      tokens.push({ kind: "op", value: lower, position: start });
    } else {
      tokens.push({ kind: "value", value: raw, position: start });
    }
  }
  tokens.push({ kind: "eof", value: "", position: input.length });
  return tokens;
}

export function getLogFieldValue(record: LogRecord, field: QueryField): string | number {
  switch (field) {
    case "addr.src":
      return "srcIp" in record ? record.srcIp : "";
    case "addr.dst":
      return "dstIp" in record ? record.dstIp : "";
    case "user.src":
      return "srcUser" in record ? record.srcUser : "";
    case "app":
      return "app" in record ? record.app : "";
    case "rule":
      return "rule" in record ? record.rule : "";
    case "action":
      return "action" in record ? String(record.action) : "";
    case "zone.src":
      return "srcZone" in record ? record.srcZone : "";
    case "zone.dst":
      return "dstZone" in record ? record.dstZone : "";
    case "port.dst":
      return "dstPort" in record ? record.dstPort : "";
    case "proto":
      return "protocol" in record ? record.protocol : "";
    case "container":
      return record.container;
    case "location":
      return record.location;
    case "type":
      return record.type;
    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
}

function compareValues(
  field: QueryField,
  op: QueryOperator,
  left: string | number,
  rightRaw: string,
): boolean {
  if (field === "port.dst") {
    const leftNum = typeof left === "number" ? left : Number(left);
    const rightNum = Number(rightRaw);
    if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) return false;
    if (op === "eq" || op === "in") return leftNum === rightNum;
    if (op === "neq") return leftNum !== rightNum;
    if (op === "geq") return leftNum >= rightNum;
    if (op === "leq") return leftNum <= rightNum;
    if (op === "contains") return String(leftNum).includes(rightRaw);
    return false;
  }

  const leftStr = String(left);
  if (op === "eq" || op === "in") {
    return leftStr.toLowerCase() === rightRaw.toLowerCase();
  }
  if (op === "neq") {
    return leftStr.toLowerCase() !== rightRaw.toLowerCase();
  }
  if (op === "contains") {
    return leftStr.toLowerCase().includes(rightRaw.toLowerCase());
  }
  if (op === "geq" || op === "leq") {
    const leftNum = Number(leftStr);
    const rightNum = Number(rightRaw);
    if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) {
      return op === "geq"
        ? leftStr.toLowerCase() >= rightRaw.toLowerCase()
        : leftStr.toLowerCase() <= rightRaw.toLowerCase();
    }
    return op === "geq" ? leftNum >= rightNum : leftNum <= rightNum;
  }
  return false;
}

function makePredicate(field: QueryField, op: QueryOperator, value: string): LogPredicate {
  return (record) => compareValues(field, op, getLogFieldValue(record, field), value);
}

class Parser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ParseQueryResult {
    if (this.tokens.length === 1 && this.tokens[0]?.kind === "eof") {
      return { ok: true, predicate: () => true };
    }
    try {
      const predicate = this.parseOr();
      if (this.current().kind !== "eof") {
        return {
          ok: false,
          error: `Unexpected token "${this.current().value}"`,
          position: this.current().position,
        };
      }
      return { ok: true, predicate };
    } catch (err) {
      const failure = err as ParseQueryFailure;
      return failure;
    }
  }

  private current(): Token {
    return this.tokens[this.index] ?? { kind: "eof", value: "", position: 0 };
  }

  private consume(kind: TokenKind, message: string): Token {
    const token = this.current();
    if (token.kind !== kind) {
      throw {
        ok: false,
        error: message,
        position: token.position,
      } satisfies ParseQueryFailure;
    }
    this.index += 1;
    return token;
  }

  private parseOr(): LogPredicate {
    let left = this.parseAnd();
    while (this.current().kind === "or") {
      this.index += 1;
      const right = this.parseAnd();
      const prev = left;
      left = (record) => prev(record) || right(record);
    }
    return left;
  }

  private parseAnd(): LogPredicate {
    let left = this.parsePrimary();
    while (this.current().kind === "and") {
      this.index += 1;
      const right = this.parsePrimary();
      const prev = left;
      left = (record) => prev(record) && right(record);
    }
    return left;
  }

  private parsePrimary(): LogPredicate {
    if (this.current().kind === "lparen") {
      this.index += 1;
      const inner = this.parseOr();
      this.consume("rparen", "Expected closing parenthesis");
      return inner;
    }
    return this.parsePredicate();
  }

  private parsePredicate(): LogPredicate {
    const fieldTok = this.current();
    if (fieldTok.kind !== "field") {
      throw {
        ok: false,
        error: `Expected field, got "${fieldTok.value || "end of input"}"`,
        position: fieldTok.position,
      } satisfies ParseQueryFailure;
    }
    if (!isField(fieldTok.value)) {
      throw {
        ok: false,
        error: `Unknown field "${fieldTok.value}"`,
        position: fieldTok.position,
      } satisfies ParseQueryFailure;
    }
    this.index += 1;

    const opTok = this.current();
    if (opTok.kind !== "op" || !isOp(opTok.value)) {
      throw {
        ok: false,
        error: `Unknown operator "${opTok.value || "end of input"}"`,
        position: opTok.position,
      } satisfies ParseQueryFailure;
    }
    this.index += 1;

    const valueTok = this.current();
    if (valueTok.kind !== "value" && valueTok.kind !== "field") {
      // allow multi-word values rebuilt from consecutive value-like tokens
      if (
        valueTok.kind === "eof" ||
        valueTok.kind === "and" ||
        valueTok.kind === "or" ||
        valueTok.kind === "rparen" ||
        valueTok.kind === "lparen" ||
        valueTok.kind === "op"
      ) {
        throw {
          ok: false,
          error: "Expected value after operator",
          position: valueTok.position,
        } satisfies ParseQueryFailure;
      }
    }

    // Values may include spaces when quoted; unquoted values are a single token.
    // Support multi-token values for container names like "Mobile Users".
    const parts: string[] = [];
    while (
      this.current().kind === "value" ||
      this.current().kind === "field" ||
      (this.current().kind !== "and" &&
        this.current().kind !== "or" &&
        this.current().kind !== "rparen" &&
        this.current().kind !== "lparen" &&
        this.current().kind !== "op" &&
        this.current().kind !== "eof")
    ) {
      const tok = this.current();
      if (tok.kind === "eof") break;
      // Stop if next looks like a new predicate field followed by operator
      if (tok.kind === "field") {
        const next = this.tokens[this.index + 1];
        if (next && next.kind === "op") break;
      }
      parts.push(tok.value);
      this.index += 1;
      // Only continue for space-joined container-like values when next is value
      if (this.current().kind !== "value") break;
    }

    if (parts.length === 0) {
      throw {
        ok: false,
        error: "Expected value after operator",
        position: this.current().position,
      } satisfies ParseQueryFailure;
    }

    return makePredicate(fieldTok.value, opTok.value as QueryOperator, parts.join(" "));
  }
}

/** Parse a PAN-OS style log query into a predicate or an error with position. */
export function parseQuery(input: string): ParseQueryResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, predicate: () => true };
  }
  const tokens = tokenize(trimmed);
  if (!Array.isArray(tokens)) {
    return tokens;
  }
  // Re-map field tokens that were misclassified when appearing as values after tokenize
  // already handled known fields; unknown identifiers become values in tokenize.
  // Fix: unknown fields that look like field.names become values - good.
  // But "Mobile" as value after "container eq" is value - good.
  // Problem: tokenize treats only known fields as field. Unknown `foo.bar` becomes value,
  // so "foo.bar eq x" fails at "Expected field". Adjust tokenize to treat dotted names as field candidates.
  const remapped = remapUnknownFields(tokens);
  if (!remapped.ok) return remapped;
  return new Parser(remapped.tokens).parse();
}

function remapUnknownFields(
  tokens: Token[],
): { ok: true; tokens: Token[] } | ParseQueryFailure {
  // When a value token looks like a.b and is in field position (start or after and/or/( ),
  // treat as unknown field for better errors.
  const out: Token[] = tokens.map((t) => ({ ...t }));
  for (let i = 0; i < out.length; i += 1) {
    const tok = out[i]!;
    const prev = out[i - 1];
    const atFieldPos =
      i === 0 ||
      prev?.kind === "and" ||
      prev?.kind === "or" ||
      prev?.kind === "lparen";
    if (atFieldPos && tok.kind === "value" && tok.value.includes(".")) {
      if (!isField(tok.value)) {
        return {
          ok: false,
          error: `Unknown field "${tok.value}"`,
          position: tok.position,
        };
      }
      out[i] = { ...tok, kind: "field" };
    }
  }
  return { ok: true, tokens: out };
}

export function isLogType(value: string): value is LogType {
  return (
    value === "traffic" ||
    value === "url" ||
    value === "threat" ||
    value === "decryption" ||
    value === "globalprotect" ||
    value === "system" ||
    value === "config"
  );
}
