import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { NetworkMesh } from "@/components/network/NetworkMesh";
import { splashCopy } from "@/content/auth";
import {
  hasSeenSplash,
  markSplashSeen,
  useAuthStore,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

const SPLASH_MS = 3200;
const REDUCED_MS = 1000;
const EXIT_MS = 420;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SplashPage() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<"playing" | "exiting">("playing");
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [converge, setConverge] = useState(reduced ? 1 : 0);
  const [nameVisible, setNameVisible] = useState(reduced);
  const [subtitleVisible, setSubtitleVisible] = useState(reduced);
  const finishRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (session || hasSeenSplash()) return;

    let disposed = false;
    let raf = 0;
    let exitTimer = 0;
    let reducedTimer = 0;
    let finished = false;

    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      markSplashSeen();
      setPhase("exiting");
      setProgress(1);
      setConverge(1);
      setNameVisible(true);
      setSubtitleVisible(true);
      exitTimer = window.setTimeout(() => {
        if (!disposed) {
          navigate("/login", { replace: true, state: { fromSplash: true } });
        }
      }, EXIT_MS);
    };

    finishRef.current = finish;

    const duration = reduced ? REDUCED_MS : SPLASH_MS;
    const start = performance.now();

    if (reduced) {
      setProgress(1);
      setConverge(1);
      setNameVisible(true);
      setSubtitleVisible(true);
      reducedTimer = window.setTimeout(finish, REDUCED_MS);
    } else {
      const tick = (now: number) => {
        if (disposed) return;
        const t = Math.min(1, (now - start) / duration);
        setProgress(t);
        setConverge(Math.max(0, Math.min(1, (t - 0.08) / 0.5)));
        if (t >= 0.24) setNameVisible(true);
        if (t >= 0.38) setSubtitleVisible(true);
        if (t >= 1) {
          finish();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(exitTimer);
      window.clearTimeout(reducedTimer);
    };
  }, [hydrated, session, reduced, navigate]);

  useEffect(() => {
    if (!hydrated || session || hasSeenSplash()) return;

    const onSkip = () => finishRef.current();
    window.addEventListener("keydown", onSkip);
    window.addEventListener("pointerdown", onSkip);
    return () => {
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("pointerdown", onSkip);
    };
  }, [hydrated, session]);

  if (!hydrated) {
    return (
      <main
        className="fixed inset-0 bg-bg"
        data-testid="splash"
        data-splash-phase="loading"
        aria-busy="true"
      />
    );
  }

  if (session) {
    return <Navigate to="/home" replace />;
  }

  if (hasSeenSplash() && phase === "playing") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main
      className={cn(
        "fixed inset-0 overflow-hidden bg-bg text-text transition-opacity duration-[420ms] ease-out",
        phase === "exiting" && "opacity-0",
      )}
      data-testid="splash"
      data-splash-phase={
        progress < 0.4 ? "mid" : progress < 0.92 ? "final" : "exit"
      }
      data-splash-progress={progress.toFixed(2)}
      aria-label="Developer splash"
    >
      <div className="absolute inset-0">
        <NetworkMesh
          mode="splash"
          converge={converge}
          intensity={0.9 + converge * 0.2}
          reducedMotion={reduced}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8">
        <div className="flex w-full max-w-[720px] flex-col items-center text-center">
          <h1
            className={cn(
              "text-display font-medium tracking-[-0.04em] text-text transition-opacity duration-500 ease-out",
              nameVisible ? "opacity-100" : "opacity-0",
            )}
            data-testid="splash-name"
          >
            {splashCopy.name}
          </h1>
          <p
            className={cn(
              "mt-4 max-w-[36ch] text-base text-text-muted transition-opacity duration-500 ease-out",
              subtitleVisible ? "opacity-100" : "opacity-0",
            )}
            data-testid="splash-subtitle"
          >
            {splashCopy.subtitle}
          </p>

          <div
            className="mt-10 h-px w-[min(280px,60vw)] overflow-hidden bg-border"
            aria-hidden="true"
          >
            <div
              className="h-full origin-left bg-accent"
              style={{ transform: `scaleX(${progress})` }}
              data-testid="splash-progress"
            />
          </div>
        </div>
      </div>

      <p className="absolute bottom-8 right-8 text-sm text-text-faint">
        {splashCopy.skipHint}
      </p>
    </main>
  );
}
