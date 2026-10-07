"use client";

import { forwardRef, useEffect, useId, useMemo, useState } from "react";
import { QUERY_COPY } from "@/content/investigate";
import {
  QUERY_CONNECTORS,
  QUERY_FIELDS,
  QUERY_OPERATORS,
  parseQuery,
  tokenize,
  type QueryError,
} from "@/lib/query-parser";
import { cn } from "@/lib/utils";

interface QueryBarProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset?: () => void;
  hasAlert: boolean;
}

type Suggestion = { kind: string; value: string };

function suggestionsAt(query: string, cursor: number): Suggestion[] {
  const before = query.slice(0, cursor);
  const tokens = tokenize(before);
  const trailingSpace = /\s$/.test(before);
  const last = tokens[tokens.length - 1];
  const partial = !trailingSpace && last?.kind === "word" ? last.text.toLowerCase() : "";

  const depth =
    tokens.filter((t) => t.kind === "lparen").length - tokens.filter((t) => t.kind === "rparen").length;

  const afterField =
    last &&
    !trailingSpace &&
    last.kind === "word" &&
    QUERY_FIELDS.includes(last.text.toLowerCase() as (typeof QUERY_FIELDS)[number]);
  // Determine what kind of token we expect next.
  let expect: "field" | "operator" | "value" | "connector" = "field";
  if (tokens.length === 0 || (last?.kind === "lparen" && trailingSpace) || last?.kind === "lparen") {
    expect = "field";
  } else {
    // Walk a simple state machine on completed tokens.
    let state: "needField" | "needOp" | "needValue" | "needConn" = "needField";
    for (const token of tokens) {
      if (token.kind === "lparen" || token.kind === "rparen") continue;
      if (token.kind === "string") {
        if (state === "needValue") state = "needConn";
        continue;
      }
      const word = token.text.toLowerCase();
      if (QUERY_CONNECTORS.includes(word as (typeof QUERY_CONNECTORS)[number])) {
        state = "needField";
        continue;
      }
      if (state === "needField") state = "needOp";
      else if (state === "needOp" && QUERY_OPERATORS.includes(word as (typeof QUERY_OPERATORS)[number])) {
        state = "needValue";
      } else if (state === "needValue") state = "needConn";
      else if (state === "needConn") state = "needField";
    }
    if (!trailingSpace && last?.kind === "word") {
      // Still typing the current token: suggest for the current state before advancing.
      if (state === "needOp") expect = "operator";
      else if (state === "needValue") expect = "value";
      else if (state === "needConn") expect = "connector";
      else expect = "field";
    } else {
      expect =
        state === "needField"
          ? "field"
          : state === "needOp"
            ? "operator"
            : state === "needValue"
              ? "value"
              : "connector";
    }
  }

  void afterField;
  void depth;

  if (expect === "field") {
    return QUERY_FIELDS.filter((f) => f.startsWith(partial)).map((value) => ({
      kind: QUERY_COPY.fieldKind,
      value,
    }));
  }
  if (expect === "operator") {
    return QUERY_OPERATORS.filter((o) => o.startsWith(partial)).map((value) => ({
      kind: QUERY_COPY.operatorKind,
      value,
    }));
  }
  if (expect === "connector") {
    return QUERY_CONNECTORS.filter((c) => c.startsWith(partial) || partial === "").map((value) => ({
      kind: QUERY_COPY.connectorKind,
      value,
    }));
  }
  return [];
}

function applySuggestion(query: string, cursor: number, suggestion: string): string {
  const before = query.slice(0, cursor);
  const after = query.slice(cursor);
  const tokens = tokenize(before);
  const trailingSpace = /\s$/.test(before);
  const last = tokens[tokens.length - 1];
  if (!trailingSpace && last?.kind === "word") {
    return `${before.slice(0, last.start)}${suggestion} ${after}`;
  }
  return `${before}${before.length && !trailingSpace ? " " : ""}${suggestion} ${after}`;
}

export const QueryBar = forwardRef<HTMLInputElement, QueryBarProps>(function QueryBar(
  { value, onChange, onRun, onReset, hasAlert },
  ref,
) {
  const listId = useId();
  const [cursor, setCursor] = useState(value.length);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const parsed = useMemo(() => parseQuery(value), [value]);
  const error: QueryError | null = parsed.ok ? null : parsed.error;
  const suggestions = useMemo(() => suggestionsAt(value, cursor).slice(0, 8), [value, cursor]);

  useEffect(() => {
    setActive(0);
  }, [suggestions]);

  return (
    <div
      data-guide-id="guide-query-bar"
      className="space-y-1 border-b border-border bg-panel px-4 py-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="log-query" className="text-[12px] text-muted-fg">
          {QUERY_COPY.label}
          <span className="ml-2 text-muted-fg/80">{QUERY_COPY.focusHint}</span>
        </label>
        <div className="flex gap-2">
          {hasAlert && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-fg hover:text-text"
            >
              {QUERY_COPY.resetToAlert}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-fg hover:text-text"
            >
              {QUERY_COPY.clear}
            </button>
          )}
          <button
            type="button"
            onClick={onRun}
            className="rounded-md bg-accent px-2.5 py-1 text-[12px] text-white hover:opacity-90"
          >
            {QUERY_COPY.run}
          </button>
        </div>
      </div>

      <div className="relative">
        {error ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-transparent px-3 py-2 font-mono text-[13px] whitespace-pre"
          >
            <span className="text-transparent">{value.slice(0, error.start)}</span>
            <span className="border-b-2 border-severity-critical text-transparent">
              {value.slice(error.start, error.end) || " "}
            </span>
            <span className="text-transparent">{value.slice(error.end)}</span>
          </div>
        ) : null}
        <input
          ref={ref}
          id="log-query"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && suggestions.length > 0}
          aria-invalid={Boolean(error)}
          spellCheck={false}
          autoComplete="off"
          placeholder={QUERY_COPY.placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setCursor(event.target.selectionStart ?? event.target.value.length);
            setOpen(true);
          }}
          onClick={(event) => setCursor(event.currentTarget.selectionStart ?? 0)}
          onKeyUp={(event) => setCursor(event.currentTarget.selectionStart ?? 0)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so suggestion click can fire.
            setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && suggestions.length) {
              event.preventDefault();
              setActive((i) => Math.min(suggestions.length - 1, i + 1));
              setOpen(true);
              return;
            }
            if (event.key === "ArrowUp" && suggestions.length) {
              event.preventDefault();
              setActive((i) => Math.max(0, i - 1));
              return;
            }
            if (event.key === "Enter") {
              if (open && suggestions[active]) {
                event.preventDefault();
                const next = applySuggestion(value, cursor, suggestions[active].value);
                onChange(next);
                setOpen(false);
                return;
              }
              event.preventDefault();
              onRun();
              return;
            }
            if (event.key === "Escape") setOpen(false);
          }}
          className={cn(
            "relative w-full rounded-md border bg-surface px-3 py-2 font-mono text-[13px] text-text",
            error ? "border-severity-critical" : "border-border focus:border-accent",
          )}
        />
        {open && suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={QUERY_COPY.suggestionsLabel}
            className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-panel py-1 shadow-[var(--shadow-float)]"
          >
            {suggestions.map((item, index) => (
              <li key={`${item.kind}-${item.value}`} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px]",
                    index === active ? "bg-surface" : "hover:bg-surface",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(applySuggestion(value, cursor, item.value));
                    setOpen(false);
                  }}
                >
                  <span className="font-mono text-text">{item.value}</span>
                  <span className="text-[11px] text-muted-fg">{item.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-[12px] text-severity-critical">
          {QUERY_COPY.errorPrefix}: {error.message}
        </p>
      ) : null}
    </div>
  );
});
