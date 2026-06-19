"use client";

import { cn } from "@/lib/utils";

interface CategoryButtonProps {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}

/**
 * Clickable category row in the notes sidebar. Highlights when active
 * (filter applied) via `aria-pressed` — color is decoration, the pressed
 * state is the accessible signal.
 */
export function CategoryButton({
  label,
  count,
  color,
  active,
  onClick,
}: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 font-sans text-xs font-normal leading-none tracking-normal transition-colors",
        active
          ? "bg-black/5 text-foreground"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
      )}
    >
      {color ? (
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ) : (
        <span
          className="size-3 shrink-0 rounded-full border border-current opacity-40"
          aria-hidden
        />
      )}
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">
        {count}
      </span>
    </button>
  );
}
