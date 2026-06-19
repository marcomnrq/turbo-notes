/**
 * Helpers for blending a category's hex color into a soft background/border
 * tint, used on note cards and in the editor to mirror the demo where the
 * note's background color matches its category.
 *
 * Per the Figma design system: cards use a solid category color for their
 * border and a 50%-opacity fill of that color for the background. The editor
 * surface uses a lighter tint to keep typed text legible.
 */

/** Convert a "#rrggbb" hex string to an `rgba(r, g, b, alpha)` string. */
function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Card fill + border per spec: 50%-opacity background and a solid category
 * color border.
 */
export function cardTint(hex: string): React.CSSProperties {
  return {
    backgroundColor: hexToRgba(hex, 0.5),
    borderColor: hex,
  };
}

/**
 * Editor surface tint. The spec calls for the note's background to match its
 * category color at "background density"; we hold the fill back to ~20% so
 * typed text stays readable while still clearly carrying the category color.
 */
export function surfaceTint(hex: string): React.CSSProperties {
  return { backgroundColor: hexToRgba(hex, 0.2) };
}
