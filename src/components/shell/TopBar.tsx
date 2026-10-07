import {
  Bell,
  Building2,
  ChevronDown,
  MapPin,
  Search,
  StickyNote,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { shellCopy } from "@/content/shell";
import { useAuthStore } from "@/lib/auth";
import { useCaseEngine } from "@/lib/case-engine";
import { getNotificationCount } from "@/lib/home-metrics";
import { formatDemoClock } from "@/lib/time";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

export function TopBar() {
  const navigate = useNavigate();
  const clockZone = useUiPrefs((s) => s.clockZone);
  const toggleClockZone = useUiPrefs((s) => s.toggleClockZone);
  const guideEnabled = useUiPrefs((s) => s.guideEnabled);
  const setGuideEnabled = useUiPrefs((s) => s.setGuideEnabled);
  const annotationsEnabled = useUiPrefs((s) => s.annotationsEnabled);
  const setAnnotationsEnabled = useUiPrefs((s) => s.setAnnotationsEnabled);
  const setPaletteOpen = useUiPrefs((s) => s.setPaletteOpen);
  const resetDemo = useCaseEngine((s) => s.resetDemo);
  const signOut = useAuthStore((s) => s.signOut);
  const tickets = useCaseEngine((s) => s.tickets);
  const notifyCount = getNotificationCount();
  void tickets;

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(target)) {
        setNotifyOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    navigate("/login", { replace: true });
  };

  const handleReset = () => {
    resetDemo();
    setMenuOpen(false);
  };

  return (
    <header
      data-testid="top-bar"
      className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface-1 px-4"
    >
      <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 py-1.5">
        <Building2 className="h-3.5 w-3.5 text-accent" aria-hidden />
        <span className="truncate text-sm text-text" data-testid="tenant-switcher">
          {shellCopy.tenant}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-left text-sm text-text-muted hover:border-border-strong hover:text-text"
        data-testid="open-palette"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{shellCopy.searchPlaceholder}</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 font-mono text-xs text-text-faint sm:inline">
          {shellCopy.searchHint}
        </kbd>
      </button>

      <button
        type="button"
        onClick={toggleClockZone}
        className="hidden h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 font-mono text-xs text-text-muted hover:text-text md:inline-flex"
        data-testid="demo-clock"
        aria-label={`Demo clock ${clockZone}. Click to toggle IST and UTC.`}
        title="Toggle IST / UTC"
      >
        <MapPin className="h-3.5 w-3.5 text-text-faint" aria-hidden />
        {formatDemoClock(clockZone)}
      </button>

      <button
        type="button"
        onClick={() => setGuideEnabled(!guideEnabled)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-sm",
          guideEnabled
            ? "border-accent/40 bg-surface-3 text-text"
            : "border-border bg-surface-2 text-text-muted",
        )}
        data-testid="guide-toggle"
        aria-pressed={guideEnabled}
        aria-label={guideEnabled ? shellCopy.guideOn : shellCopy.guideOff}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden lg:inline">Guide</span>
      </button>

      <button
        type="button"
        onClick={() => setAnnotationsEnabled(!annotationsEnabled)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-sm",
          annotationsEnabled
            ? "border-accent/40 bg-surface-3 text-text"
            : "border-border bg-surface-2 text-text-muted",
        )}
        data-testid="annotations-toggle"
        aria-pressed={annotationsEnabled}
        aria-label={
          annotationsEnabled ? shellCopy.annotationsOn : shellCopy.annotationsOff
        }
      >
        <StickyNote className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden lg:inline">Annotations</span>
      </button>

      <div className="relative" ref={notifyRef}>
        <button
          type="button"
          onClick={() => setNotifyOpen((v) => !v)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface-2 text-text-muted hover:text-text"
          aria-label={shellCopy.notificationsLabel}
          data-testid="notifications-bell"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {notifyCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-[10px] text-bg">
              {notifyCount}
            </span>
          ) : null}
        </button>
        {notifyOpen ? (
          <div className="floating-shadow absolute right-0 z-40 mt-2 w-72 rounded-[var(--radius-panel)] border border-border bg-surface-2 p-3">
            <p className="text-sm font-medium text-text">{shellCopy.notificationsLabel}</p>
            {notifyCount === 0 ? (
              <p className="mt-2 text-sm text-text-muted">{shellCopy.notificationsEmpty}</p>
            ) : (
              <p className="mt-2 text-sm text-text-muted">
                {notifyCount} new customer{" "}
                {notifyCount === 1 ? "reply" : "replies"} waiting in active tickets.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 text-sm text-text"
          data-testid="user-menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-xs text-accent">
            PN
          </span>
          <span className="hidden max-w-[8rem] truncate xl:inline">
            {shellCopy.engineerName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-text-faint" aria-hidden />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="floating-shadow absolute right-0 z-40 mt-2 w-56 rounded-[var(--radius-panel)] border border-border bg-surface-2 py-1"
            data-testid="user-menu-panel"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-sm text-text">{shellCopy.engineerName}</p>
              <p className="text-xs text-text-muted">{shellCopy.engineerRole}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-3"
              onClick={handleReset}
              data-testid="reset-demo"
            >
              {shellCopy.resetDemo}
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-3"
              onClick={handleSignOut}
              data-testid="sign-out"
            >
              {shellCopy.signOut}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
