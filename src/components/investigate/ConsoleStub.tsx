"use client";

import { CONSOLE_STUB_COPY } from "@/content/investigate";

/** Placeholder for Phase 5 console drawer. */
export function ConsoleStub() {
  return (
    <div className="border-t border-border bg-console px-4 py-2 text-[12px] text-console-text">
      <span className="font-medium">{CONSOLE_STUB_COPY.title}</span>
      <span className="mx-2 text-console-text/60">|</span>
      <span>{CONSOLE_STUB_COPY.body}</span>
    </div>
  );
}
