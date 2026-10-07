"use client";

import {
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
} from "@tanstack/react-table";
import { LOG_COLUMN_LABELS, TABLE_COPY } from "@/content/investigate";
import { SeverityBadge } from "@/components/alerts/SeverityBadge";
import { formatAbsolute, type TimezoneMode } from "@/lib/time";
import type { LogRecord, LogType } from "@/types";
import { CellValue } from "./CellValue";

export const logTableFeatures = tableFeatures({
  columnSizingFeature,
  columnResizingFeature,
  columnVisibilityFeature,
});

const helper = createColumnHelper<typeof logTableFeatures, LogRecord>();

function textOrEmpty(value: string | number | undefined): string {
  if (value === undefined || value === "") return TABLE_COPY.emptyCell;
  return String(value);
}

export type FilterableField = "addr.src" | "addr.dst" | "user.src" | "rule";

export interface CellActionHandlers {
  onFilter: (field: FilterableField, value: string) => void;
  onExclude: (field: FilterableField, value: string) => void;
  onCopy: (value: string) => void;
  onPin: (logId: string) => void;
  onUnpin: (logId: string) => void;
  isPinned: (logId: string) => boolean;
  canPin: boolean;
}

export interface ColumnContext {
  timezone: TimezoneMode;
  actions: CellActionHandlers;
}

function monoCell(
  log: LogRecord,
  value: string | undefined,
  field: FilterableField | null,
  actions: CellActionHandlers,
) {
  if (!value) {
    return <span className="text-muted-fg">{TABLE_COPY.emptyCell}</span>;
  }
  if (!field) {
    return <span className="font-mono text-[13px]">{value}</span>;
  }
  return <CellValue log={log} value={value} field={field} actions={actions} />;
}

/** Columns shown for a log type. Shared ids keep visibility and sizing across tabs. */
export function columnsForType(type: LogType, ctx: ColumnContext) {
  const { timezone, actions } = ctx;
  const time = helper.accessor("time", {
    id: "time",
    header: LOG_COLUMN_LABELS.time,
    size: 168,
    minSize: 120,
    cell: (c) => (
      <span className="font-mono text-[12px] text-text" title={formatAbsolute(c.getValue(), timezone)}>
        {formatAbsolute(c.getValue(), timezone, "HH:mm:ss")}
      </span>
    ),
  });
  const srcIp = helper.accessor("srcIp", {
    id: "srcIp",
    header: LOG_COLUMN_LABELS.srcIp,
    size: 128,
    minSize: 96,
    cell: (c) => monoCell(c.row.original, c.getValue(), "addr.src", actions),
  });
  const dstIp = helper.accessor("dstIp", {
    id: "dstIp",
    header: LOG_COLUMN_LABELS.dstIp,
    size: 128,
    minSize: 96,
    cell: (c) => monoCell(c.row.original, c.getValue(), "addr.dst", actions),
  });
  const srcUser = helper.accessor("srcUser", {
    id: "srcUser",
    header: LOG_COLUMN_LABELS.srcUser,
    size: 180,
    minSize: 100,
    cell: (c) => monoCell(c.row.original, c.getValue(), "user.src", actions),
  });
  const app = helper.accessor("app", {
    id: "app",
    header: LOG_COLUMN_LABELS.app,
    size: 110,
    minSize: 72,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const rule = helper.accessor("rule", {
    id: "rule",
    header: LOG_COLUMN_LABELS.rule,
    size: 168,
    minSize: 100,
    cell: (c) => monoCell(c.row.original, c.getValue(), "rule", actions),
  });
  const action = helper.accessor("action", {
    id: "action",
    header: LOG_COLUMN_LABELS.action,
    size: 96,
    minSize: 72,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const device = helper.accessor("device", {
    id: "device",
    header: LOG_COLUMN_LABELS.device,
    size: 140,
    minSize: 96,
    cell: (c) => <span className="font-mono text-[13px]">{c.getValue()}</span>,
  });
  const dstPort = helper.accessor("dstPort", {
    id: "dstPort",
    header: LOG_COLUMN_LABELS.dstPort,
    size: 80,
    minSize: 64,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const sessionEnd = helper.accessor("sessionEndReason", {
    id: "sessionEndReason",
    header: LOG_COLUMN_LABELS.sessionEndReason,
    size: 140,
    minSize: 96,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const bytesSent = helper.accessor("bytesSent", {
    id: "bytesSent",
    header: LOG_COLUMN_LABELS.bytesSent,
    size: 96,
    minSize: 72,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const bytesRecv = helper.accessor("bytesReceived", {
    id: "bytesReceived",
    header: LOG_COLUMN_LABELS.bytesReceived,
    size: 96,
    minSize: 72,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const threat = helper.accessor("threatName", {
    id: "threatName",
    header: LOG_COLUMN_LABELS.threatName,
    size: 160,
    minSize: 100,
    cell: (c) => <span className="text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const severity = helper.accessor("severity", {
    id: "severity",
    header: LOG_COLUMN_LABELS.severity,
    size: 110,
    minSize: 90,
    cell: (c) => {
      const value = c.getValue();
      return value ? (
        <SeverityBadge severity={value} />
      ) : (
        <span className="text-muted-fg">{TABLE_COPY.noSeverity}</span>
      );
    },
  });
  const urlCategory = helper.accessor("urlCategory", {
    id: "urlCategory",
    header: LOG_COLUMN_LABELS.urlCategory,
    size: 160,
    minSize: 100,
    cell: (c) => <span className="font-mono text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const url = helper.accessor("url", {
    id: "url",
    header: LOG_COLUMN_LABELS.url,
    size: 200,
    minSize: 120,
    cell: (c) => <span className="font-mono text-[12px]">{textOrEmpty(c.getValue())}</span>,
  });
  const message = helper.accessor("message", {
    id: "message",
    header: LOG_COLUMN_LABELS.message,
    size: 280,
    minSize: 140,
    cell: (c) => <span className="line-clamp-2 text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });
  const location = helper.accessor("location", {
    id: "location",
    header: LOG_COLUMN_LABELS.location,
    size: 100,
    minSize: 72,
    cell: (c) => <span className="text-[13px]">{textOrEmpty(c.getValue())}</span>,
  });

  switch (type) {
    case "traffic":
      return helper.columns([
        time,
        srcIp,
        dstIp,
        srcUser,
        app,
        rule,
        action,
        dstPort,
        sessionEnd,
        bytesSent,
        bytesRecv,
        device,
      ]);
    case "threat":
      return helper.columns([time, srcIp, dstIp, threat, severity, action, rule, url, device]);
    case "url":
      return helper.columns([time, srcIp, srcUser, urlCategory, url, action, rule, app, device]);
    case "decryption":
      return helper.columns([time, srcIp, dstIp, srcUser, rule, message, url, device]);
    case "system":
      return helper.columns([time, device, message, location]);
    case "config":
      return helper.columns([time, device, message, srcUser, location]);
  }
}

export function defaultVisibilityFor(type: LogType): Record<string, boolean> {
  void type;
  return {};
}
