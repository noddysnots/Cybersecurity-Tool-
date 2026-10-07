"use client";

import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ALERT_PRESETS, LOGS_PRESETS, TIME_COPY } from "@/content/investigate";
import {
  HOUR_MS,
  centeredWindow,
  histogramBins,
  histogramRange,
  incidentTime,
  type TimeWindow,
  toWindow,
} from "@/lib/logs";
import { formatAbsolute, getDemoClock, type TimezoneMode } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Alert, InvestigationView, LogRecord } from "@/types";

const BIN_COUNT = 48;

interface TimeScopeBarProps {
  alert: Alert | null;
  view: InvestigationView;
  logs: readonly LogRecord[];
  timezone: TimezoneMode;
  onChange: (window: TimeWindow) => void;
  onConfirm: () => void;
  confirmed: boolean;
}

export function TimeScopeBar({
  alert,
  view,
  logs,
  timezone,
  onChange,
  onConfirm,
  confirmed,
}: TimeScopeBarProps) {
  const scope = toWindow(view);
  const range = useMemo(() => histogramRange(alert), [alert]);
  const bins = useMemo(() => histogramBins(logs, range, BIN_COUNT), [logs, range]);
  const maxBin = Math.max(1, ...bins);
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<"move" | "start" | "end" | null>(null);

  const leftPct = ((scope.start - range.start) / (range.end - range.start)) * 100;
  const widthPct = ((scope.end - scope.start) / (range.end - range.start)) * 100;

  const applyFromClientX = useCallback(
    (clientX: number, mode: "move" | "start" | "end", origin?: TimeWindow) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const at = range.start + ratio * (range.end - range.start);
      const base = origin ?? scope;
      const duration = base.end - base.start;
      if (mode === "move") {
        let start = at - duration / 2;
        let end = start + duration;
        if (start < range.start) {
          start = range.start;
          end = start + duration;
        }
        if (end > range.end) {
          end = range.end;
          start = end - duration;
        }
        onChange({ start, end });
        return;
      }
      if (mode === "start") {
        const start = Math.min(at, base.end - 60_000);
        onChange({ start: Math.max(range.start, start), end: base.end });
        return;
      }
      const end = Math.max(at, base.start + 60_000);
      onChange({ start: base.start, end: Math.min(range.end, end) });
    },
    [onChange, range, scope],
  );

  const onPointerDown = (mode: "move" | "start" | "end") => (event: ReactPointerEvent) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setDrag(mode);
    const origin = { ...scope };
    applyFromClientX(event.clientX, mode, origin);
    const move = (e: PointerEvent) =>
      applyFromClientX(e.clientX, mode, mode === "move" ? origin : undefined);
    const up = () => {
      setDrag(null);
      globalThis.removeEventListener("pointermove", move);
      globalThis.removeEventListener("pointerup", up);
    };
    globalThis.addEventListener("pointermove", move);
    globalThis.addEventListener("pointerup", up);
  };

  const incidentLabel = alert
    ? TIME_COPY.incident(formatAbsolute(new Date(incidentTime(alert)), timezone, "HH:mm"))
    : TIME_COPY.unscoped;

  const eventsInWindow = logs.filter((log) => {
    const t = Date.parse(log.time);
    return t >= scope.start && t <= scope.end;
  }).length;

  return (
    <section
      className="space-y-2 border-b border-border bg-panel px-4 py-3"
      aria-label={TIME_COPY.label}
      data-guide-id="guide-time-scope"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text">{incidentLabel}</p>
          <p className="font-mono text-[12px] text-muted-fg">
            {TIME_COPY.windowLabel(
              formatAbsolute(new Date(scope.start), timezone, "HH:mm"),
              formatAbsolute(new Date(scope.end), timezone, "HH:mm"),
            )}
            <span className="mx-2 text-border">|</span>
            {TIME_COPY.eventsInWindow(eventsInWindow)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={TIME_COPY.presetsLabel} className="flex gap-1">
            {alert
              ? ALERT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChange(centeredWindow(incidentTime(alert), preset.halfMinutes * 60_000))
                    }
                    className={cn(
                      "rounded-md border px-2 py-1 text-[12px]",
                      Math.abs(scope.end - scope.start - preset.halfMinutes * 2 * 60_000) < 1000
                        ? "border-accent bg-surface text-accent"
                        : "border-border text-muted-fg hover:text-text",
                    )}
                  >
                    {preset.label}
                  </button>
                ))
              : LOGS_PRESETS.map((preset) => {
                  const now = getDemoClock().getTime();
                  const active =
                    Math.abs(scope.end - now) < 1000 &&
                    Math.abs(scope.end - scope.start - preset.hours * HOUR_MS) < 1000;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange({ start: now - preset.hours * HOUR_MS, end: now })}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[12px]",
                        active
                          ? "border-accent bg-surface text-accent"
                          : "border-border text-muted-fg hover:text-text",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
          </div>
          {alert ? (
            <button
              type="button"
              data-guide-id="guide-confirm-window"
              onClick={onConfirm}
              disabled={confirmed}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12px]",
                confirmed
                  ? "border-success text-success"
                  : "border-accent bg-accent text-white hover:opacity-90",
              )}
            >
              {confirmed ? TIME_COPY.confirmed : TIME_COPY.confirm}
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative h-12 select-none rounded-md border border-border bg-surface px-1"
        aria-label={TIME_COPY.histogramLabel}
      >
        <div className="flex h-full items-end gap-px px-0.5 pb-0.5">
          {bins.map((count, index) => (
            <div
              key={index}
              className="min-w-0 flex-1 rounded-sm bg-accent/35"
              style={{ height: `${Math.max(8, (count / maxBin) * 100)}%` }}
            />
          ))}
        </div>
        <div
          role="slider"
          aria-label={TIME_COPY.windowMove}
          aria-valuemin={range.start}
          aria-valuemax={range.end}
          aria-valuenow={scope.start}
          tabIndex={0}
          onKeyDown={(event) => {
            const step = (range.end - range.start) / BIN_COUNT;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              onChange({
                start: Math.max(range.start, scope.start - step),
                end: Math.max(range.start + (scope.end - scope.start), scope.end - step),
              });
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              const duration = scope.end - scope.start;
              const end = Math.min(range.end, scope.end + step);
              onChange({ start: end - duration, end });
            }
          }}
          onPointerDown={onPointerDown("move")}
          className={cn(
            "absolute top-0 h-full cursor-grab rounded-sm border border-accent/70 bg-accent/15",
            drag === "move" && "cursor-grabbing",
          )}
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` }}
        >
          <button
            type="button"
            aria-label={TIME_COPY.windowStart}
            onPointerDown={onPointerDown("start")}
            className="absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-ew-resize bg-accent/40"
          />
          <button
            type="button"
            aria-label={TIME_COPY.windowEnd}
            onPointerDown={onPointerDown("end")}
            className="absolute right-0 top-0 h-full w-2 translate-x-1/2 cursor-ew-resize bg-accent/40"
          />
        </div>
      </div>
    </section>
  );
}
