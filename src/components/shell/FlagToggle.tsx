"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlagToggleProps {
  label: string;
  icon: LucideIcon;
  on: boolean;
  onChange: (on: boolean) => void;
}

/** Labelled on/off toggle used for Guide and Annotations. State is text plus aria-pressed, not color alone. */
export function FlagToggle({ label, icon: Icon, on, onChange }: FlagToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px]",
        on
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border text-text hover:bg-surface",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{label}</span>
      <span className="text-[12px] opacity-80">{on ? "On" : "Off"}</span>
    </button>
  );
}
