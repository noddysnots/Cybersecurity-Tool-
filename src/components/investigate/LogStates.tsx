"use client";

import { TABLE_COPY } from "@/content/investigate";

export function LogSkeleton() {
  return (
    <div
      role="status"
      aria-label={TABLE_COPY.loadingLabel}
      className="space-y-2 p-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-md bg-surface" />
      ))}
    </div>
  );
}

interface LogEmptyProps {
  onWiden?: () => void;
  onClearQuery: () => void;
  canWiden: boolean;
}

export function LogEmpty({ onWiden, onClearQuery, canWiden }: LogEmptyProps) {
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <div>
        <p className="text-sm font-medium text-text">{TABLE_COPY.emptyTitle}</p>
        <p className="mt-1 text-[13px] text-muted-fg">{TABLE_COPY.emptyBody}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canWiden && onWiden ? (
          <button
            type="button"
            onClick={onWiden}
            className="rounded-md bg-accent px-3 py-1.5 text-[13px] text-white hover:opacity-90"
          >
            {TABLE_COPY.widen}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClearQuery}
          className="rounded-md border border-border px-3 py-1.5 text-[13px] text-text hover:bg-surface"
        >
          {TABLE_COPY.clearQuery}
        </button>
      </div>
    </div>
  );
}

export function LogError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 p-6" role="alert">
      <div>
        <p className="text-sm font-medium text-text">{TABLE_COPY.errorTitle}</p>
        <p className="mt-1 text-[13px] text-muted-fg">{TABLE_COPY.errorBody}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-accent px-3 py-1.5 text-[13px] text-white hover:opacity-90"
      >
        {TABLE_COPY.retry}
      </button>
    </div>
  );
}
