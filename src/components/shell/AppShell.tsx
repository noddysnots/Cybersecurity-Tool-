import { AnnotationsLayer } from "@/components/annotations";
import { GuideHost } from "@/components/guide";
import { ToastHost } from "@/components/ui/ToastHost";
import { CommandPalette } from "./CommandPalette";
import { ResponsiveNotice } from "./ResponsiveNotice";
import { ShortcutSheet } from "./ShortcutSheet";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface text-text">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <ResponsiveNotice />
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <CommandPalette />
      <ShortcutSheet />
      <ToastHost />
      <GuideHost />
      <AnnotationsLayer />
    </div>
  );
}
