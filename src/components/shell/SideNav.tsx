"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/content/shell";
import { useAppStore } from "@/lib/store";
import { NAV_ICONS } from "./nav-items";
import { useNavHrefs } from "./use-nav-hrefs";

const itemBase =
  "flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium text-console-text/80 hover:bg-console-text/10 hover:text-console-text";

export function SideNav() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.navCollapsed);
  const setCollapsed = useAppStore((s) => s.setNavCollapsed);
  const items = useNavHrefs();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex shrink-0 flex-col bg-nav py-3",
        collapsed ? "w-14 px-2" : "w-52 px-2",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-9 items-center px-2.5 text-[14px] font-semibold text-console-text",
          collapsed && "sr-only",
        )}
      >
        {APP_NAME}
      </div>
      <ul className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const active = pathname.startsWith(item.matchPrefix);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  itemBase,
                  active && "bg-accent text-accent-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!collapsed}
        className={cn(itemBase, "w-full")}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
        )}
        {!collapsed && <span>Collapse</span>}
      </button>
    </nav>
  );
}
