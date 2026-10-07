import { formatInTimeZone } from "date-fns-tz";

/** Fixed demo clock: Tue 6 Oct 2026, 12:05 IST = 2026-10-06T06:35:00.000Z */
export const DEMO_NOW_ISO = "2026-10-06T06:35:00.000Z";
export const DEMO_NOW = new Date(DEMO_NOW_ISO);
export const IST_TZ = "Asia/Kolkata";
export const UTC_TZ = "UTC";

export type TimeZoneMode = "IST" | "UTC";

export function now(): Date {
  return new Date(DEMO_NOW.getTime());
}

export function toZone(date: Date, zone: TimeZoneMode): string {
  const tz = zone === "IST" ? IST_TZ : UTC_TZ;
  return formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function formatDemoClock(zone: TimeZoneMode = "IST"): string {
  const tz = zone === "IST" ? IST_TZ : UTC_TZ;
  const label = zone === "IST" ? "IST" : "UTC";
  return `${formatInTimeZone(DEMO_NOW, tz, "EEE d MMM yyyy, HH:mm")} ${label}`;
}

export function formatAbsolute(date: Date, zone: TimeZoneMode = "IST"): string {
  const tz = zone === "IST" ? IST_TZ : UTC_TZ;
  const label = zone === "IST" ? "IST" : "UTC";
  return `${formatInTimeZone(date, tz, "d MMM yyyy, HH:mm:ss")} ${label}`;
}

export function formatBothZones(date: Date): { ist: string; utc: string } {
  return {
    ist: formatAbsolute(date, "IST"),
    utc: formatAbsolute(date, "UTC"),
  };
}
