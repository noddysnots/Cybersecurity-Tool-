"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { DRAWER_COPY, LOG_FIELD_LABELS, LOG_TYPE_LABELS } from "@/content/investigate";
import { formatAbsolute, type TimezoneMode } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { LogRecord } from "@/types";

const FIELD_ORDER = [
  "id",
  "type",
  "time",
  "srcIp",
  "dstIp",
  "srcUser",
  "dstPort",
  "app",
  "rule",
  "action",
  "urlCategory",
  "threatName",
  "severity",
  "sessionEndReason",
  "bytesSent",
  "bytesReceived",
  "device",
  "location",
  "url",
  "message",
] as const;

interface LogDetailDrawerProps {
  log: LogRecord | null;
  timezone: TimezoneMode;
  canPin: boolean;
  pinned: boolean;
  onClose: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onCopy: (label: string, value: string) => void;
}

export function LogDetailDrawer({
  log,
  timezone,
  canPin,
  pinned,
  onClose,
  onPin,
  onUnpin,
  onCopy,
}: LogDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = Boolean(log);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open, log?.id]);

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-panel shadow-[var(--shadow-float)] transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "translate-x-full",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={DRAWER_COPY.label}
      aria-hidden={!open}
    >
      {log ? (
        <>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-medium text-text">{DRAWER_COPY.title}</h2>
              <p className="font-mono text-[12px] text-muted-fg">
                {LOG_TYPE_LABELS[log.type]} · {formatAbsolute(log.time, timezone, "HH:mm:ss")}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={DRAWER_COPY.close}
              className="rounded-md border border-border p-1.5 text-muted-fg hover:text-text"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
            <dl className="space-y-2">
              {FIELD_ORDER.map((key) => {
                const raw = log[key];
                if (raw === undefined || raw === "") return null;
                const value =
                  key === "time"
                    ? formatAbsolute(String(raw), timezone)
                    : key === "type"
                      ? LOG_TYPE_LABELS[log.type]
                      : String(raw);
                const mono =
                  key === "srcIp" ||
                  key === "dstIp" ||
                  key === "srcUser" ||
                  key === "rule" ||
                  key === "app" ||
                  key === "device" ||
                  key === "url" ||
                  key === "id" ||
                  key === "dstPort";
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[7.5rem_1fr_auto] items-start gap-2 border-b border-border/70 pb-2"
                  >
                    <dt className="text-[12px] text-muted-fg">{LOG_FIELD_LABELS[key] ?? key}</dt>
                    <dd className={cn("break-all text-[13px] text-text", mono && "font-mono")}>
                      {value}
                    </dd>
                    <button
                      type="button"
                      aria-label={DRAWER_COPY.copyField(LOG_FIELD_LABELS[key] ?? key)}
                      onClick={() => onCopy(LOG_FIELD_LABELS[key] ?? key, value)}
                      className="text-[11px] text-accent hover:underline"
                    >
                      {DRAWER_COPY.copy}
                    </button>
                  </div>
                );
              })}
            </dl>
          </div>
          <div className="border-t border-border px-4 py-3">
            {canPin ? (
              <button
                type="button"
                onClick={pinned ? onUnpin : onPin}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-[13px]",
                  pinned
                    ? "border border-border text-text hover:bg-surface"
                    : "bg-accent text-white hover:opacity-90",
                )}
              >
                {pinned ? DRAWER_COPY.unpin : DRAWER_COPY.pin}
              </button>
            ) : (
              <p className="text-center text-[12px] text-muted-fg">{DRAWER_COPY.pinUnavailable}</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
