import {
  ALERTS_COPY,
  CATEGORY_LABELS,
  FILTER_ANY,
  FILTER_LABELS,
  RANGE_OPTIONS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "@/content/alerts";
import { USER_NAME } from "@/content/shell";
import {
  CATEGORIES,
  SEVERITIES,
  STATUSES,
  UNASSIGNED,
  type AlertFilters,
  type RangeValue,
} from "@/lib/alerts";
import { SearchInput } from "./SearchInput";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

function FilterSelect({ label, value, onChange, children }: FilterSelectProps) {
  return (
    <label className="flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-md border border-border bg-panel px-2 text-[13px] text-text"
      >
        {children}
      </select>
    </label>
  );
}

interface FilterBarProps {
  filters: AlertFilters;
  assignees: string[];
  searchKey: number;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onChange: (patch: Partial<AlertFilters>) => void;
}

export function FilterBar({ filters, assignees, searchKey, searchRef, onChange }: FilterBarProps) {
  return (
    <div role="group" aria-label={ALERTS_COPY.filtersLabel} className="flex flex-wrap items-center gap-2">
      <SearchInput
        key={searchKey}
        initialValue={filters.q}
        inputRef={searchRef}
        onSearch={(q) => onChange({ q })}
      />
      <FilterSelect
        label={FILTER_LABELS.severity}
        value={filters.severity ?? ""}
        onChange={(v) => onChange({ severity: SEVERITIES.find((s) => s === v) })}
      >
        <option value="">{FILTER_ANY.severity}</option>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {SEVERITY_LABELS[s]}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={FILTER_LABELS.status}
        value={filters.status ?? ""}
        onChange={(v) => onChange({ status: STATUSES.find((s) => s === v) })}
      >
        <option value="">{FILTER_ANY.status}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={FILTER_LABELS.category}
        value={filters.category ?? ""}
        onChange={(v) => onChange({ category: CATEGORIES.find((c) => c === v) })}
      >
        <option value="">{FILTER_ANY.category}</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={FILTER_LABELS.range}
        value={filters.range}
        onChange={(v) =>
          onChange({ range: RANGE_OPTIONS.find((o) => o.value === v)?.value as RangeValue })
        }
      >
        {RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={FILTER_LABELS.assignee}
        value={filters.assignee ?? ""}
        onChange={(v) => onChange({ assignee: v || undefined })}
      >
        <option value="">{FILTER_ANY.assignee}</option>
        <option value={UNASSIGNED}>{ALERTS_COPY.unassigned}</option>
        {assignees.map((name) => (
          <option key={name} value={name}>
            {name === USER_NAME ? `${name} (${ALERTS_COPY.youSuffix})` : name}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}
