import { Terminal, X } from "lucide-react";

import { shellCopy } from "@/content/shell";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

export function ConsoleDrawer() {
  const open = useUiPrefs((s) => s.consoleOpen);
  const setConsoleOpen = useUiPrefs((s) => s.setConsoleOpen);

  return (
    <div
      data-testid="console-drawer"
      data-open={open ? "true" : "false"}
      className={cn(
        "shrink-0 border-t border-border-strong bg-bg transition-[height] duration-200 ease-out",
        open ? "h-52" : "h-0 overflow-hidden border-t-0",
      )}
      aria-hidden={!open}
    >
      {open ? (
        <div className="flex h-full flex-col">
          <div className="flex h-10 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2 text-sm text-text">
              <Terminal className="h-4 w-4 text-signal" aria-hidden />
              <span>{shellCopy.consoleTitle}</span>
              <span className="font-mono text-xs text-text-faint">
                {shellCopy.consoleHint}
              </span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-text-muted hover:bg-surface-2 hover:text-text"
              aria-label="Close console"
              onClick={() => setConsoleOpen(false)}
              data-testid="console-close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3 font-mono text-sm text-text-muted">
            <p className="text-signal">admin@triage-console&gt;</p>
            <p className="mt-2">{shellCopy.consolePlaceholder}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
