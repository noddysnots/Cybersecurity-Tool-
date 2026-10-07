"use client";

import { CheckCircle2 } from "lucide-react";
import { CONFIG_FIX_COPY } from "@/content/resolve";
import { configDiffAfter, configDiffBefore } from "@/lib/resolve";
import { cn } from "@/lib/utils";

interface ConfigFixPanelProps {
  applied: boolean;
  onApply: () => void;
}

export function ConfigFixPanel({ applied, onApply }: ConfigFixPanelProps) {
  const lines = applied ? configDiffAfter() : configDiffBefore();

  return (
    <section aria-labelledby="resolve-config-fix" className="space-y-3">
      <div>
        <h2 id="resolve-config-fix" className="text-[13px] font-medium text-text">
          {CONFIG_FIX_COPY.title}
        </h2>
        <p className="mt-1 text-[12px] text-muted-fg">{CONFIG_FIX_COPY.intro}</p>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="bg-surface">
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 font-medium text-muted-fg">Setting</th>
              <th className="px-2 py-1.5 font-medium text-muted-fg">
                {CONFIG_FIX_COPY.branchLabel}
              </th>
              <th className="px-2 py-1.5 font-medium text-muted-fg">
                {CONFIG_FIX_COPY.prismaLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr
                key={line.key}
                className={cn(
                  "border-b border-border last:border-0",
                  line.mismatch && "bg-severity-high/10",
                )}
              >
                <td className="px-2 py-1.5 font-mono text-text">{line.key}</td>
                <td
                  className={cn(
                    "px-2 py-1.5 font-mono",
                    line.mismatch ? "font-medium text-severity-high" : "text-text",
                  )}
                >
                  {line.branch}
                </td>
                <td
                  className={cn(
                    "px-2 py-1.5 font-mono",
                    line.mismatch ? "font-medium text-severity-high" : "text-text",
                  )}
                >
                  {line.prisma}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-muted-fg">{CONFIG_FIX_COPY.mismatchHint}</p>
      <button
        type="button"
        onClick={onApply}
        disabled={applied}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px]",
          applied
            ? "border border-border bg-surface text-success"
            : "bg-accent text-white hover:opacity-90",
        )}
      >
        {applied ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : null}
        {applied ? CONFIG_FIX_COPY.applied : CONFIG_FIX_COPY.apply}
      </button>
    </section>
  );
}
