import {
  Bell,
  FileText,
  Network,
  ScrollText,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { NavItemId } from "@/content/shell";

export const NAV_ICONS: Record<NavItemId, LucideIcon> = {
  alerts: Bell,
  investigate: Search,
  logs: ScrollText,
  policies: ShieldCheck,
  networks: Network,
  brief: FileText,
};
