import { describe, expect, it } from "vitest";

import { formatNoteDate } from "@/lib/date";

/**
 * Covers the design's date rules:
 *  - today / yesterday relative labels (lowercase)
 *  - Older dates show "Month D" (full month name, no year, no leading zero)
 */
describe("formatNoteDate", () => {
  // Fixed "now" = 2026-06-17T12:00:00 local.
  const now = new Date(2026, 5, 17, 12, 0, 0);

  function iso(daysAgo: number): string {
    const d = new Date(2026, 5, 17 - daysAgo, 10, 0, 0);
    return d.toISOString();
  }

  it("returns 'today' for a note edited earlier today", () => {
    expect(formatNoteDate(iso(0), now)).toBe("today");
  });

  it("returns 'yesterday' for a note edited the previous day", () => {
    expect(formatNoteDate(iso(1), now)).toBe("yesterday");
  });

  it("returns 'Month D' for a note two days ago", () => {
    // 2026-06-15
    expect(formatNoteDate(iso(2), now)).toBe("June 15");
  });

  it("omits the year for older dates", () => {
    // 2026-03-05
    const older = new Date(2026, 2, 5, 9, 0, 0).toISOString();
    const label = formatNoteDate(older, now);
    expect(label).toBe("March 5");
    expect(label).not.toMatch(/2026/);
  });

  it("does not zero-pad the day", () => {
    // 2026-06-09 -> "June 9", not "June 09"
    expect(
      formatNoteDate(new Date(2026, 5, 9, 9, 0, 0).toISOString(), now),
    ).toBe("June 9");
  });

  it("crosses the month boundary correctly", () => {
    // 2026-05-31
    expect(
      formatNoteDate(new Date(2026, 4, 31, 9, 0, 0).toISOString(), now),
    ).toBe("May 31");
  });
});
