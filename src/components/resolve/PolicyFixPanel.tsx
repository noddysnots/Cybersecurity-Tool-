"use client";

import { CheckCircle2 } from "lucide-react";
import { POLICY_FIX_COPY } from "@/content/resolve";
import { policyRulesAfter, policyRulesBefore } from "@/lib/resolve";
import { cn } from "@/lib/utils";
import type { DecryptionRule } from "@/types";

interface PolicyFixPanelProps {
  staged: boolean;
  onStage: () => void;
}

function RuleTable({
  rules,
  label,
  highlightNew,
}: {
  rules: DecryptionRule[];
  label: string;
  highlightNew: boolean;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-[12px] font-medium text-muted-fg">{label}</p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="bg-surface">
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 font-medium text-muted-fg">#</th>
              <th className="px-2 py-1.5 font-medium text-muted-fg">Name</th>
              <th className="px-2 py-1.5 font-medium text-muted-fg">Category</th>
              <th className="px-2 py-1.5 font-medium text-muted-fg">Action</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => {
              const isNew = highlightNew && rule.name === POLICY_FIX_COPY.newRule;
              return (
                <tr
                  key={rule.id}
                  className={cn(
                    "border-b border-border last:border-0",
                    isNew && "bg-accent/10",
                  )}
                >
                  <td className="px-2 py-1.5 font-mono text-muted-fg">{rule.order}</td>
                  <td
                    className={cn(
                      "px-2 py-1.5 font-mono",
                      isNew ? "font-medium text-accent" : "text-text",
                    )}
                  >
                    {rule.name}
                    {isNew ? (
                      <span className="ml-1.5 font-sans text-[11px] text-accent">
                        (new)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-muted-fg">{rule.urlCategory}</td>
                  <td className="px-2 py-1.5 font-mono text-text">{rule.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PolicyFixPanel({ staged, onStage }: PolicyFixPanelProps) {
  const before = policyRulesBefore();
  const after = policyRulesAfter();

  return (
    <section aria-labelledby="resolve-policy-fix" className="space-y-3">
      <div>
        <h2 id="resolve-policy-fix" className="text-[13px] font-medium text-text">
          {POLICY_FIX_COPY.title}
        </h2>
        <p className="mt-1 text-[12px] text-muted-fg">{POLICY_FIX_COPY.intro}</p>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row">
        <RuleTable rules={before} label={POLICY_FIX_COPY.beforeLabel} highlightNew={false} />
        <RuleTable rules={after} label={POLICY_FIX_COPY.afterLabel} highlightNew />
      </div>
      <p className="text-[12px] text-muted-fg">{POLICY_FIX_COPY.highlightHint}</p>
      <button
        type="button"
        onClick={onStage}
        disabled={staged}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px]",
          staged
            ? "border border-border bg-surface text-success"
            : "bg-accent text-white hover:opacity-90",
        )}
      >
        {staged ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : null}
        {staged ? POLICY_FIX_COPY.staged : POLICY_FIX_COPY.stage}
      </button>
    </section>
  );
}
