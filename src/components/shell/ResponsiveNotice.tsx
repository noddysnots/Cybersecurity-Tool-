import { Monitor } from "lucide-react";
import { RESPONSIVE_NOTICE } from "@/content/shell";

export function ResponsiveNotice() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-panel px-4 py-2 text-[13px] text-muted-fg lg:hidden"
    >
      <Monitor className="size-4 shrink-0" aria-hidden="true" />
      <span>{RESPONSIVE_NOTICE}</span>
    </div>
  );
}
