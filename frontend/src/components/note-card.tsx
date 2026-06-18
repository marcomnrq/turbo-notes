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
 * Preview card for a note in the grid. Shows the last-edited date, category
 * name, title, and a truncated snippet. The card's background is tinted with
 * its category's color to match the demo.
 */
export function NoteCard({ note, category }: NoteCardProps) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex h-44 flex-col gap-2 rounded-xl border p-4 transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      style={category ? cardTint(category.color) : undefined}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatNoteDate(note.updated_at)}</span>
        {category ? (
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            {category.name}
          </span>
        ) : null}
      </div>
      <h3
        className={cn(
          "font-semibold tracking-tight",
          note.title ? "text-foreground" : "text-muted-foreground/60",
        )}
      >
        {note.title || "Untitled"}
      </h3>
      <p className="line-clamp-4 flex-1 text-sm text-muted-foreground">
        {note.content || "No additional text"}
      </p>
    </Link>
  );
}
