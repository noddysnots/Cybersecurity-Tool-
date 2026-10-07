import { auditCopy } from "@/content/audit";
import type { AuditEntry } from "@/lib/case-engine";
import { formatAbsolute } from "@/lib/time";

type AuditTrailProps = {
  entries: AuditEntry[];
};

export function AuditTrail({ entries }: AuditTrailProps) {
  return (
    <section
      className="border-t border-border bg-surface-1"
      data-testid="audit-trail"
      aria-label={auditCopy.title}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="text-sm font-medium text-text">{auditCopy.title}</h2>
        <span className="font-mono text-xs text-text-faint">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className="px-4 py-3 text-xs text-text-faint">{auditCopy.empty}</p>
      ) : (
        <ul className="max-h-40 overflow-y-auto px-4 py-2">
          {[...entries].reverse().map((entry) => (
            <li
              key={entry.id}
              className="flex gap-3 border-b border-border/60 py-2 last:border-b-0"
              data-testid="audit-entry"
            >
              <time
                className="w-[148px] shrink-0 font-mono text-[11px] text-text-faint"
                dateTime={entry.at}
                title={formatAbsolute(new Date(entry.at), "UTC")}
              >
                {formatAbsolute(new Date(entry.at), "IST")}
              </time>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-muted">{entry.actorName}</p>
                <p className="text-sm text-text">{entry.action}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
