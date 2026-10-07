import { Check, Lock } from "lucide-react";

import { PLAYBOOK_STEP_META, workspaceCopy } from "@/content/workspace";
import type { TicketCaseState } from "@/lib/case-engine";
import { canSelectStep, getPlaybookGates } from "@/lib/playbook";
import type { PlaybookStep } from "@/types";
import { cn } from "@/lib/utils";

type PlaybookRailProps = {
  state: TicketCaseState;
  onSelect: (step: PlaybookStep) => void;
};

export function PlaybookRail({ state, onSelect }: PlaybookRailProps) {
  const gates = getPlaybookGates(state);

  return (
    <nav
      className="flex h-full min-h-0 w-[200px] shrink-0 flex-col border-r border-border bg-surface-1"
      aria-label={workspaceCopy.playbookTitle}
      data-testid="playbook-rail"
      data-annotation="playbook-rail"
    >
      <p className="border-b border-border px-3 py-2 text-xs font-medium text-text-muted">
        {workspaceCopy.playbookTitle}
      </p>
      <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {PLAYBOOK_STEP_META.map((step) => {
          const gate = gates[step.id];
          const active = state.step === step.id;
          const selectable = canSelectStep(state, step.id);
          const title = gate.unlocked || gate.done ? gate.reason : gate.reason;

          return (
            <li key={step.id}>
              <button
                type="button"
                data-testid={`playbook-step-${step.id}`}
                data-annotation={
                  step.id === "scope" ? "playbook-step-scope" : undefined
                }
                data-state={gate.done ? "done" : active ? "active" : gate.unlocked ? "unlocked" : "locked"}
                disabled={!selectable}
                title={title}
                aria-current={active ? "step" : undefined}
                aria-label={`${step.number}. ${step.label}. ${
                  gate.done
                    ? workspaceCopy.stepDone
                    : active
                      ? workspaceCopy.stepActive
                      : gate.unlocked
                        ? gate.reason
                        : `${workspaceCopy.stepLocked}: ${gate.reason}`
                }`}
                className={cn(
                  "flex w-full items-start gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm transition-colors",
                  active && "bg-surface-3 text-text",
                  !active && selectable && "text-text-muted hover:bg-surface-2 hover:text-text",
                  !selectable && "cursor-not-allowed text-text-faint",
                )}
                onClick={() => {
                  if (selectable) onSelect(step.id);
                }}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono",
                    gate.done && "border-signal text-signal",
                    active && !gate.done && "border-accent text-accent",
                    !gate.done && !active && "border-border text-text-faint",
                  )}
                >
                  {gate.done ? (
                    <Check className="h-3 w-3" aria-hidden />
                  ) : !gate.unlocked ? (
                    <Lock className="h-3 w-3" aria-hidden />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{step.label}</span>
                  {!gate.unlocked && !gate.done ? (
                    <span className="mt-0.5 block text-[10px] leading-snug text-text-faint">
                      {gate.reason}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
