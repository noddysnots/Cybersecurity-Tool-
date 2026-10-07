import { useEffect, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type ViewPhase = "loading" | "ready" | "error";

/**
 * Shared loading / error lifecycle for supporting data views.
 * `forceError` comes from ?error=1 so Playwright can open the error state.
 */
export function useViewState(
  depsKey: string,
  forceError: boolean,
): {
  phase: ViewPhase;
  retry: () => void;
} {
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState<ViewPhase>("loading");

  useEffect(() => {
    setPhase("loading");
    const delay = prefersReducedMotion() ? 60 : 280;
    const id = globalThis.setTimeout(() => {
      setPhase(forceError ? "error" : "ready");
    }, delay);
    return () => globalThis.clearTimeout(id);
  }, [depsKey, forceError, tick]);

  function retry() {
    setTick((n) => n + 1);
  }

  return { phase, retry };
}
