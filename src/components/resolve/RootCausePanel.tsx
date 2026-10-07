"use client";

import { RESOLVE_COPY, ROOT_CAUSE_OPTIONS } from "@/content/resolve";
import type { RootCauseKind } from "@/types";

interface RootCausePanelProps {
  kind: RootCauseKind | null;
  text: string;
  onKindChange: (kind: RootCauseKind) => void;
  onTextChange: (text: string) => void;
  onTextBlur?: () => void;
}

export function RootCausePanel({
  kind,
  text,
  onKindChange,
  onTextChange,
  onTextBlur,
}: RootCausePanelProps) {
  return (
    <section
      aria-labelledby="resolve-root-cause"
      data-guide-id="guide-root-cause"
      className="rounded-lg border border-border bg-panel p-4"
    >
      <h2 id="resolve-root-cause" className="text-[13px] font-medium text-text">
        {RESOLVE_COPY.rootCauseTitle}
      </h2>
      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">{RESOLVE_COPY.rootCauseKindLabel}</legend>
        {ROOT_CAUSE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-[13px] text-text"
          >
            <input
              type="radio"
              name="root-cause-kind"
              value={option.id}
              checked={kind === option.id}
              onChange={() => onKindChange(option.id)}
              className="size-3.5 accent-[var(--accent)]"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className="mt-4 block">
        <span className="text-[12px] text-muted-fg">{RESOLVE_COPY.rootCauseTextLabel}</span>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={onTextBlur}
          rows={4}
          placeholder={RESOLVE_COPY.rootCauseTextPlaceholder}
          className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-[13px] text-text placeholder:text-muted-fg"
        />
      </label>
    </section>
  );
}
