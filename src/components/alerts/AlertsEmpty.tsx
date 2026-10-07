import { SearchX } from "lucide-react";
import { ALERTS_COPY } from "@/content/alerts";

export function AlertsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <SearchX className="size-6 text-muted-fg" aria-hidden="true" />
      <h2 className="text-[14px] font-semibold text-text">{ALERTS_COPY.emptyTitle}</h2>
      <p className="text-[13px] text-muted-fg">{ALERTS_COPY.emptyBody}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-1 h-8 rounded-md bg-accent px-3 text-[13px] text-accent-foreground"
      >
        {ALERTS_COPY.clearFilters}
      </button>
    </div>
  );
}
