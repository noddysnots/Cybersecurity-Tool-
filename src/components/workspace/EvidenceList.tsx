import { workspaceCopy } from "@/content/workspace";
import type { Evidence } from "@/types";

type EvidenceListProps = {
  items: Evidence[];
};

export function EvidenceList({ items }: EvidenceListProps) {
  return (
    <div className="border-t border-border px-3 py-2" data-testid="evidence-list">
      <h3 className="text-xs font-medium text-text-muted">{workspaceCopy.evidenceTitle}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-text-faint">{workspaceCopy.evidenceEmpty}</p>
      ) : (
        <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="truncate rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-text"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
