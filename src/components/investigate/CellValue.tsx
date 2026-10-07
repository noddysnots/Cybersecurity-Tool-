"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CELL_MENU_COPY } from "@/content/investigate";
import { cn } from "@/lib/utils";
import type { LogRecord } from "@/types";
import type { CellActionHandlers, FilterableField } from "./columns";

interface CellValueProps {
  log: LogRecord;
  value: string;
  field: FilterableField;
  actions: CellActionHandlers;
}

export function CellValue({ log, value, field, actions }: CellValueProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pinned = actions.isPinned(log.id);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex max-w-full">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={CELL_MENU_COPY.menuLabel(value)}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "max-w-full truncate rounded-sm font-mono text-[13px] text-accent underline-offset-2 hover:underline",
          open && "bg-surface",
        )}
      >
        {value}
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] rounded-lg border border-border bg-panel py-1 shadow-[var(--shadow-float)]"
        >
          <MenuItem
            label={CELL_MENU_COPY.filterBy}
            onSelect={() => {
              actions.onFilter(field, value);
              setOpen(false);
            }}
          />
          <MenuItem
            label={CELL_MENU_COPY.exclude}
            onSelect={() => {
              actions.onExclude(field, value);
              setOpen(false);
            }}
          />
          <MenuItem
            label={CELL_MENU_COPY.copy}
            onSelect={() => {
              actions.onCopy(value);
              setOpen(false);
            }}
          />
          {actions.canPin ? (
            <MenuItem
              label={pinned ? CELL_MENU_COPY.unpin : CELL_MENU_COPY.pin}
              onSelect={() => {
                if (pinned) actions.onUnpin(log.id);
                else actions.onPin(log.id);
                setOpen(false);
              }}
            />
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function MenuItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className="flex w-full px-3 py-1.5 text-left text-[13px] text-text hover:bg-surface"
      >
        {label}
      </button>
    </li>
  );
}
