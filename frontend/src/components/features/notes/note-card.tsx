"use client";

import Link from "next/link";

import { cardTint } from "@/lib/color";
import { formatNoteDate } from "@/lib/date";
import type { Category, Note } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  category: Category | undefined;
}

/**
 * Preview card for a note in the grid. Shows the last-edited date and category
 * name in a meta row, the title in a heavy display font, and a truncated body
 * snippet. The card's background is tinted with its category's color (50%
 * opacity fill, solid color border) per the Figma spec.
 */
export function NoteCard({ note, category }: NoteCardProps) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex min-h-[var(--note-card-h)] w-[var(--note-card-w)] flex-col gap-3 rounded-2xl border-[var(--note-card-border-w)] p-5 transition-shadow hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      style={category ? cardTint(category.color) : undefined}
    >
      <div className="flex items-center gap-1.5 text-xs text-foreground">
        <span className="font-bold">{formatNoteDate(note.updated_at)}</span>
        {category ? <span>{toTitleCase(category.name)}</span> : null}
      </div>
      <h3
        className={cn(
          "font-heading text-2xl font-bold leading-tight tracking-tight",
          note.title ? "text-foreground" : "text-black/40",
        )}
      >
        {note.title || "Untitled"}
      </h3>
      <p className="line-clamp-[9] flex-1 overflow-hidden whitespace-pre-wrap text-sm leading-relaxed text-black/80">
        {note.content || "No additional text"}
      </p>
    </Link>
  );
}

/** "random thoughts" → "Random Thoughts", "school" → "School". */
function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
