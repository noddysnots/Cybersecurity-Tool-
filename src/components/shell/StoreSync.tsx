"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/** Reads saved state after mount (avoids hydration mismatch) and applies the theme class. */
export function StoreSync() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    void Promise.resolve(useAppStore.persist.rehydrate()).finally(() => {
      useAppStore.setState({ hydrated: true });
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
