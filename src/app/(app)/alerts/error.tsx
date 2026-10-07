"use client";

import { ALERTS_COPY } from "@/content/alerts";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section role="alert" className="flex flex-col items-start gap-2">
      <h1 className="text-[20px] font-semibold text-text">{ALERTS_COPY.errorTitle}</h1>
      <p className="text-[13px] text-muted-fg">{ALERTS_COPY.errorBody}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="h-8 rounded-md bg-accent px-3 text-[13px] text-accent-foreground"
      >
        {ALERTS_COPY.retry}
      </button>
    </section>
  );
}
