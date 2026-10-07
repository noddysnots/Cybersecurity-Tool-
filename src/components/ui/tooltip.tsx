import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

/** Lightweight tooltip for disabled controls and short hints. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "floating-shadow pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max max-w-[220px] -translate-x-1/2 rounded-[var(--radius-control)] border border-border bg-surface-3 px-2.5 py-1.5 text-xs text-text backdrop-blur-sm transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {content}
      </span>
    </span>
  );
}
