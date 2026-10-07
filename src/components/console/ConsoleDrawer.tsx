"use client";

import { Check, ChevronDown, ChevronUp, Copy, GripHorizontal, Pin, Terminal } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CONSOLE_COPY, CONSOLE_TOASTS, promptForMode } from "@/content/console";
import {
  completeCommand,
  runCommand,
  sharedPrefix,
  type ConsoleMode,
} from "@/lib/console/commands";
import {
  GUIDE_ACTION_EVENT,
  GUIDE_CONSOLE_COMMANDS,
  isGuideActionEvent,
  requestGuideAction,
} from "@/lib/guide-actions";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { GuideActionId } from "@/types";

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 480;
const DEFAULT_HEIGHT = 220;
const COLLAPSED_HEIGHT = 36;

interface OutputBlock {
  id: number;
  command: string;
  body: string;
  error?: boolean;
}

interface ConsoleDrawerProps {
  /** Alert id for pinning. Null on the unscoped /logs view. */
  alertId: string | null;
  /** Called when a diagnostic command succeeds (marks the console step). */
  onCommandSuccess?: () => void;
}

let blockCounter = 0;

const CONSOLE_GUIDE_ACTIONS = new Set<GuideActionId>([
  "run-decrypt-match-a",
  "run-vpn-check-b",
  "run-threat-c",
]);

export function ConsoleDrawer({ alertId, onCommandSuccess }: ConsoleDrawerProps) {
  const scenarioFixes = useAppStore((s) => s.scenarioFixes);
  const pinConsoleEvidence = useAppStore((s) => s.pinConsoleEvidence);
  const pushToast = useAppStore((s) => s.pushToast);
  const pendingGuideAction = useAppStore((s) => s.pendingGuideAction);
  const setPendingGuideAction = useAppStore((s) => s.setPendingGuideAction);

  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [mode, setMode] = useState<ConsoleMode>("branch");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<OutputBlock[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const modeId = useId();

  const prompt = `${promptForMode(mode)}>`;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "`") {
        event.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) queueMicrotask(() => inputRef.current?.focus());
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [blocks]);

  const appendBlock = useCallback((command: string, body: string, error = false) => {
    blockCounter += 1;
    setBlocks((prev) => [...prev, { id: blockCounter, command, body, error }]);
  }, []);

  const run = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
      setHistoryIndex(null);

      const result = runCommand(trimmed, { mode, scenarioFixes });
      if (result.ok && result.clear) {
        setBlocks([]);
        setInput("");
        return;
      }
      if (result.ok) {
        appendBlock(trimmed, result.output);
        onCommandSuccess?.();
      } else {
        appendBlock(trimmed, result.message, true);
      }
      setInput("");
    },
    [appendBlock, mode, onCommandSuccess, scenarioFixes],
  );

  useEffect(() => {
    const commandFor = (id: GuideActionId): string | null => {
      if (id === "run-decrypt-match-a") return GUIDE_CONSOLE_COMMANDS.A;
      if (id === "run-vpn-check-b") return GUIDE_CONSOLE_COMMANDS.B;
      if (id === "run-threat-c") return GUIDE_CONSOLE_COMMANDS.C;
      return null;
    };
    function onGuideAction(event: Event) {
      if (!isGuideActionEvent(event)) return;
      const command = commandFor(event.detail.id);
      if (!command) return;
      setOpen(true);
      setMode("branch");
      queueMicrotask(() => {
        run(command);
        focusInput();
      });
    }
    window.addEventListener(GUIDE_ACTION_EVENT, onGuideAction);
    return () => window.removeEventListener(GUIDE_ACTION_EVENT, onGuideAction);
  }, [focusInput, run]);

  useEffect(() => {
    if (!pendingGuideAction || !CONSOLE_GUIDE_ACTIONS.has(pendingGuideAction)) return;
    const action = pendingGuideAction;
    setPendingGuideAction(null);
    requestGuideAction(action);
  }, [pendingGuideAction, setPendingGuideAction]);

  const onTabComplete = useCallback(() => {
    const matches = completeCommand(input, mode);
    if (matches.length === 0) return;
    if (matches.length === 1) {
      setInput(matches[0]);
      return;
    }
    const common = sharedPrefix(matches);
    if (common.length > input.trim().length) {
      setInput(common);
      return;
    }
    appendBlock(input || "(tab)", matches.map((m) => `  ${m}`).join("\n"));
  }, [appendBlock, input, mode]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      run(input);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      onTabComplete();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const next =
        historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next] ?? "");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      if (historyIndex >= history.length - 1) {
        setHistoryIndex(null);
        setInput("");
        return;
      }
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setInput(history[next] ?? "");
      return;
    }
  };

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragRef.current = { startY: event.clientY, startHeight: height };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const delta = dragRef.current.startY - event.clientY;
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragRef.current.startHeight + delta));
    setHeight(next);
  };

  const endResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const copyBlock = async (block: OutputBlock) => {
    try {
      await navigator.clipboard.writeText(block.body);
      setCopiedId(block.id);
      pushToast(CONSOLE_TOASTS.copied);
      window.setTimeout(() => setCopiedId((id) => (id === block.id ? null : id)), 1500);
    } catch {
      pushToast(CONSOLE_TOASTS.copied);
    }
  };

  const pinBlock = (block: OutputBlock) => {
    if (!alertId) {
      pushToast(CONSOLE_COPY.pinUnavailable);
      return;
    }
    const added = pinConsoleEvidence(alertId, block.command, block.body);
    pushToast(added ? CONSOLE_TOASTS.pinned : CONSOLE_TOASTS.alreadyPinned);
  };

  return (
    <section
      data-guide-id="guide-console"
      className="flex shrink-0 flex-col border-t border-console-text/15 bg-console text-console-text"
      style={{ height: open ? height : COLLAPSED_HEIGHT }}
      aria-label={CONSOLE_COPY.title}
    >
      {open ? (
        <button
          type="button"
          aria-label={CONSOLE_COPY.resize}
          onPointerDown={startResize}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          className="flex h-3 cursor-ns-resize items-center justify-center text-console-text/50 hover:text-console-text"
        >
          <GripHorizontal className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}

      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-console-text/15 px-3">
        <Terminal className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
        <span className="text-[12px] font-medium">{CONSOLE_COPY.title}</span>
        <kbd className="rounded-sm border border-console-text/20 px-1 font-mono text-[10px] text-console-text/60">
          {CONSOLE_COPY.shortcutHint}
        </kbd>

        {open ? (
          <div
            className="ml-2 flex items-center gap-1 rounded-md border border-console-text/20 p-0.5"
            role="group"
            aria-labelledby={modeId}
          >
            <span id={modeId} className="sr-only">
              {CONSOLE_COPY.modeLabel}
            </span>
            {(
              [
                ["prisma", CONSOLE_COPY.modePrisma],
                ["branch", CONSOLE_COPY.modeBranch],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[11px]",
                  mode === value
                    ? "bg-accent text-primary-foreground"
                    : "text-console-text/70 hover:text-console-text",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          aria-label={open ? CONSOLE_COPY.collapse : CONSOLE_COPY.expand}
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            if (!open) queueMicrotask(focusInput);
          }}
          className="ml-auto rounded-sm p-1 text-console-text/70 hover:text-console-text"
        >
          {open ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {open ? (
        <>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12px] leading-5"
            aria-label={CONSOLE_COPY.outputLabel}
          >
            {blocks.length === 0 ? (
              <p className="text-console-text/50">{CONSOLE_COPY.emptyHint}</p>
            ) : (
              blocks.map((block) => (
                <div key={block.id} className="mb-3 last:mb-0">
                  <div className="flex items-start gap-2">
                    <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                      <span className="text-accent">{prompt}</span> {block.command}
                      {"\n"}
                      <span className={block.error ? "text-severity-critical" : "text-console-text"}>
                        {block.body}
                      </span>
                    </pre>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label={CONSOLE_COPY.copyOutput}
                        onClick={() => void copyBlock(block)}
                        className="rounded-sm border border-console-text/20 p-1 text-console-text/70 hover:text-console-text"
                      >
                        {copiedId === block.id ? (
                          <Check className="size-3.5 text-success" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={CONSOLE_COPY.pinOutput}
                        disabled={!alertId || block.error}
                        onClick={() => pinBlock(block)}
                        className="rounded-sm border border-console-text/20 p-1 text-console-text/70 enabled:hover:text-console-text disabled:opacity-40"
                      >
                        <Pin className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-console-text/15 px-3 py-2">
            <span className="shrink-0 font-mono text-[12px] text-accent">{prompt}</span>
            <input
              ref={inputRef}
              id="console-command-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              aria-label={CONSOLE_COPY.inputLabel}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-console-text outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent placeholder:text-console-text/40"
              placeholder="help"
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
