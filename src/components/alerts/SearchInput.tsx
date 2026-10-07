"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { ALERTS_COPY } from "@/content/alerts";

interface SearchInputProps {
  initialValue: string;
  onSearch: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const DEBOUNCE_MS = 200;

/** Uncontrolled so typing never fights the URL. Remount with a new key to reset it. */
export function SearchInput({ initialValue, onSearch, inputRef }: SearchInputProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <label className="relative block w-72">
      <span className="sr-only">{ALERTS_COPY.searchLabel}</span>
      <Search
        className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-fg"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        defaultValue={initialValue}
        placeholder={ALERTS_COPY.searchPlaceholder}
        aria-keyshortcuts="/"
        onChange={(event) => {
          const value = event.target.value;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onSearch(value.trim()), DEBOUNCE_MS);
        }}
        className="h-8 w-full rounded-md border border-border bg-panel pl-8 pr-2 text-[13px] text-text placeholder:text-muted-fg"
      />
    </label>
  );
}
