"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { GUIDE_COPY } from "@/content/guide-steps";
import { cn } from "@/lib/utils";

export interface CoachMarkPlacement {
  top: number;
  left: number;
  width: number;
  /** Prefer below the target when true. */
  placeBelow: boolean;
}

interface CoachMarkProps {
  title: string;
  body: string;
  stepIndex: number;
  stepCount: number;
  placement: CoachMarkPlacement | null;
  hasAction: boolean;
  canBack: boolean;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onDoIt: () => void;
}

export function CoachMark({
  title,
  body,
  stepIndex,
  stepCount,
  placement,
  hasAction,
  canBack,
  canNext,
  onNext,
  onBack,
  onSkip,
  onDoIt,
}: CoachMarkProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, [stepIndex, title]);

  const style: CSSProperties = placement
    ? {
        position: "fixed",
        top: placement.placeBelow
          ? placement.top + 8
          : Math.max(8, placement.top - 8),
        left: Math.min(
          Math.max(8, placement.left),
          typeof window !== "undefined" ? window.innerWidth - 360 : placement.left,
        ),
        transform: placement.placeBelow ? "none" : "translateY(-100%)",
        zIndex: 60,
      }
    : {
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
      };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={style}
      className={cn(
        "w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-panel p-3 text-text outline-none",
        "shadow-[var(--shadow-float)] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p id={titleId} className="text-[13px] font-medium text-text">
          {title}
        </p>
        <p className="shrink-0 font-mono text-[11px] text-muted-fg">
          {GUIDE_COPY.progress(stepIndex + 1, stepCount)}
        </p>
      </div>
      <p className="mt-1.5 text-[12px] leading-5 text-muted-fg">{body}</p>
      {!placement ? (
        <p className="mt-1.5 text-[12px] text-muted-fg">{GUIDE_COPY.targetMissing}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-muted-fg">{GUIDE_COPY.closeHint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className="rounded-md border border-border px-2.5 py-1 text-[12px] text-text enabled:hover:bg-surface disabled:opacity-40"
        >
          {GUIDE_COPY.back}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="rounded-md border border-accent bg-accent px-2.5 py-1 text-[12px] text-white enabled:hover:opacity-90 disabled:opacity-40"
        >
          {GUIDE_COPY.next}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md border border-border px-2.5 py-1 text-[12px] text-muted-fg hover:text-text"
        >
          {GUIDE_COPY.skip}
        </button>
        {hasAction ? (
          <button
            type="button"
            onClick={onDoIt}
            className="ml-auto rounded-md border border-border px-2.5 py-1 text-[12px] text-accent hover:bg-surface"
          >
            {GUIDE_COPY.doItForMe}
          </button>
        ) : null}
      </div>
    </div>
  );
}
