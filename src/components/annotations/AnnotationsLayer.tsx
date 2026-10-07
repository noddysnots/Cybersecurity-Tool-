"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { annotationsFor } from "@/content/annotations";
import { useAppStore } from "@/lib/store";
import type { AnnotationScreen } from "@/types";
import { AnnotationPinMarker } from "./AnnotationPin";

function screenFromPath(pathname: string): AnnotationScreen | null {
  if (pathname.startsWith("/alerts")) return "alerts";
  if (pathname.startsWith("/investigate") || pathname.startsWith("/logs")) {
    return "investigate";
  }
  if (pathname.startsWith("/resolve")) return "resolve";
  return null;
}

interface PinPos {
  id: string;
  top: number;
  left: number;
}

function measurePins(
  pins: readonly { id: string; targetId: string; number: number }[],
): PinPos[] {
  const used = new Map<string, number>();
  const positions: PinPos[] = [];
  for (const pin of pins) {
    const el = document.querySelector<HTMLElement>(`[data-guide-id="${pin.targetId}"]`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const key = pin.targetId;
    const offset = used.get(key) ?? 0;
    used.set(key, offset + 1);
    positions.push({
      id: pin.id,
      top: Math.max(4, rect.top + offset * 22),
      left: Math.min(window.innerWidth - 32, rect.right - 12 + offset * 8),
    });
  }
  return positions;
}

export function AnnotationsLayer() {
  const pathname = usePathname();
  const annotationsOn = useAppStore((s) => s.annotationsOn);
  const setAnnotationsOn = useAppStore((s) => s.setAnnotationsOn);
  const hydrated = useAppStore((s) => s.hydrated);
  const screen = useMemo(() => screenFromPath(pathname), [pathname]);
  const pins = useMemo(() => annotationsFor(screen), [screen]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [positions, setPositions] = useState<PinPos[]>([]);
  const [routeKey, setRouteKey] = useState(`${pathname}:${annotationsOn}`);

  if (`${pathname}:${annotationsOn}` !== routeKey) {
    setRouteKey(`${pathname}:${annotationsOn}`);
    setOpenId(null);
  }

  const refresh = useCallback(() => {
    setPositions(measurePins(pins));
  }, [pins]);

  useEffect(() => {
    if (!annotationsOn || !hydrated) return;
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const timer = window.setInterval(refresh, 400);
    queueMicrotask(refresh);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(timer);
    };
  }, [annotationsOn, hydrated, refresh]);

  useEffect(() => {
    if (!annotationsOn || !hydrated) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (openId) {
        setOpenId(null);
        return;
      }
      setAnnotationsOn(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [annotationsOn, hydrated, openId, setAnnotationsOn]);

  if (!hydrated || !annotationsOn || !screen || pins.length === 0) return null;

  const posById = new Map(positions.map((p) => [p.id, p]));

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {pins.map((pin) => {
        const pos = posById.get(pin.id);
        if (!pos) return null;
        return (
          <AnnotationPinMarker
            key={pin.id}
            pin={pin}
            top={pos.top}
            left={pos.left}
            open={openId === pin.id}
            onToggle={() => setOpenId((id) => (id === pin.id ? null : pin.id))}
            onClose={() => setOpenId(null)}
          />
        );
      })}
    </div>
  );
}
