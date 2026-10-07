import { DEMO_NOW } from "@/lib/time";

/** Relative age from the fixed demo clock. No em or en dashes. */
export function formatRelativeAgo(iso: string, now: Date = DEMO_NOW): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "unknown";
  const diffMs = Math.max(0, now.getTime() - then);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function modifiedMarker(iso: string, now: Date = DEMO_NOW): string {
  return `Modified ${formatRelativeAgo(iso, now)}`;
}

/** True when the change falls inside the last N hours of the demo clock. */
export function withinHours(iso: string, hours: number, now: Date = DEMO_NOW): boolean {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return false;
  return now.getTime() - then <= hours * 3_600_000;
}
