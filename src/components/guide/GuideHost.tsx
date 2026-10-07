"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GUIDE_COPY, guideStepsFor } from "@/content/guide-steps";
import { SCENARIO_CARDS } from "@/content/shell";
import { requestGuideAction } from "@/lib/guide-actions";
import { useAppStore } from "@/lib/store";
import type { GuideStep } from "@/types";
import { CoachMark, type CoachMarkPlacement } from "./CoachMark";

function pathMatches(pathname: string, prefix?: string): boolean {
  if (!prefix) return true;
  return pathname.startsWith(prefix);
}

function measureTarget(targetId: string): CoachMarkPlacement | null {
  const el = document.querySelector<HTMLElement>(`[data-guide-id="${targetId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const placeBelow = rect.bottom + 180 < window.innerHeight;
  return {
    top: placeBelow ? rect.bottom : rect.top,
    left: Math.max(8, rect.left),
    width: rect.width,
    placeBelow,
  };
}

export function GuideHost() {
  const pathname = usePathname();
  const router = useRouter();
  const guideOn = useAppStore((s) => s.guideOn);
  const setGuideOn = useAppStore((s) => s.setGuideOn);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const guideProgress = useAppStore((s) => s.guideProgress);
  const setGuideStep = useAppStore((s) => s.setGuideStep);
  const setStepDone = useAppStore((s) => s.setStepDone);
  const setPendingGuideAction = useAppStore((s) => s.setPendingGuideAction);
  const hydrated = useAppStore((s) => s.hydrated);

  const steps = useMemo(() => guideStepsFor(activeScenario), [activeScenario]);
  const stepIndex = activeScenario ? (guideProgress[activeScenario] ?? 0) : 0;
  const step: GuideStep | undefined = steps[stepIndex];
  const finished = Boolean(activeScenario && steps.length > 0 && stepIndex >= steps.length);

  const [placement, setPlacement] = useState<CoachMarkPlacement | null>(null);

  const alertId = SCENARIO_CARDS.find((c) => c.id === activeScenario)?.alertId;

  const refreshPlacement = useCallback(() => {
    if (!step) {
      setPlacement(null);
      return;
    }
    if (!pathMatches(pathname, step.pathPrefix)) {
      setPlacement(null);
      return;
    }
    setPlacement(measureTarget(step.targetId));
  }, [pathname, step]);

  useEffect(() => {
    if (!guideOn) return;
    const onResize = () => refreshPlacement();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const timer = window.setInterval(refreshPlacement, 400);
    queueMicrotask(refreshPlacement);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(timer);
    };
  }, [guideOn, refreshPlacement, stepIndex]);

  useEffect(() => {
    if (!guideOn || !hydrated) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (event.defaultPrevented) return;
      event.preventDefault();
      setGuideOn(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [guideOn, hydrated, setGuideOn]);

  const advance = useCallback(
    (nextIndex: number) => {
      if (!activeScenario) return;
      const current = steps[stepIndex];
      if (current?.markDone && alertId && nextIndex > stepIndex) {
        setStepDone(alertId, current.markDone, true);
      }
      setGuideStep(activeScenario, Math.max(0, Math.min(nextIndex, steps.length)));
    },
    [activeScenario, alertId, setGuideStep, setStepDone, stepIndex, steps],
  );

  const ensureOnStepPath = useCallback(() => {
    if (!step?.pathPrefix || !alertId) return;
    if (pathMatches(pathname, step.pathPrefix)) return;
    if (step.pathPrefix.startsWith("/investigate/")) {
      router.push(`/investigate/${alertId}`);
    } else if (step.pathPrefix.startsWith("/resolve/")) {
      router.push(`/resolve/${alertId}`);
    }
  }, [alertId, pathname, router, step]);

  const onDoIt = useCallback(() => {
    if (!step?.actionId) return;
    if (step.actionId === "go-resolve" && alertId) {
      router.push(`/resolve/${alertId}`);
      advance(stepIndex + 1);
      return;
    }
    const onPath = pathMatches(pathname, step.pathPrefix);
    if (!onPath) {
      setPendingGuideAction(step.actionId);
      ensureOnStepPath();
      advance(stepIndex + 1);
      return;
    }
    requestGuideAction(step.actionId);
    advance(stepIndex + 1);
  }, [
    advance,
    alertId,
    ensureOnStepPath,
    pathname,
    router,
    setPendingGuideAction,
    step,
    stepIndex,
  ]);

  if (!hydrated || !guideOn || !activeScenario || steps.length === 0) return null;

  if (finished) {
    return (
      <CoachMark
        title={GUIDE_COPY.completeTitle}
        body={GUIDE_COPY.completeBody}
        stepIndex={steps.length - 1}
        stepCount={steps.length}
        placement={null}
        hasAction={false}
        canBack
        canNext={false}
        onNext={() => undefined}
        onBack={() => advance(steps.length - 1)}
        onSkip={() => setGuideOn(false)}
        onDoIt={() => undefined}
      />
    );
  }

  if (!step) return null;

  return (
    <CoachMark
      title={step.title}
      body={step.body}
      stepIndex={stepIndex}
      stepCount={steps.length}
      placement={placement}
      hasAction={Boolean(step.actionId)}
      canBack={stepIndex > 0}
      canNext={stepIndex < steps.length}
      onNext={() => advance(stepIndex + 1)}
      onBack={() => advance(stepIndex - 1)}
      onSkip={() => setGuideOn(false)}
      onDoIt={onDoIt}
    />
  );
}
