"use client";

import { RESOLVE_COPY } from "@/content/resolve";

interface ClosureNoteProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClosureNote({ value, onChange }: ClosureNoteProps) {
  return (
    <section
      aria-labelledby="resolve-closure"
      data-guide-id="guide-closure"
      className="rounded-lg border border-border bg-panel p-4"
    >
      <h2 id="resolve-closure" className="text-[13px] font-medium text-text">
        {RESOLVE_COPY.closureTitle}
      </h2>
      <label className="mt-3 block">
        <span className="sr-only">{RESOLVE_COPY.closureLabel}</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 font-mono text-[12px] text-text"
        />
      </label>
    </section>
  );
}
