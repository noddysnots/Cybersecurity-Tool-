"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog } from "@base-ui/react/dialog";
import { PALETTE } from "@/content/shell";
import { useAppStore } from "@/lib/store";
import { NAV_ICONS } from "./nav-items";
import { useNavHrefs } from "./use-nav-hrefs";

const itemClass =
  "flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-[13px] text-text data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground";

export function CommandPalette() {
  const router = useRouter();
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const items = useNavHrefs();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useAppStore.getState().setPaletteOpen(!useAppStore.getState().paletteOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-nav/50" />
        <Dialog.Popup className="fixed left-1/2 top-24 w-[32rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-panel shadow-[var(--shadow-float)]">
          <Dialog.Title className="sr-only">{PALETTE.label}</Dialog.Title>
          <Command label={PALETTE.label}>
            <Command.Input
              placeholder={PALETTE.placeholder}
              className="h-11 w-full border-b border-border bg-transparent px-3 text-[14px] text-text outline-none placeholder:text-muted-fg"
            />
            <Command.List className="max-h-72 overflow-auto p-1">
              <Command.Empty className="px-2 py-6 text-center text-[13px] text-muted-fg">
                {PALETTE.empty}
              </Command.Empty>
              <Command.Group
                heading={PALETTE.navigationHeading}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-muted-fg"
              >
                {items.map((item) => {
                  const Icon = NAV_ICONS[item.id];
                  return (
                    <Command.Item
                      key={item.id}
                      value={item.label}
                      onSelect={() => go(item.href)}
                      className={itemClass}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
