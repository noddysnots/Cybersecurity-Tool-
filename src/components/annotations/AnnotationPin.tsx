"use client";

import { useEffect, useId, useRef } from "react";
import { ANNOTATIONS_COPY } from "@/content/annotations";
import { cn } from "@/lib/utils";
import type { AnnotationPin as AnnotationPinData } from "@/types";

interface AnnotationPinProps {
  pin: AnnotationPinData;
  top: number;
  left: number;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function AnnotationPinMarker({
  pin,
  top,
  left,
  open,
  onToggle,
  onClose,
}: AnnotationPinProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <div
      className="pointer-events-auto absolute"
      style={{ top, left, zIndex: 50 }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={ANNOTATIONS_COPY.pinLabel(pin.number)}
        onClick={onToggle}
        className={cn(
          "flex size-6 items-center justify-center rounded-full border text-[11px] font-medium shadow-[var(--shadow-float)]",
          open
            ? "border-accent bg-accent text-white"
            : "border-accent bg-panel text-accent hover:bg-surface",
        )}
      >
        {pin.number}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={titleId}
          role="dialog"
          aria-label={ANNOTATIONS_COPY.pinLabel(pin.number)}
          tabIndex={-1}
          className="absolute left-0 top-8 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-panel p-3 text-text shadow-[var(--shadow-float)] outline-none"
        >
          <div className="space-y-2 text-[12px] leading-5">
            <div>
              <p className="font-medium text-text">{ANNOTATIONS_COPY.decisionLabel}</p>
              <p className="text-muted-fg">{pin.decision}</p>
            </div>
            <div>
              <p className="font-medium text-text">{ANNOTATIONS_COPY.problemLabel}</p>
              <p className="text-muted-fg">{pin.problem}</p>
            </div>
            <div>
              <p className="font-medium text-text">{ANNOTATIONS_COPY.metricLabel}</p>
              <p className="text-muted-fg">
                <span className="text-text">
                  {ANNOTATIONS_COPY.metricKindLabel[pin.metricKind]}
                </span>
                {": "}
                {pin.metric}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-fg">{ANNOTATIONS_COPY.closeHint}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-md border border-border px-2 py-1 text-[12px] text-text hover:bg-surface"
          >
            {ANNOTATIONS_COPY.close}
          </button>
        </div>
      ) : null}
    </div>
  );
}
