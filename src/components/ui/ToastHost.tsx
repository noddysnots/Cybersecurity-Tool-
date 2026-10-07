"use client";

import { X } from "lucide-react";
import { TOAST_HOST_COPY } from "@/content/shell";
import { useAppStore } from "@/lib/store";

/** Fixed bottom toasts. Auto dismiss is handled in the store. */
export function ToastHost() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-[13px] text-text shadow-[var(--shadow-float)]"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label={TOAST_HOST_COPY.dismiss}
            onClick={() => dismissToast(toast.id)}
            className="rounded-md p-0.5 text-muted-fg hover:text-text"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
