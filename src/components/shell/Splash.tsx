"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { APP_NAME, AUTHOR_LINE, SPLASH_HINT } from "@/content/shell";

const AUTO_DISMISS_MS = 2600;

export function Splash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(onDone, AUTO_DISMISS_MS);
    window.addEventListener("keydown", onDone);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onDone);
    };
  }, [onDone]);

  // One orchestrated entrance: title, rule, then author line, all finished by 1.4s.
  const enter = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: "easeOut" as const },
        };

  return (
    <div
      role="dialog"
      aria-label={APP_NAME}
      onClick={onDone}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-nav text-console-text"
    >
      <motion.h1 {...enter(0)} className="text-[24px] font-semibold">
        {APP_NAME}
      </motion.h1>
      <motion.div
        {...enter(0.4)}
        className="my-4 h-px w-16 bg-accent"
        aria-hidden="true"
      />
      <motion.p {...enter(0.8)} className="text-[14px] text-console-text/80">
        {AUTHOR_LINE}
      </motion.p>
      <p className="absolute bottom-8 text-[12px] text-console-text/60">
        {SPLASH_HINT}
      </p>
    </div>
  );
}
