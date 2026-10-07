import { useLayoutEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui";
import {
  annotationsChrome,
  annotationsForPage,
  type AnnotationPage,
  type AnnotationPinDef,
} from "@/content/annotations";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

type PinPos = {
  pin: AnnotationPinDef;
  top: number;
  left: number;
};

function pageFromPath(pathname: string): AnnotationPage | null {
  if (pathname === "/home") return "home";
  if (pathname === "/tickets") return "tickets";
  if (/^\/tickets\/TKT-\d+$/.test(pathname)) return "workspace";
  return null;
}

function measurePins(pins: AnnotationPinDef[]): PinPos[] {
  if (typeof document === "undefined") return [];
  const out: PinPos[] = [];
  for (const pin of pins) {
    const el = document.querySelector<HTMLElement>(
      `[data-annotation="${pin.anchor}"]`,
    );
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    out.push({
      pin,
      top: Math.max(rect.top + 4, 56),
      left: Math.min(rect.left + rect.width - 18, window.innerWidth - 28),
    });
  }
  return out;
}

export function AnnotationsLayer() {
  const location = useLocation();
  const enabled = useUiPrefs((s) => s.annotationsEnabled);
  const openId = useUiPrefs((s) => s.openAnnotationId);
  const setOpenAnnotationId = useUiPrefs((s) => s.setOpenAnnotationId);

  const page = pageFromPath(location.pathname);
  const pins = useMemo(
    () => (page ? annotationsForPage(page) : []),
    [page],
  );

  const [positions, setPositions] = useState<PinPos[]>([]);

  useLayoutEffect(() => {
    if (!enabled || pins.length === 0) {
      setPositions([]);
      return;
    }
    const update = () => setPositions(measurePins(pins));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const id = window.setInterval(update, 500);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(id);
    };
  }, [enabled, pins, location.pathname]);

  if (!enabled || !page || pins.length === 0) {
    return null;
  }

  const openPin = pins.find((p) => p.id === openId) ?? null;
  const openPos = positions.find((p) => p.pin.id === openId);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[50]"
      data-testid="annotations-layer"
    >
      {positions.map(({ pin, top, left }) => (
        <button
          key={pin.id}
          type="button"
          className={cn(
            "pointer-events-auto absolute flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium shadow-md",
            openId === pin.id
              ? "border-accent bg-accent text-bg"
              : "border-border-strong bg-surface-3 text-text",
          )}
          style={{ top, left }}
          data-testid={`annotation-pin-${pin.number}`}
          aria-label={`${annotationsChrome.openPin} ${pin.number}`}
          aria-pressed={openId === pin.id}
          onClick={() =>
            setOpenAnnotationId(openId === pin.id ? null : pin.id)
          }
        >
          {pin.number}
        </button>
      ))}

      {openPin && openPos ? (
        <div
          className="pointer-events-auto absolute w-[300px] rounded-[var(--radius-panel)] border border-border-strong bg-surface-2/95 p-3 shadow-lg backdrop-blur-sm"
          style={{
            top: Math.min(openPos.top + 28, window.innerHeight - 220),
            left: Math.min(Math.max(openPos.left - 260, 12), window.innerWidth - 312),
          }}
          role="dialog"
          aria-label={`${annotationsChrome.title} ${openPin.number}`}
          data-testid="annotation-card"
        >
          <p className="font-mono text-xs text-accent" data-testid="annotation-title">
            {annotationsChrome.title} {openPin.number}
          </p>
          <p className="mt-2 text-xs font-medium text-text-muted">
            {annotationsChrome.designLabel}
          </p>
          <p className="mt-0.5 text-sm text-text" data-testid="annotation-design">
            {openPin.designDecision}
          </p>
          <p className="mt-2 text-xs font-medium text-text-muted">
            {annotationsChrome.problemLabel}
          </p>
          <p className="mt-0.5 text-sm text-text-muted" data-testid="annotation-problem">
            {openPin.userProblem}
          </p>
          <p className="mt-2 text-xs font-medium text-text-muted">
            {annotationsChrome.metricLabel}
          </p>
          <p className="mt-0.5 text-sm text-text" data-testid="annotation-metric">
            {openPin.metric}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="annotation-close"
              onClick={() => setOpenAnnotationId(null)}
            >
              {annotationsChrome.close}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
