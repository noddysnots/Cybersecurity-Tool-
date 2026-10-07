import {
  Briefcase,
  ClipboardList,
  FileSearch,
  Home,
  Laptop,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Shield,
  Wrench,
  Boxes,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { NAV_ITEMS, shellCopy, type NavItemId } from "@/content/shell";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

const ICONS: Record<NavItemId, LucideIcon> = {
  home: Home,
  tickets: Briefcase,
  logs: ScrollText,
  policies: Shield,
  objects: Boxes,
  "remote-networks": Network,
  "mobile-users": Laptop,
  "config-audit": ClipboardList,
  troubleshooting: Wrench,
  brief: FileSearch,
};

export function LeftNav() {
  const collapsed = useUiPrefs((s) => s.navCollapsed);
  const toggleNav = useUiPrefs((s) => s.toggleNav);

  return (
    <aside
      data-testid="left-nav"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-surface-1 transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between gap-2",
        )}
      >
        {!collapsed ? (
          <span className="truncate text-sm font-medium text-text">
            {shellCopy.productName}
          </span>
        ) : null}
        <button
          type="button"
          onClick={toggleNav}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-text-muted hover:bg-surface-2 hover:text-text"
          aria-label={collapsed ? shellCopy.expandNav : shellCopy.collapseNav}
          data-testid="nav-collapse"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={item.label}
              data-testid={`nav-${item.id}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-surface-3 text-text"
                    : "text-text-muted hover:bg-surface-2 hover:text-text",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {collapsed ? <span className="sr-only">{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
