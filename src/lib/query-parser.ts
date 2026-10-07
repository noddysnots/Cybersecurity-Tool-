import type { LogRecord } from "@/types";

/** PAN-OS style log query: ( addr.src in 10.20.14.37 ) and ( app eq ssl ) */

export const QUERY_FIELDS = [
  "addr.src",
  "addr.dst",
  "user.src",
  "app",
  "rule",
  "action",
  "url.category",
  "threat.name",
  "port.dst",
  "device",
] as const;
export type QueryField = (typeof QUERY_FIELDS)[number];

export const QUERY_OPERATORS = ["eq", "neq", "in", "contains"] as const;
export type QueryOperator = (typeof QUERY_OPERATORS)[number];

export const QUERY_CONNECTORS = ["and", "or"] as const;

export type Predicate = (log: LogRecord) => boolean;

/** Half open character range [start, end) in the original query text. */
export interface QueryError {
  message: string;
  start: number;
  end: number;
}

export type ParseResult =
  | { ok: true; predicate: Predicate; ast: QueryNode | null }
  | { ok: false; error: QueryError };

export type QueryNode =
  | { type: "condition"; field: QueryField; operator: QueryOperator; value: string }
  | { type: "and" | "or"; left: QueryNode; right: QueryNode };

export type TokenKind = "word" | "string" | "lparen" | "rparen";

export interface Token {
  kind: TokenKind;
  /** Word text as typed, or string content without the quotes. */
  text: string;
  start: number;
  end: number;
  /** Only set on string tokens that never found their closing quote. */
  unterminated?: boolean;
}

const FIELD_SET: ReadonlySet<string> = new Set(QUERY_FIELDS);
const OPERATOR_SET: ReadonlySet<string> = new Set(QUERY_OPERATORS);

export function isQueryField(value: string): value is QueryField {
  return FIELD_SET.has(value);
}

export function isQueryOperator(value: string): value is QueryOperator {
  return OPERATOR_SET.has(value);
}

function isConnector(token: Token | undefined): boolean {
  if (!token || token.kind !== "word") return false;
  const text = token.text.toLowerCase();
  return text === "and" || text === "or";
}

/** Splits text into tokens. Never throws, so autocomplete can use it on half typed input. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
    } else if (ch === "(") {
      tokens.push({ kind: "lparen", text: "(", start: i, end: i + 1 });
      i += 1;
    } else if (ch === ")") {
      tokens.push({ kind: "rparen", text: ")", start: i, end: i + 1 });
      i += 1;
    } else if (ch === '"') {
      let j = i + 1;
      let text = "";
      let closed = false;
      while (j < input.length) {
        if (input[j] === "\\" && j + 1 < input.length) {
          text += input[j + 1];
          j += 2;
        } else if (input[j] === '"') {
          closed = true;
          j += 1;
          break;
        } else {
          text += input[j];
          j += 1;
        }
      }
      tokens.push({ kind: "string", text, start: i, end: j, ...(closed ? {} : { unterminated: true }) });
      i = j;
    } else {
      let j = i;
      while (j < input.length && !/[\s()"]/.test(input[j])) j += 1;
      tokens.push({ kind: "word", text: input.slice(i, j), start: i, end: j });
      i = j;
    }
  }
  return tokens;
}

/* Addresses ------------------------------------------------------------- */

function ipv4ToInt(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    result = result * 256 + n;
  }
  return result;
}

function isValidAddress(value: string, allowCidr: boolean): boolean {
  const [ip, prefix, extra] = value.split("/");
  if (extra !== undefined) return false;
  if (ipv4ToInt(ip) === null) return false;
  if (prefix === undefined) return true;
  if (!allowCidr || !/^\d{1,2}$/.test(prefix)) return false;
  return Number(prefix) <= 32;
}

function addressMatches(actual: string, pattern: string): boolean {
  const [ip, prefix] = pattern.split("/");
  if (prefix === undefined) return actual === ip;
  const a = ipv4ToInt(actual);
  const b = ipv4ToInt(ip);
  if (a === null || b === null) return false;
  const bits = Number(prefix);
  if (bits === 0) return true;
  const block = 2 ** (32 - bits);
  return Math.floor(a / block) === Math.floor(b / block);
}

/* Evaluation ------------------------------------------------------------ */

const ADDRESS_FIELDS: ReadonlySet<QueryField> = new Set<QueryField>(["addr.src", "addr.dst"]);

function fieldValue(log: LogRecord, field: QueryField): string | number | undefined {
  switch (field) {
    case "addr.src":
      return log.srcIp;
    case "addr.dst":
      return log.dstIp;
    case "user.src":
      return log.srcUser;
    case "app":
      return log.app;
    case "rule":
      return log.rule;
    case "action":
      return log.action;
    case "url.category":
      return log.urlCategory;
    case "threat.name":
      return log.threatName;
    case "port.dst":
      return log.dstPort;
    case "device":
      return log.device;
  }
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function equalsValue(actual: string | number | undefined, expected: string): boolean {
  if (actual === undefined) return false;
  return String(actual).toLowerCase() === expected.toLowerCase();
}

function conditionPredicate(
  field: QueryField,
  operator: QueryOperator,
  value: string,
): Predicate {
  const isAddress = ADDRESS_FIELDS.has(field);
  const list = splitList(value);
  switch (operator) {
    case "eq":
      return (log) => equalsValue(fieldValue(log, field), value);
    case "neq":
      return (log) => !equalsValue(fieldValue(log, field), value);
    case "contains": {
      const needle = value.toLowerCase();
      return (log) => {
        const actual = fieldValue(log, field);
        return actual !== undefined && String(actual).toLowerCase().includes(needle);
      };
    }
    case "in":
      return (log) => {
        const actual = fieldValue(log, field);
        if (actual === undefined) return false;
        if (isAddress) return list.some((item) => addressMatches(String(actual), item));
        return list.some((item) => equalsValue(actual, item));
      };
  }
}

function compile(node: QueryNode): Predicate {
  if (node.type === "condition") {
    return conditionPredicate(node.field, node.operator, node.value);
  }
  const left = compile(node.left);
  const right = compile(node.right);
  return node.type === "and" ? (log) => left(log) && right(log) : (log) => left(log) || right(log);
}

/* Parsing --------------------------------------------------------------- */

class ParseFailure extends Error {
  constructor(readonly detail: QueryError) {
    super(detail.message);
  }
}

function fail(message: string, start: number, end: number): never {
  throw new ParseFailure({ message, start, end });
}

function validateValue(field: QueryField, operator: QueryOperator, token: Token): void {
  if (operator === "contains") return;
  const items = operator === "in" ? splitList(token.text) : [token.text];
  if (items.length === 0) fail(`Expected a value after ${operator}`, token.start, token.end);
  if (ADDRESS_FIELDS.has(field)) {
    const allowCidr = operator === "in";
    const bad = items.find((item) => !isValidAddress(item, allowCidr));
    if (bad !== undefined) {
      fail(
        allowCidr
          ? `"${bad}" is not a valid IPv4 address or CIDR range`
          : `"${bad}" is not a valid IPv4 address`,
        token.start,
        token.end,
      );
    }
  }
  if (field === "port.dst") {
    const bad = items.find((item) => !/^\d{1,5}$/.test(item) || Number(item) > 65535);
    if (bad !== undefined) {
      fail(`"${bad}" is not a valid port. Use a number from 0 to 65535`, token.start, token.end);
    }
  }
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly length: number,
  ) {}

  parse(): QueryNode | null {
    if (this.tokens.length === 0) return null;
    const node = this.parseOr();
    const extra = this.tokens[this.pos];
    if (extra) {
      if (extra.kind === "rparen") fail("Unexpected closing parenthesis", extra.start, extra.end);
      fail(`Expected "and" or "or" before "${extra.text}"`, extra.start, extra.end);
    }
    return node;
  }

  private parseOr(): QueryNode {
    let left = this.parseAnd();
    for (;;) {
      const token = this.tokens[this.pos];
      if (!isConnector(token) || token.text.toLowerCase() !== "or") return left;
      this.pos += 1;
      left = { type: "or", left, right: this.parseAnd(token) };
    }
  }

  private parseAnd(after?: Token): QueryNode {
    let left = this.parsePrimary(after);
    for (;;) {
      const token = this.tokens[this.pos];
      if (!isConnector(token) || token.text.toLowerCase() !== "and") return left;
      this.pos += 1;
      left = { type: "and", left, right: this.parsePrimary(token) };
    }
  }

  private parsePrimary(after?: Token): QueryNode {
    const token = this.tokens[this.pos];
    if (!token) {
      fail(
        after ? `Expected a condition after "${after.text}"` : "Expected a condition",
        this.length,
        this.length,
      );
    }
    if (token.kind === "lparen") {
      this.pos += 1;
      const inner = this.tokens[this.pos];
      if (!inner) fail("Missing closing parenthesis", token.start, token.end);
      if (inner.kind === "rparen") fail("Expected a condition inside the parentheses", inner.start, inner.end);
      const node = this.parseOr();
      const close = this.tokens[this.pos];
      if (!close || close.kind !== "rparen") fail("Missing closing parenthesis", token.start, token.end);
      this.pos += 1;
      return node;
    }
    if (token.kind === "rparen") {
      fail("Unexpected closing parenthesis", token.start, token.end);
    }
    if (isConnector(token)) {
      fail(`Expected a condition before "${token.text}"`, token.start, token.end);
    }
    return this.parseCondition(token);
  }

  private parseCondition(fieldToken: Token): QueryNode {
    if (fieldToken.kind === "string" && fieldToken.unterminated) {
      fail("Missing closing quote", fieldToken.start, fieldToken.end);
    }
    const field = fieldToken.text.toLowerCase();
    if (fieldToken.kind !== "word" || !isQueryField(field)) {
      fail(
        `Unknown field "${fieldToken.text}". Use ${QUERY_FIELDS.join(", ")}`,
        fieldToken.start,
        fieldToken.end,
      );
    }
    this.pos += 1;

    const operatorToken = this.tokens[this.pos];
    if (!operatorToken || operatorToken.kind === "rparen" || isConnector(operatorToken)) {
      const at = operatorToken ? operatorToken.start : this.length;
      fail(
        `Expected an operator after ${field}. Use ${QUERY_OPERATORS.join(", ")}`,
        at,
        operatorToken ? operatorToken.end : this.length,
      );
    }
    const operator = operatorToken.text.toLowerCase();
    if (operatorToken.kind !== "word" || !isQueryOperator(operator)) {
      fail(
        `Unknown operator "${operatorToken.text}". Use ${QUERY_OPERATORS.join(", ")}`,
        operatorToken.start,
        operatorToken.end,
      );
    }
    this.pos += 1;

    const valueToken = this.tokens[this.pos];
    if (!valueToken || valueToken.kind === "rparen" || valueToken.kind === "lparen") {
      const at = valueToken ? valueToken.start : this.length;
      fail(`Expected a value after ${operator}`, at, valueToken ? valueToken.end : this.length);
    }
    if (valueToken.kind === "string" && valueToken.unterminated) {
      fail("Missing closing quote", valueToken.start, valueToken.end);
    }
    validateValue(field, operator, valueToken);
    this.pos += 1;
    return { type: "condition", field, operator, value: valueToken.text };
  }
}

/** Parses a query. Returns a predicate for log records, or an error with its position in the text. */
export function parseQuery(input: string): ParseResult {
  try {
    const ast = new Parser(tokenize(input), input.length).parse();
    return { ok: true, ast, predicate: ast ? compile(ast) : () => true };
  } catch (error) {
    if (error instanceof ParseFailure) return { ok: false, error: error.detail };
    throw error;
  }
}

/* Building queries from UI actions -------------------------------------- */

function formatValue(value: string): string {
  return value.length === 0 || /[\s()",]/.test(value)
    ? `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
    : value;
}

/** Clause used by "Filter by" (include) and "Exclude" in cell menus. */
export function buildClause(
  field: QueryField,
  value: string,
  mode: "include" | "exclude",
): string {
  const isAddress = ADDRESS_FIELDS.has(field);
  const operator: QueryOperator =
    mode === "exclude" ? "neq" : isAddress ? "in" : "eq";
  return `( ${field} ${operator} ${formatValue(value)} )`;
}

function hasTopLevelOr(query: string): boolean {
  let depth = 0;
  for (const token of tokenize(query)) {
    if (token.kind === "lparen") depth += 1;
    else if (token.kind === "rparen") depth -= 1;
    else if (depth === 0 && token.kind === "word" && token.text.toLowerCase() === "or") return true;
  }
  return false;
}

/** Joins a clause onto an existing query with "and", keeping precedence correct. */
export function appendClause(query: string, clause: string): string {
  const trimmed = query.trim();
  if (!trimmed) return clause;
  const base = hasTopLevelOr(trimmed) ? `( ${trimmed} )` : trimmed;
  return `${base} and ${clause}`;
}
