import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { CommandPalette } from "@/components/shell/CommandPalette";
import { ConsoleDrawer } from "@/components/shell/ConsoleDrawer";
import { LeftNav } from "@/components/shell/LeftNav";
import { TopBar } from "@/components/shell/TopBar";
import { shellCopy } from "@/content/shell";
import { useUiPrefs } from "@/lib/ui-prefs";

export function AppShell() {
  const toggleConsole = useUiPrefs((s) => s.toggleConsole);
  const setPaletteOpen = useUiPrefs((s) => s.setPaletteOpen);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "`") {
        event.preventDefault();
        toggleConsole();
        return;
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleConsole, setPaletteOpen]);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-bg text-text" data-testid="app-shell">
      <div className="flex min-h-0 flex-1">
        <LeftNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="border-b border-border bg-surface-2 px-4 py-2 text-sm text-text-muted lg:hidden">
            {shellCopy.narrowScreen}
          </div>
          <main className="min-h-0 flex-1 overflow-auto" data-testid="app-main">
            <Outlet />
          </main>
          <ConsoleDrawer />
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
