import type { GuideActionId, LogType } from "@/types";

export const GUIDE_ACTION_EVENT = "triage-guide-action";

export interface GuideActionDetail {
  id: GuideActionId;
}

/** Dispatches a guide action for Investigate / Resolve / Console hosts to handle. */
export function requestGuideAction(id: GuideActionId): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GuideActionDetail>(GUIDE_ACTION_EVENT, { detail: { id } }),
  );
}

export function isGuideActionEvent(
  event: Event,
): event is CustomEvent<GuideActionDetail> {
  return event instanceof CustomEvent && event.type === GUIDE_ACTION_EVENT;
}

const TAB_ACTIONS: Partial<Record<GuideActionId, LogType>> = {
  "set-tab-traffic": "traffic",
  "set-tab-decryption": "decryption",
  "set-tab-url": "url",
  "set-tab-system": "system",
  "set-tab-config": "config",
  "set-tab-threat": "threat",
};

export function tabForGuideAction(id: GuideActionId): LogType | null {
  return TAB_ACTIONS[id] ?? null;
}

/** Stable demo log ids used by pin "Do it for me" actions. */
export const GUIDE_PIN_LOGS = {
  A: ["LOG-0444", "LOG-0445"] as const,
  B: ["LOG-0337", "LOG-0331"] as const,
  C: ["LOG-0225", "LOG-0227"] as const,
} as const;

export const GUIDE_CONSOLE_COMMANDS = {
  A: "test decryption-policy-match category business-and-economy from trust to untrust source 10.20.14.37 destination 13.110.54.20",
  B: "show vpn ike-sa gateway gw-prisma-pune",
  C: "show log threat src 10.40.2.15",
} as const;
