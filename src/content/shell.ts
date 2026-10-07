/** Copy for app shell chrome. No em or en dashes. */

export const shellCopy = {
  productName: "Triage Console",
  tenant: "Acme Corp",
  engineerName: "Priya Nair",
  engineerRole: "Cloud Security TAC",
  searchPlaceholder: "Search tickets, users, IPs, rules",
  searchHint: "Cmd+K",
  guideOn: "Guide on",
  guideOff: "Guide off",
  annotationsOn: "Annotations on",
  annotationsOff: "Annotations off",
  notificationsEmpty: "No new customer replies",
  notificationsLabel: "Notifications",
  resetDemo: "Reset demo",
  signOut: "Sign out",
  collapseNav: "Collapse navigation",
  expandNav: "Expand navigation",
  consoleTitle: "Console",
  consolePlaceholder: "Type a command. Tab completes. ? lists commands.",
  consoleHint: "Ctrl+`",
  narrowScreen:
    "Triage Console is designed for a larger screen. Use 1280px width or above for the full mission control layout.",
  paletteEmpty: "No matches",
  palettePages: "Pages",
  paletteTickets: "Tickets",
  paletteUsers: "Users",
  paletteIps: "Addresses and IPs",
  paletteRules: "Security rules",
} as const;

export type NavItemId =
  | "home"
  | "tickets"
  | "logs"
  | "policies"
  | "objects"
  | "remote-networks"
  | "mobile-users"
  | "config-audit"
  | "troubleshooting"
  | "brief";

export type NavItem = {
  id: NavItemId;
  label: string;
  path: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", path: "/home" },
  { id: "tickets", label: "Tickets", path: "/tickets" },
  { id: "logs", label: "Logs", path: "/logs" },
  { id: "policies", label: "Policies", path: "/policies" },
  { id: "objects", label: "Objects", path: "/objects" },
  { id: "remote-networks", label: "Remote networks", path: "/remote-networks" },
  { id: "mobile-users", label: "Mobile users", path: "/mobile-users" },
  { id: "config-audit", label: "Config audit", path: "/config-audit" },
  { id: "troubleshooting", label: "Troubleshooting", path: "/troubleshooting" },
  { id: "brief", label: "Brief", path: "/brief" },
];
