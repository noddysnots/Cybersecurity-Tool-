import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type {
  AlertOverride,
  AuditEvent,
  Density,
  EvidenceItem,
  GuideActionId,
  InvestigationView,
  ResolutionDraft,
  ScenarioFixes,
  ScenarioId,
  StepId,
} from "@/types";
import { getDemoClock, type TimezoneMode } from "@/lib/time";
import { USER_NAME } from "@/content/shell";
import { emptyResolutionDraft } from "@/lib/resolve";

export type Theme = "light" | "dark";

export interface Toast {
  id: number;
  message: string;
}

const TOAST_MS = 3500;
let toastCounter = 0;

export const STORAGE_PREFIX = "triage-console";
export const STORE_KEY = `${STORAGE_PREFIX}:app`;

interface PersistedState {
  timezone: TimezoneMode;
  guideOn: boolean;
  annotationsOn: boolean;
  theme: Theme;
  activeScenario: ScenarioId | null;
  splashSeen: boolean;
  navCollapsed: boolean;
  alertOverrides: Record<string, AlertOverride>;
  /** Investigation query, time window and tab, keyed by alert id (or "logs"). */
  views: Record<string, InvestigationView>;
  /** Pinned evidence in display order, keyed by alert id. */
  evidence: Record<string, EvidenceItem[]>;
  /** Steps the engineer finished, keyed by alert id. */
  stepsDone: Record<string, StepId[]>;
  density: Density;
  /** Column visibility keyed "<logType>.<columnId>". Missing means the column default. */
  columnVisibility: Record<string, boolean>;
  /** Column widths in px keyed by column id. */
  columnSizing: Record<string, number>;
  /** Scenario fixes applied on the resolve screen. Console verify commands read these. */
  scenarioFixes: ScenarioFixes;
  /** Resolution drafts keyed by alert id. */
  resolutions: Record<string, ResolutionDraft>;
  /** Audit trail entries keyed by alert id. */
  auditTrail: Record<string, AuditEvent[]>;
  /** Guide coach-mark index per scenario. Resume where left off. */
  guideProgress: Partial<Record<ScenarioId, number>>;
}

interface AppState extends PersistedState {
  /** Not persisted. True once saved state has been read on the client. */
  hydrated: boolean;
  /** Not persisted. */
  paletteOpen: boolean;
  /** Not persisted. Keyboard shortcuts sheet (?). */
  shortcutsOpen: boolean;
  /** Not persisted. Auto dismissed. */
  toasts: Toast[];
  /** Not persisted. Guide action waiting for the target screen to mount. */
  pendingGuideAction: GuideActionId | null;
  setTimezone: (timezone: TimezoneMode) => void;
  setGuideOn: (on: boolean) => void;
  setAnnotationsOn: (on: boolean) => void;
  setTheme: (theme: Theme) => void;
  setActiveScenario: (scenario: ScenarioId | null) => void;
  setSplashSeen: (seen: boolean) => void;
  setNavCollapsed: (collapsed: boolean) => void;
  setAlertOverride: (alertId: string, override: AlertOverride) => void;
  /** Merges a patch into the saved view. `base` is used when nothing is saved yet. */
  patchView: (key: string, patch: Partial<InvestigationView>, base: InvestigationView) => void;
  /** Returns false when the log was already pinned. */
  pinEvidence: (alertId: string, logId: string) => boolean;
  /** Returns false when this console command output was already pinned. */
  pinConsoleEvidence: (alertId: string, command: string, output: string) => boolean;
  unpinEvidence: (alertId: string, itemId: string) => void;
  moveEvidence: (alertId: string, itemId: string, direction: -1 | 1) => void;
  setScenarioFix: (scenarioId: ScenarioId, fixed: boolean) => void;
  setStepDone: (alertId: string, step: StepId, done: boolean) => void;
  patchResolution: (alertId: string, patch: Partial<ResolutionDraft>) => void;
  appendAudit: (alertId: string, action: string) => void;
  setGuideStep: (scenarioId: ScenarioId, index: number) => void;
  setPendingGuideAction: (action: GuideActionId | null) => void;
  setDensity: (density: Density) => void;
  setColumnVisible: (key: string, visible: boolean) => void;
  setColumnWidth: (columnId: string, width: number) => void;
  setPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => void;
}

export const DEFAULT_STATE: PersistedState = {
  timezone: "IST",
  guideOn: false,
  annotationsOn: false,
  theme: "light",
  activeScenario: null,
  splashSeen: false,
  navCollapsed: false,
  alertOverrides: {},
  views: {},
  evidence: {},
  stepsDone: {},
  density: "compact",
  columnVisibility: {},
  columnSizing: {},
  scenarioFixes: {},
  resolutions: {},
  auditTrail: {},
  guideProgress: {},
};

let auditCounter = 0;

/** Demo-clock timestamps that walk toward "now" as more events are added. */
function nextAuditAt(existingCount: number): string {
  const base = getDemoClock().getTime() - 12 * 60 * 1000;
  return new Date(base + existingCount * 50_000).toISOString();
}

/** localStorage that never throws (private mode, quota, SSR). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

/** Removes every key this app owns, including keys future phases add under the same prefix. */
export function clearSavedState(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function evidenceIdFor(logId: string): string {
  return `ev-${logId}`;
}

export function evidenceIdForConsole(command: string): string {
  const slug = command.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 64);
  return `ev-console-${slug}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      hydrated: false,
      paletteOpen: false,
      shortcutsOpen: false,
      toasts: [],
      pendingGuideAction: null,
      setTimezone: (timezone) => set({ timezone }),
      setGuideOn: (guideOn) => set({ guideOn }),
      setAnnotationsOn: (annotationsOn) => set({ annotationsOn }),
      setTheme: (theme) => set({ theme }),
      setActiveScenario: (activeScenario) => set({ activeScenario }),
      setSplashSeen: (splashSeen) => set({ splashSeen }),
      setNavCollapsed: (navCollapsed) => set({ navCollapsed }),
      setAlertOverride: (alertId, override) =>
        set((state) => ({
          alertOverrides: {
            ...state.alertOverrides,
            [alertId]: { ...state.alertOverrides[alertId], ...override },
          },
        })),
      patchView: (key, patch, base) =>
        set((state) => ({
          views: { ...state.views, [key]: { ...(state.views[key] ?? base), ...patch } },
        })),
      pinEvidence: (alertId, logId) => {
        const existing = get().evidence[alertId] ?? [];
        if (existing.some((item) => item.kind === "log" && item.logId === logId)) return false;
        const item: EvidenceItem = {
          id: evidenceIdFor(logId),
          kind: "log",
          logId,
          pinnedAt: getDemoClock().toISOString(),
        };
        set((state) => ({ evidence: { ...state.evidence, [alertId]: [...existing, item] } }));
        return true;
      },
      pinConsoleEvidence: (alertId, command, output) => {
        const id = evidenceIdForConsole(command);
        const existing = get().evidence[alertId] ?? [];
        if (existing.some((item) => item.id === id)) return false;
        const item: EvidenceItem = {
          id,
          kind: "console",
          command,
          output,
          pinnedAt: getDemoClock().toISOString(),
        };
        set((state) => ({ evidence: { ...state.evidence, [alertId]: [...existing, item] } }));
        return true;
      },
      unpinEvidence: (alertId, itemId) =>
        set((state) => ({
          evidence: {
            ...state.evidence,
            [alertId]: (state.evidence[alertId] ?? []).filter((item) => item.id !== itemId),
          },
        })),
      moveEvidence: (alertId, itemId, direction) =>
        set((state) => {
          const items = [...(state.evidence[alertId] ?? [])];
          const from = items.findIndex((item) => item.id === itemId);
          const to = from + direction;
          if (from < 0 || to < 0 || to >= items.length) return state;
          [items[from], items[to]] = [items[to], items[from]];
          return { evidence: { ...state.evidence, [alertId]: items } };
        }),
      setScenarioFix: (scenarioId, fixed) =>
        set((state) => ({
          scenarioFixes: { ...state.scenarioFixes, [scenarioId]: fixed },
        })),
      setStepDone: (alertId, step, done) =>
        set((state) => {
          const current = state.stepsDone[alertId] ?? [];
          const next = done
            ? current.includes(step)
              ? current
              : [...current, step]
            : current.filter((s) => s !== step);
          return { stepsDone: { ...state.stepsDone, [alertId]: next } };
        }),
      patchResolution: (alertId, patch) =>
        set((state) => {
          const current = state.resolutions[alertId] ?? emptyResolutionDraft();
          return {
            resolutions: {
              ...state.resolutions,
              [alertId]: { ...current, ...patch },
            },
          };
        }),
      appendAudit: (alertId, action) =>
        set((state) => {
          const existing = state.auditTrail[alertId] ?? [];
          auditCounter += 1;
          const event: AuditEvent = {
            id: `audit-${alertId}-${auditCounter}`,
            action,
            actor: USER_NAME,
            at: nextAuditAt(existing.length),
          };
          return {
            auditTrail: {
              ...state.auditTrail,
              [alertId]: [...existing, event],
            },
          };
        }),
      setGuideStep: (scenarioId, index) =>
        set((state) => ({
          guideProgress: { ...state.guideProgress, [scenarioId]: index },
        })),
      setPendingGuideAction: (pendingGuideAction) => set({ pendingGuideAction }),
      setDensity: (density) => set({ density }),
      setColumnVisible: (key, visible) =>
        set((state) => ({ columnVisibility: { ...state.columnVisibility, [key]: visible } })),
      setColumnWidth: (columnId, width) =>
        set((state) => ({ columnSizing: { ...state.columnSizing, [columnId]: width } })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
      pushToast: (message) => {
        toastCounter += 1;
        const id = toastCounter;
        set((state) => ({ toasts: [...state.toasts, { id, message }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, TOAST_MS);
      },
      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
      resetDemo: () => {
        set({
          ...DEFAULT_STATE,
          paletteOpen: false,
          shortcutsOpen: false,
          toasts: [],
          pendingGuideAction: null,
        });
        clearSavedState();
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state): PersistedState => ({
        timezone: state.timezone,
        guideOn: state.guideOn,
        annotationsOn: state.annotationsOn,
        theme: state.theme,
        activeScenario: state.activeScenario,
        splashSeen: state.splashSeen,
        navCollapsed: state.navCollapsed,
        alertOverrides: state.alertOverrides,
        views: state.views,
        evidence: state.evidence,
        stepsDone: state.stepsDone,
        density: state.density,
        columnVisibility: state.columnVisibility,
        columnSizing: state.columnSizing,
        scenarioFixes: state.scenarioFixes,
        resolutions: state.resolutions,
        auditTrail: state.auditTrail,
        guideProgress: state.guideProgress,
      }),
    },
  ),
);
