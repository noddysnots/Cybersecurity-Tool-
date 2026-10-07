"use client";

import { useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { SHORTCUTS_COPY } from "@/content/shell";
import { useAppStore } from "@/lib/store";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, select, textarea, [role='combobox']") !== null
  );
}

/** Shortcut sheet on ?. Skipped while typing in inputs or the console. */
export function ShortcutSheet() {
  const open = useAppStore((s) => s.shortcutsOpen);
  const setOpen = useAppStore((s) => s.setShortcutsOpen);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "?" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      // Console help owns ? when the console command input is focused (covered above).
      // Also skip when the engineer is mid-command in a contenteditable console block.
      if (document.getElementById("console-command-input") === document.activeElement) return;
      event.preventDefault();
      const state = useAppStore.getState();
      if (state.paletteOpen) return;
      state.setShortcutsOpen(!state.shortcutsOpen);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-nav/50" />
        <Dialog.Popup className="fixed left-1/2 top-24 w-[28rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-panel shadow-[var(--shadow-float)]">
          <Dialog.Title className="border-b border-border px-4 py-3 text-[14px] font-semibold text-text">
            {SHORTCUTS_COPY.title}
          </Dialog.Title>
          <Dialog.Description className="sr-only">{SHORTCUTS_COPY.hint}</Dialog.Description>
          <div className="max-h-[min(24rem,70vh)] space-y-4 overflow-auto p-4">
            {SHORTCUTS_COPY.groups.map((group, groupIndex) => (
              <section key={group.heading} aria-labelledby={`shortcut-group-${groupIndex}`}>
                <h3
                  id={`shortcut-group-${groupIndex}`}
                  className="mb-2 text-[12px] font-medium text-muted-fg"
                >
                  {group.heading}
                </h3>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item.keys}
                      className="flex items-baseline justify-between gap-4 text-[13px]"
                    >
                      <span className="text-text">{item.action}</span>
                      <kbd className="shrink-0 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[12px] text-muted-fg">
                        {item.keys}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="border-t border-border px-4 py-2 text-right">
            <Dialog.Close
              className="h-8 rounded-md px-3 text-[13px] text-accent hover:underline"
            >
              {SHORTCUTS_COPY.close}
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
