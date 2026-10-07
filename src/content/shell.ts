import type { ScenarioId } from "@/types";

export const APP_NAME = "Triage Console";
export const TENANT_NAME = "Acme Corp";
export const AUTHOR_LINE = "Built by Sarthak Pant";

export const NAV_ITEMS = [
  { id: "alerts", label: "Alerts", href: "/alerts" },
  { id: "investigate", label: "Investigate", href: "/investigate" },
  { id: "logs", label: "Logs", href: "/logs" },
  { id: "policies", label: "Policies", href: "/policies" },
  { id: "networks", label: "Remote networks", href: "/networks" },
  { id: "brief", label: "Brief", href: "/brief" },
] as const;

export type NavItemId = (typeof NAV_ITEMS)[number]["id"];

export const USER_NAME = "Priya Nair";

export const SPLASH_HINT = "Press any key or click to continue";

export const START_COPY = {
  heading: "Pick a case to work",
  intro:
    "Each case opens a real investigation with Guide on. You can turn Guide off at any time.",
  explore: "Explore freely",
  exploreHint: "Go to the alerts queue with no guidance.",
} as const;

export interface ScenarioCard {
  id: ScenarioId;
  alertId: string;
  title: string;
  situation: string;
}

/** One line each, phrased as the engineer would hear it. Never states the cause. */
export const SCENARIO_CARDS: readonly ScenarioCard[] = [
  {
    id: "A",
    alertId: "ALR-1042",
    title: "Salesforce will not load",
    situation:
      "A mobile user in Mumbai cannot reach Salesforce. Helpdesk forwarded the ticket.",
  },
  {
    id: "B",
    alertId: "ALR-1037",
    title: "Pune branch is offline",
    situation:
      "Remote network Pune-Branch-01 reports the tunnel is down after a change window.",
  },
  {
    id: "C",
    alertId: "ALR-1049",
    title: "Odd traffic from production",
    situation:
      "Threat logs show command and control traffic from a production API host.",
  },
];

export const RESPONSIVE_NOTICE = "Best on a larger screen. Some views are cramped below 1024 pixels.";

export const PLACEHOLDERS = {
  alerts: {
    title: "Alerts",
    body: "The alerts queue arrives in the next phase.",
  },
  investigate: {
    title: "Investigate",
    body: "The investigation workspace arrives in a later phase.",
  },
  logs: { title: "Logs", body: "The full log viewer arrives in a later phase." },
  policies: {
    title: "Policies",
    body: "Read-only policy lists arrive in a later phase.",
  },
  networks: {
    title: "Remote networks",
    body: "Read-only remote network lists arrive in a later phase.",
  },
  brief: { title: "Brief", body: "Unused after Phase 8; BriefPage owns the route." },
} as const;

export const PALETTE = {
  label: "Command palette",
  placeholder: "Go to a page",
  empty: "No matching pages.",
  navigationHeading: "Navigation",
  trigger: "Search",
} as const;

export const SHORTCUTS_COPY = {
  title: "Keyboard shortcuts",
  close: "Close shortcuts",
  hint: "Press ? for shortcuts",
  groups: [
    {
      heading: "Global",
      items: [
        { keys: "?", action: "Open this shortcuts sheet" },
        { keys: "Cmd/Ctrl+K", action: "Command palette" },
        { keys: "Ctrl+`", action: "Toggle console" },
        { keys: "Esc", action: "Close drawer, palette, or sheet" },
      ],
    },
    {
      heading: "Lists and logs",
      items: [
        { keys: "/", action: "Focus search or query bar" },
        { keys: "j / k", action: "Move selection down or up" },
        { keys: "Enter", action: "Open selected row" },
        { keys: "p", action: "Pin selected log as evidence" },
      ],
    },
  ],
} as const;

export const USER_MENU_COPY = {
  menuLabel: "User menu",
  resetDemo: "Reset demo",
  resetToast: "Demo reset",
} as const;

export const TOAST_HOST_COPY = {
  dismiss: "Dismiss notification",
} as const;

export const TOP_BAR_COPY = {
  timezoneLabel: "Time zone",
  themeToDark: "Switch to dark theme",
  themeToLight: "Switch to light theme",
  guide: "Guide",
  annotations: "Annotations",
} as const;
