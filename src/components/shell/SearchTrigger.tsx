"use client";

import { Search } from "lucide-react";
import { PALETTE } from "@/content/shell";
import { useAppStore } from "@/lib/store";

export function SearchTrigger() {
  const setOpen = useAppStore((s) => s.setPaletteOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command palette"
      aria-keyshortcuts="Control+K Meta+K"
      className="flex h-8 w-64 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[13px] text-muted-fg hover:text-text"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">{PALETTE.trigger}</span>
      <kbd className="font-mono text-[12px]">Ctrl K</kbd>
    </button>
  );
}
