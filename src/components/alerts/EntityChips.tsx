import { ALERTS_COPY } from "@/content/alerts";

const MAX_SHOWN = 3;

export function EntityChips({ entities }: { entities: string[] }) {
  const shown = entities.slice(0, MAX_SHOWN);
  const extra = entities.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((entity) => (
        <span
          key={entity}
          className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[12px] text-text"
        >
          {entity}
        </span>
      ))}
      {extra > 0 ? (
        <span className="text-[12px] text-muted-fg" title={entities.slice(MAX_SHOWN).join(", ")}>
          {ALERTS_COPY.moreEntities(extra)}
        </span>
      ) : null}
    </div>
  );
}
