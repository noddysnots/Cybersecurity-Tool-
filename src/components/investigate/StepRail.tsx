"use client";

import { Check } from "lucide-react";
import { STEPS, WORKSPACE_COPY } from "@/content/investigate";
import { cn } from "@/lib/utils";
import type { StepId } from "@/types";

interface StepRailProps {
  done: readonly StepId[];
  onToggle: (step: StepId) => void;
  /** When Guide is on, highlight this rail step as current. */
  guideCurrent?: StepId;
}

export function StepRail({ done, onToggle, guideCurrent }: StepRailProps) {
  const doneSet = new Set(done);
  const current =
    guideCurrent ??
    STEPS.find((step) => !doneSet.has(step.id))?.id ??
    STEPS[STEPS.length - 1].id;

  return (
    <nav
      aria-label={WORKSPACE_COPY.stepRailLabel}
      data-guide-id="guide-step-rail"
      className="flex w-44 shrink-0 flex-col gap-1 border-r border-border bg-panel px-2 py-3"
    >
      <ol className="space-y-1">
        {STEPS.map((step, index) => {
          const isDone = doneSet.has(step.id);
          const isCurrent = step.id === current;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onToggle(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                aria-pressed={isDone}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-[13px]",
                  isCurrent && "bg-surface",
                  !isCurrent && "hover:bg-surface/70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                    isDone
                      ? "border-success bg-success text-white"
                      : isCurrent
                        ? "border-accent text-accent"
                        : "border-border text-muted-fg",
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="size-3" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-text">{step.label}</span>
                  <span className="block text-[12px] text-muted-fg">{step.hint}</span>
                  {isDone ? (
                    <span className="sr-only">{WORKSPACE_COPY.stepDone}</span>
                  ) : isCurrent ? (
                    <span className="sr-only">{WORKSPACE_COPY.stepCurrent}</span>
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
