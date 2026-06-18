"use client";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  categories: Category[];
  /** Active filter: null = "All". */
  activeId: number | null;
  totalCount: number;
  onSelect: (id: number | null) => void;
}

/**
 * Left sidebar listing "All notes" plus each category with its color swatch,
 * name, and note count. Clicking a category filters the notes list.
 */
export function CategorySidebar({
  categories,
  activeId,
  totalCount,
  onSelect,
}: CategorySidebarProps) {
  return (
    <nav className="flex flex-col gap-1">
      <SidebarItem
        label="All"
        count={totalCount}
        active={activeId === null}
        onClick={() => onSelect(null)}
      />
      <div className="px-2 pb-1 pt-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Categories
        </span>
      </div>
      {categories.map((category) => (
        <SidebarItem
          key={category.id}
          label={category.name}
          count={category.note_count}
          color={category.color}
          active={activeId === category.id}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </nav>
  );
}

interface SidebarItemProps {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({
  label,
  count,
  color,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
          className="size-3 shrink-0 rounded-full border border-border"
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
