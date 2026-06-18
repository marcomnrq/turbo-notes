/**
 * Relative-ish date formatting for note previews, matching the Figma design:
 *  - Today     -> "today"
 *  - Yesterday -> "yesterday"
 *  - Older     -> "Month D" (full month name + numeric day, e.g. "July 16")
 *
 * Dates are compared in local time to match the user's perception of "today".
 */

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatNoteDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const dayMs = 86_400_000;
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / dayMs);

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";

  // "July 16" — full month name + numeric day, no year, no leading zero.
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

/**
 * Absolute "Last edited" timestamp for the editor, e.g.
 * "June 17, 2026 at 12:00 PM".
 */
export function formatNoteTimestamp(iso: string): string {
  const date = new Date(iso);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateStr} at ${timeStr}`;
}
