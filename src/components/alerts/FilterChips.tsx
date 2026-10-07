import { X } from "lucide-react";
import {
  ALERTS_COPY,
  CATEGORY_LABELS,
  FILTER_LABELS,
  RANGE_OPTIONS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "@/content/alerts";
import { DEFAULT_FILTERS, UNASSIGNED, type AlertFilters, type FilterKey } from "@/lib/alerts";

interface Chip {
  key: FilterKey;
  label: string;
}

function buildChips(filters: AlertFilters): Chip[] {
  const chips: Chip[] = [];
  if (filters.severity) {
    chips.push({ key: "severity", label: `${FILTER_LABELS.severity}: ${SEVERITY_LABELS[filters.severity]}` });
  }
  if (filters.status) {
    chips.push({ key: "status", label: `${FILTER_LABELS.status}: ${STATUS_LABELS[filters.status]}` });
  }
  if (filters.category) {
    chips.push({ key: "category", label: `${FILTER_LABELS.category}: ${CATEGORY_LABELS[filters.category]}` });
  }
  if (filters.range !== DEFAULT_FILTERS.range) {
    const range = RANGE_OPTIONS.find((o) => o.value === filters.range)?.label ?? filters.range;
    chips.push({ key: "range", label: `${FILTER_LABELS.range}: ${range}` });
  }
  if (filters.assignee) {
    const name = filters.assignee === UNASSIGNED ? ALERTS_COPY.unassigned : filters.assignee;
    chips.push({ key: "assignee", label: `${FILTER_LABELS.assignee}: ${name}` });
  }
  if (filters.q) chips.push({ key: "q", label: `${FILTER_LABELS.q}: ${filters.q}` });
  return chips;
}

interface FilterChipsProps {
  filters: AlertFilters;
  onRemove: (key: FilterKey) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;
  return (
    <ul aria-label={ALERTS_COPY.activeFiltersLabel} className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <li key={chip.key}>
          <span className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-panel pl-2 pr-1 text-[12px] text-text">
            {chip.label}
            <button
              type="button"
              aria-label={ALERTS_COPY.removeFilter(chip.label)}
              onClick={() => onRemove(chip.key)}
              className="rounded-sm p-0.5 text-muted-fg hover:text-text"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={onClearAll}
          className="h-6 rounded-md px-1.5 text-[12px] text-accent hover:underline"
        >
          {ALERTS_COPY.clearAll}
        </button>
      </li>
    </ul>
  );
}
