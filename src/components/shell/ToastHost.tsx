import { useToast } from "@/lib/toast";

export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  const dismissToast = useToast((s) => s.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[80] flex w-[320px] flex-col gap-2"
      data-testid="toast-host"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-[var(--radius-panel)] border border-border bg-surface-2 px-4 py-3 text-sm text-text shadow-lg"
          data-testid="toast"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              className="text-xs text-text-faint hover:text-text"
              aria-label="Dismiss toast"
              onClick={() => dismissToast(toast.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
