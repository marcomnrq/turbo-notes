/**
 * Helpers for blending a category's hex color into a soft background/border
 * tint, used on note cards and in the editor to mirror the demo where the
 * note's background color matches its category.
 */

/** Convert a "#rrggbb" hex string to an `rgba(r, g, b, alpha)` string. */
export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Soft fill + border tint for a preview card. */
export function cardTint(hex: string): React.CSSProperties {
  return {
    backgroundColor: hexToRgba(hex, 0.08),
    borderColor: hexToRgba(hex, 0.2),
  };
}

/** Lighter fill for the editor surface. */
export function surfaceTint(hex: string): React.CSSProperties {
  return { backgroundColor: hexToRgba(hex, 0.05) };
}
