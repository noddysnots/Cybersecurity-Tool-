"use client";

import { Moon, Sun } from "lucide-react";
import { TOP_BAR_COPY } from "@/content/shell";
import { useAppStore } from "@/lib/store";

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === "dark" ? TOP_BAR_COPY.themeToDark : TOP_BAR_COPY.themeToLight}
      className="flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface"
    >
      {theme === "light" ? (
        <Moon className="size-4" aria-hidden="true" />
      ) : (
        <Sun className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
