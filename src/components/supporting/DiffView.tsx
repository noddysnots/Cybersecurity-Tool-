import { configAuditCopy } from "@/content/supporting";
import { cn } from "@/lib/utils";

type DiffViewProps = {
  before: string;
  after: string;
  testId?: string;
};

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export function DiffView({ before, after, testId = "diff-view" }: DiffViewProps) {
  const multi = looksLikeJson(before) || looksLikeJson(after) || before.includes("\n") || after.includes("\n");

  return (
    <div
      className={cn(
        "grid gap-3",
        multi ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
      )}
      data-testid={testId}
    >
      <div className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-3">
        <p className="text-xs text-text-faint">{configAuditCopy.before}</p>
        <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-text">
          {before || "(empty)"}
        </pre>
      </div>
      <div className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-3">
        <p className="text-xs text-text-faint">{configAuditCopy.after}</p>
        <pre
          className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-signal"
          data-testid={`${testId}-after`}
        >
          {after || "(empty)"}
        </pre>
      </div>
    </div>
  );
}
