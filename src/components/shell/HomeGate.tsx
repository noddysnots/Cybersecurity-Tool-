"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Splash } from "./Splash";
import { StartScreen } from "./StartScreen";

/** Shows the splash on first visit, then the start screen. Renders nothing until saved state is read. */
export function HomeGate() {
  const hydrated = useAppStore((s) => s.hydrated);
  const splashSeen = useAppStore((s) => s.splashSeen);
  const setSplashSeen = useAppStore((s) => s.setSplashSeen);

  const done = useCallback(() => setSplashSeen(true), [setSplashSeen]);

  if (!hydrated) return <div className="min-h-screen bg-surface" />;
  if (!splashSeen) return <Splash onDone={done} />;
  return <StartScreen />;
}
