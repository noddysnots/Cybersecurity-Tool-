import { ALERTS_COPY } from "@/content/alerts";

const ROWS = 8;

/** Static placeholder rows. No animation, so nothing moves without a user action. */
export function TableSkeleton() {
  return (
    <div role="status" aria-label={ALERTS_COPY.loadingLabel} className="divide-y divide-border">
      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} className="flex h-12 items-center gap-4 px-3">
          <div className="h-3 w-20 rounded-sm bg-border" />
          <div className="h-3 w-64 rounded-sm bg-border" />
          <div className="h-3 w-40 rounded-sm bg-border" />
          <div className="h-3 w-16 rounded-sm bg-border" />
          <div className="h-3 w-20 rounded-sm bg-border" />
          <div className="h-3 w-24 rounded-sm bg-border" />
        </div>
      ))}
    </div>
  );
}
