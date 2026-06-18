/**
 * Relative-ish date formatting for note previews, matching the demo:
 *  - Today     -> "Today"
 *  - Yesterday -> "Yesterday"
 *  - Older     -> "Mon D" (e.g. "Mar 5"), no year.
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

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  // "Mar 5" — short month + day, no year, no leading zero on the day.
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
