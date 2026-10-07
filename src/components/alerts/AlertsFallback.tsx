import { ALERTS_COPY } from "@/content/alerts";
import { TableSkeleton } from "./TableSkeleton";

/** Shown while the client reads URL search params. */
export function AlertsFallback() {
  return (
    <section aria-labelledby="page-title" className="flex flex-col gap-3">
      <h1 id="page-title" className="text-[20px] font-semibold text-text">
        {ALERTS_COPY.title}
      </h1>
      <div className="rounded-lg border border-border bg-panel">
        <TableSkeleton />
      </div>
    </section>
  );
}
