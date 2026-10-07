"use client";

import { RESOLVE_COPY } from "@/content/resolve";
import type { FinalizeAction } from "@/lib/resolve";

interface ResolveFooterProps {
  action: FinalizeAction;
  enabled: boolean;
  disabledReason: string | null;
  onComplete: () => void;
}

export function ResolveFooter({
  action,
  enabled,
  disabledReason,
  onComplete,
}: ResolveFooterProps) {
  const label =
    action === "escalate" ? RESOLVE_COPY.escalateIr : RESOLVE_COPY.resolveAlert;

  const reasonText =
    disabledReason === "disabledNeedPackage"
      ? RESOLVE_COPY.disabledNeedPackage
      : disabledReason === "disabledNeedRootCause"
        ? RESOLVE_COPY.disabledNeedRootCause
        : disabledReason === "disabledNeedVerify"
          ? RESOLVE_COPY.disabledNeedVerify
          : null;

  return (
    <footer
      data-guide-id="guide-resolve-footer"
      className="flex flex-wrap items-center gap-3 border-t border-border bg-panel px-4 py-3"
    >
      <div className="relative group">
        <button
          type="button"
          onClick={onComplete}
          disabled={!enabled}
          title={!enabled && reasonText ? reasonText : undefined}
          aria-describedby={!enabled && reasonText ? "resolve-gate-hint" : undefined}
          className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {label}
        </button>
        {!enabled && reasonText ? (
          <p
            id="resolve-gate-hint"
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden max-w-xs rounded-md border border-border bg-panel px-2.5 py-1.5 text-[12px] text-text shadow-[var(--shadow-float)] group-hover:block group-focus-within:block"
          >
            {reasonText}
          </p>
        ) : null}
      </div>
      {!enabled && reasonText ? (
        <p className="text-[12px] text-muted-fg">{reasonText}</p>
      ) : null}
    </footer>
  );
}
