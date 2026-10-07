import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ConsoleMode } from "@/lib/console";
import type { TimeZoneMode } from "@/lib/time";

function safeStorage(): Storage {
  const memory = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key) {
      return memory.get(key) ?? null;
    },
    key(index) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key) {
      memory.delete(key);
    },
    setItem(key, value) {
      memory.set(key, value);
    },
  };

  if (typeof localStorage === "undefined") {
    return memoryStorage;
  }

  try {
    const probe = "__triage_ui_prefs_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return memoryStorage;
  }
}

type UiPrefsState = {
  navCollapsed: boolean;
  clockZone: TimeZoneMode;
  guideEnabled: boolean;
  annotationsEnabled: boolean;
  consoleOpen: boolean;
  consoleMode: ConsoleMode;
  consoleHeight: number;
  consoleSeed: string | null;
  paletteOpen: boolean;
  setNavCollapsed: (value: boolean) => void;
  toggleNav: () => void;
  setClockZone: (zone: TimeZoneMode) => void;
  toggleClockZone: () => void;
  setGuideEnabled: (value: boolean) => void;
  setAnnotationsEnabled: (value: boolean) => void;
  setConsoleOpen: (value: boolean) => void;
  toggleConsole: () => void;
  setConsoleMode: (mode: ConsoleMode) => void;
  setConsoleHeight: (height: number) => void;
  setConsoleSeed: (command: string | null) => void;
  setPaletteOpen: (value: boolean) => void;
};

export const useUiPrefs = create<UiPrefsState>()(
  persist(
    (set, get) => ({
      navCollapsed: false,
      clockZone: "IST",
      guideEnabled: true,
      annotationsEnabled: false,
      consoleOpen: false,
      consoleMode: "prisma",
      consoleHeight: 260,
      consoleSeed: null,
      paletteOpen: false,
      setNavCollapsed: (value) => set({ navCollapsed: value }),
      toggleNav: () => set({ navCollapsed: !get().navCollapsed }),
      setClockZone: (zone) => set({ clockZone: zone }),
      toggleClockZone: () =>
        set({ clockZone: get().clockZone === "IST" ? "UTC" : "IST" }),
      setGuideEnabled: (value) => set({ guideEnabled: value }),
      setAnnotationsEnabled: (value) => set({ annotationsEnabled: value }),
      setConsoleOpen: (value) => set({ consoleOpen: value }),
      toggleConsole: () => set({ consoleOpen: !get().consoleOpen }),
      setConsoleMode: (mode) => set({ consoleMode: mode }),
      setConsoleHeight: (height) =>
        set({ consoleHeight: Math.min(480, Math.max(160, height)) }),
      setConsoleSeed: (command) => set({ consoleSeed: command }),
      setPaletteOpen: (value) => set({ paletteOpen: value }),
    }),
    {
      name: "triage-ui-prefs",
      storage: createJSONStorage(() => safeStorage()),
      partialize: (state) => ({
        navCollapsed: state.navCollapsed,
        clockZone: state.clockZone,
        guideEnabled: state.guideEnabled,
        annotationsEnabled: state.annotationsEnabled,
      }),
    },
  ),
);
