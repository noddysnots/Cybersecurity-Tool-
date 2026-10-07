"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { RESOLVE_COPY } from "@/content/resolve";
import { cn } from "@/lib/utils";
import type { VerifyResult } from "@/lib/resolve";

interface VerifyStepProps {
  result: VerifyResult | null;
  onRun: () => void;
  busy?: boolean;
}

export function VerifyStep({ result, onRun, busy = false }: VerifyStepProps) {
  return (
    <section
      aria-labelledby="resolve-verify"
      data-guide-id="guide-verify"
      className="rounded-lg border border-border bg-panel p-4"
    >
      <h2 id="resolve-verify" className="text-[13px] font-medium text-text">
        {RESOLVE_COPY.verifyTitle}
      </h2>
      <p className="mt-1 text-[12px] text-muted-fg">{RESOLVE_COPY.verifyIdle}</p>
      <button
        type="button"
        onClick={onRun}
        disabled={busy}
        className="mt-3 rounded-md bg-accent px-3 py-1.5 text-[13px] text-white hover:opacity-90 disabled:opacity-50"
      >
        {result ? RESOLVE_COPY.verifyRerun : RESOLVE_COPY.verifyRun}
      </button>
      {result ? (
        <div
          role="status"
          className={cn(
            "mt-3 rounded-md border p-3",
            result.passed
              ? "border-success/40 bg-success/5"
              : "border-severity-critical/40 bg-severity-critical/5",
          )}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-[13px] font-medium",
              result.passed ? "text-success" : "text-severity-critical",
            )}
          >
            {result.passed ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <XCircle className="size-4" aria-hidden="true" />
            )}
            {result.passed ? RESOLVE_COPY.verifyPass : RESOLVE_COPY.verifyFail}
          </p>
          <p className="mt-1 text-[12px] text-muted-fg">
            {result.passed ? RESOLVE_COPY.verifyPassHint : RESOLVE_COPY.verifyFailHint}
          </p>
          <p className="mt-2 text-[11px] text-muted-fg">{RESOLVE_COPY.verifyCommandLabel}</p>
          <pre className="mt-0.5 overflow-x-auto font-mono text-[11px] text-text">
            {result.command}
          </pre>
          <pre className="mt-2 max-h-40 overflow-auto rounded border border-border bg-console p-2 font-mono text-[11px] text-console-text">
            {result.output}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
