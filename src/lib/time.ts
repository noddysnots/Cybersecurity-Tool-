import { formatInTimeZone } from "date-fns-tz";
import { formatDistanceStrict, parseISO } from "date-fns";

/** Fixed demo clock: Tue 6 Oct 2026, 15:00 IST. Never use the real system clock for data. */
export const DEMO_CLOCK_ISO = "2026-10-06T09:30:00.000Z"; // 15:00 IST
export const DEMO_CLOCK = new Date(DEMO_CLOCK_ISO);

export const IST_TZ = "Asia/Kolkata";
export const UTC_TZ = "UTC";

export type TimezoneMode = "IST" | "UTC";

export function getDemoClock(): Date {
  return new Date(DEMO_CLOCK.getTime());
}

export function getTimezoneId(mode: TimezoneMode): string {
  return mode === "IST" ? IST_TZ : UTC_TZ;
}

export function formatAbsolute(
  date: Date | string,
  mode: TimezoneMode,
  pattern = "dd MMM yyyy HH:mm:ss",
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const tz = getTimezoneId(mode);
  const suffix = mode === "IST" ? " IST" : " UTC";
  return `${formatInTimeZone(d, tz, pattern)}${suffix}`;
}

export function formatRelative(
  date: Date | string,
  mode: TimezoneMode = "IST",
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const base = getDemoClock();
  const distance = formatDistanceStrict(d, base, { addSuffix: true });
  // date-fns uses "ago"/"in"; keep sentence case, no dashes
  void mode;
  return distance;
}

export function hoursBeforeDemo(hours: number): Date {
  return new Date(DEMO_CLOCK.getTime() - hours * 60 * 60 * 1000);
}

export function isWithinLast24h(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  const start = hoursBeforeDemo(24);
  return d.getTime() >= start.getTime() && d.getTime() <= DEMO_CLOCK.getTime();
}
