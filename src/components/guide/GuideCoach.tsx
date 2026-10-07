import { useLayoutEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui";
import { guideChrome, guideStepsForCase } from "@/content/guide";
import {
  useCaseEngine,
  type CaseTicketId,
} from "@/lib/case-engine";
import { runGuideAction } from "@/lib/guide-actions";
import { isCaseTicketId } from "@/lib/playbook";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function readAnchor(anchor: string): AnchorRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>(
    `[data-guide-anchor="${anchor}"]`,
  );
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function ticketIdFromPath(pathname: string): CaseTicketId | null {
  const match = pathname.match(/^\/tickets\/(TKT-\d+)$/);
  const id = match?.[1];
  if (!id || !isCaseTicketId(id)) return null;
  return id;
}

export function GuideCoach() {
  const location = useLocation();
  const guideEnabled = useUiPrefs((s) => s.guideEnabled);
  const guideByTicket = useUiPrefs((s) => s.guideByTicket);
  const setGuideProgress = useUiPrefs((s) => s.setGuideProgress);
  const skipGuide = useUiPrefs((s) => s.skipGuide);
  const setStep = useCaseEngine((s) => s.setStep);

  const ticketId = ticketIdFromPath(location.pathname);
  const caseState = useCaseEngine((s) =>
    ticketId ? s.tickets[ticketId] : undefined,
  );

  const steps = useMemo(
    () => (caseState ? guideStepsForCase(caseState.caseKey) : []),
    [caseState],
  );

  const progress = ticketId ? guideByTicket[ticketId] : undefined;
  const index = Math.min(
    Math.max(progress?.index ?? 0, 0),
    Math.max(steps.length - 1, 0),
  );
  const skipped = progress?.skipped ?? false;
  const step = steps[index];

  const [rect, setRect] = useState<AnchorRect | null>(null);

  useLayoutEffect(() => {
    if (!guideEnabled || !step || skipped) {
      setRect(null);
      return;
    }
    const update = () => setRect(readAnchor(step.anchor));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const id = window.setInterval(update, 400);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(id);
    };
  }, [guideEnabled, step, skipped, location.pathname, caseState?.step]);

  if (!guideEnabled || !ticketId || !caseState || !step || steps.length === 0) {
    return null;
  }

  if (skipped) {
    return null;
  }

  // Dock bottom-left, clear of the top-bar menus and the primary step actions.
  const cardTop = typeof window !== "undefined" ? window.innerHeight - 292 : 608;
  const cardLeft = 16;

  function goIndex(next: number) {
    if (!ticketId) return;
    const clamped = Math.min(Math.max(next, 0), steps.length - 1);
    const target = steps[clamped];
    setGuideProgress(ticketId, {
      index: clamped,
      skipped: false,
    });
    if (target) {
      setStep(ticketId, target.playbookStep);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[55]" data-testid="guide-layer">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-[var(--radius-control)] ring-2 ring-accent ring-offset-2 ring-offset-bg"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
          aria-hidden
          data-testid="guide-highlight"
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-auto absolute w-[340px] rounded-[var(--radius-panel)] border border-border-strong bg-surface-2/95 p-3 shadow-lg backdrop-blur-sm",
        )}
        style={{ top: cardTop, left: cardLeft }}
        role="dialog"
        aria-label={guideChrome.title}
        data-testid="guide-coach"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-text-faint">
              {guideChrome.title} · {index + 1} {guideChrome.stepOf} {steps.length}
            </p>
            <p className="mt-0.5 text-sm font-medium text-text">{step.title}</p>
          </div>
        </div>

        <p className="mt-2 text-xs font-medium text-text-muted">{guideChrome.whatLabel}</p>
        <p className="mt-0.5 text-sm text-text" data-testid="guide-what">
          {step.what}
        </p>

        <p className="mt-3 text-xs font-medium text-text-muted">{guideChrome.whyLabel}</p>
        <p className="mt-0.5 text-sm text-text-muted" data-testid="guide-why">
          {step.why}
        </p>

        {!rect ? (
          <p className="mt-2 text-xs text-warn" data-testid="guide-missing-anchor">
            {guideChrome.missingAnchor}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="guide-back"
            disabled={index === 0}
            title={index === 0 ? "Already on the first step" : undefined}
            onClick={() => goIndex(index - 1)}
          >
            {guideChrome.back}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="guide-next"
            disabled={index >= steps.length - 1}
            title={
              index >= steps.length - 1 ? "Already on the last step" : undefined
            }
            onClick={() => goIndex(index + 1)}
          >
            {guideChrome.next}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="guide-skip"
            onClick={() => {
              if (ticketId) skipGuide(ticketId);
            }}
          >
            {guideChrome.skip}
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="guide-do-it"
            onClick={() => {
              if (ticketId) runGuideAction(ticketId, step.action);
            }}
          >
            {guideChrome.doItForMe}
          </Button>
        </div>
      </div>
    </div>
  );
}
