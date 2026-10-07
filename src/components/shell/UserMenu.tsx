"use client";

import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { RotateCcw, User } from "lucide-react";
import { USER_MENU_COPY, USER_NAME } from "@/content/shell";
import { useAppStore } from "@/lib/store";

export function UserMenu() {
  const router = useRouter();
  const resetDemo = useAppStore((s) => s.resetDemo);
  const pushToast = useAppStore((s) => s.pushToast);

  function handleReset() {
    resetDemo();
    pushToast(USER_MENU_COPY.resetToast);
    router.push("/");
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={USER_MENU_COPY.menuLabel}
        className="flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface"
      >
        <User className="size-4" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6}>
          <Menu.Popup className="min-w-44 rounded-lg border border-border bg-panel p-1 text-[13px] text-text shadow-[var(--shadow-float)]">
            <div className="px-2 py-1.5 text-[13px] font-medium">{USER_NAME}</div>
            <div role="separator" className="my-1 h-px bg-border" />
            <Menu.Item
              onClick={handleReset}
              className="flex h-8 cursor-default items-center gap-2 rounded-md px-2 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {USER_MENU_COPY.resetDemo}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
