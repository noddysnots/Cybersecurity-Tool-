import { Copy, Pin, Terminal, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui";
import { consoleCopy } from "@/content/console";
import { shellCopy } from "@/content/shell";
import {
  completeCommand,
  listCompletions,
  modeLabel,
  promptForMode,
  runCommand,
  type ConsoleMode,
} from "@/lib/console";
import { type CaseTicketId, useCaseEngine } from "@/lib/case-engine";
import { isCaseTicketId } from "@/lib/playbook";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

type OutputBlock = {
  id: string;
  mode: ConsoleMode;
  input: string;
  output: string;
  pinned: boolean;
};

function ticketIdFromPath(pathname: string): CaseTicketId | null {
  const match = /^\/tickets\/(TKT-\d+)/.exec(pathname);
  if (!match?.[1] || !isCaseTicketId(match[1])) return null;
  return match[1];
}

export function ConsoleDrawer() {
  const open = useUiPrefs((s) => s.consoleOpen);
  const setConsoleOpen = useUiPrefs((s) => s.setConsoleOpen);
  const mode = useUiPrefs((s) => s.consoleMode);
  const setConsoleMode = useUiPrefs((s) => s.setConsoleMode);
  const height = useUiPrefs((s) => s.consoleHeight);
  const setConsoleHeight = useUiPrefs((s) => s.setConsoleHeight);
  const seed = useUiPrefs((s) => s.consoleSeed);
  const setConsoleSeed = useUiPrefs((s) => s.setConsoleSeed);
  const tickets = useCaseEngine((s) => s.tickets);
  const pinEvidence = useCaseEngine((s) => s.pinEvidence);

  const location = useLocation();
  const pinTicketId = ticketIdFromPath(location.pathname);

  const [line, setLine] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<OutputBlock[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);
  const [copyFlash, setCopyFlash] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const prompt = promptForMode(mode);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open, mode]);

  useEffect(() => {
    if (!seed) return;
    setLine(seed);
    setConsoleSeed(null);
    inputRef.current?.focus();
  }, [seed, setConsoleSeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [blocks]);

  const ctx = useMemo(() => ({ mode, tickets }), [mode, tickets]);

  function runLine(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const result = runCommand(mode, trimmed, ctx);
    setBlocks((prev) => [
      ...prev,
      {
        id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        mode,
        input: trimmed,
        output: result.output,
        pinned: false,
      },
    ]);
    setHistory((prev) => {
      if (prev[prev.length - 1] === trimmed) return prev;
      return [...prev, trimmed];
    });
    setHistoryIndex(null);
    setLine("");
    setCompletions([]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      runLine(line);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const next = completeCommand(mode, line);
      setLine(next);
      setCompletions(listCompletions(mode, next === line ? line : next).slice(0, 8));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIndex =
        historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setLine(history[nextIndex] ?? "");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      if (historyIndex >= history.length - 1) {
        setHistoryIndex(null);
        setLine("");
        return;
      }
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setLine(history[nextIndex] ?? "");
    }
  }

  async function copyBlock(block: OutputBlock) {
    const text = `${prompt} ${block.input}\n${block.output}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyFlash(block.id);
      window.setTimeout(() => setCopyFlash(null), 1200);
    } catch {
      // clipboard may be denied; leave UI unchanged
    }
  }

  function pinBlock(block: OutputBlock) {
    if (!pinTicketId) return;
    pinEvidence(pinTicketId, {
      id: `ev-console-${block.id}`,
      source: "tool",
      label: `Console: ${block.input}`,
      refId: block.id,
      note: block.output.slice(0, 240),
    });
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, pinned: true } : b)),
    );
  }

  function onResizeStart(event: ReactMouseEvent) {
    event.preventDefault();
    dragRef.current = { startY: event.clientY, startHeight: height };
    const onMove = (moveEvent: globalThis.MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - moveEvent.clientY;
      setConsoleHeight(dragRef.current.startHeight + delta);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      data-testid="console-drawer"
      data-open={open ? "true" : "false"}
      data-mode={mode}
      className={cn(
        "relative shrink-0 border-t border-border-strong bg-bg",
        open ? "" : "h-0 overflow-hidden border-t-0",
      )}
      style={open ? { height } : undefined}
      aria-hidden={!open}
    >
      {open ? (
        <div className="flex h-full flex-col">
          <button
            type="button"
            className="absolute inset-x-0 top-0 z-10 h-1.5 cursor-ns-resize bg-transparent hover:bg-signal/30"
            aria-label={consoleCopy.resize}
            data-testid="console-resize"
            onMouseDown={onResizeStart}
          />
          <div className="flex h-10 items-center justify-between gap-3 border-b border-border px-4 pt-1">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-text">
                <Terminal className="h-4 w-4 text-signal" aria-hidden />
                <span>{shellCopy.consoleTitle}</span>
                <span className="font-mono text-xs text-text-faint">
                  {shellCopy.consoleHint}
                </span>
              </div>
              <div
                className="flex rounded-[var(--radius-control)] border border-border bg-surface-2 p-0.5"
                role="tablist"
                aria-label="Console mode"
              >
                {(["prisma", "branch"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    data-testid={`console-mode-${m}`}
                    className={cn(
                      "rounded-[var(--radius-control)] px-2.5 py-1 text-xs",
                      mode === m
                        ? "bg-surface-3 text-text"
                        : "text-text-muted hover:text-text",
                    )}
                    onClick={() => setConsoleMode(m)}
                  >
                    {modeLabel(m)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-text-muted hover:bg-surface-2 hover:text-text"
              aria-label={consoleCopy.close}
              onClick={() => setConsoleOpen(false)}
              data-testid="console-close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-auto px-4 py-2 font-mono text-xs text-text"
            data-testid="console-output"
          >
            {blocks.length === 0 ? (
              <p className="text-text-muted">{consoleCopy.empty}</p>
            ) : (
              blocks.map((block) => (
                <div
                  key={block.id}
                  className="mb-3 border-b border-border/50 pb-3"
                  data-testid={`console-block-${block.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-signal">
                      {promptForMode(block.mode)} {block.input}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        data-testid={`console-copy-${block.id}`}
                        aria-label={consoleCopy.copyOutput}
                        onClick={() => void copyBlock(block)}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        {copyFlash === block.id ? consoleCopy.copied : consoleCopy.copyOutput}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        data-testid={`console-pin-${block.id}`}
                        disabled={!pinTicketId || block.pinned}
                        title={
                          !pinTicketId
                            ? consoleCopy.pinDisabled
                            : block.pinned
                              ? consoleCopy.pinned
                              : undefined
                        }
                        aria-label={consoleCopy.pinOutput}
                        onClick={() => pinBlock(block)}
                      >
                        <Pin className="h-3.5 w-3.5" aria-hidden />
                        {block.pinned ? consoleCopy.pinned : consoleCopy.pinOutput}
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap text-text-muted">{block.output}</pre>
                </div>
              ))
            )}
          </div>

          {completions.length > 1 ? (
            <div
              className="border-t border-border bg-surface-1 px-4 py-1 font-mono text-[11px] text-text-faint"
              data-testid="console-completions"
            >
              {completions.join("  ·  ")}
            </div>
          ) : null}

          <div className="flex items-center gap-2 border-t border-border px-4 py-2">
            <label className="sr-only" htmlFor="console-input">
              Console command
            </label>
            <span className="shrink-0 font-mono text-xs text-signal">{prompt}</span>
            <input
              id="console-input"
              ref={inputRef}
              data-testid="console-input"
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-text outline-none placeholder:text-text-faint"
              value={line}
              onChange={(e) => {
                setLine(e.target.value);
                setCompletions([]);
              }}
              onKeyDown={onKeyDown}
              autoComplete="off"
              spellCheck={false}
              placeholder={consoleCopy.historyHint}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
