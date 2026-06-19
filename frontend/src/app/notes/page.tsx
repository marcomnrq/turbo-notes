"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CategoryButton } from "@/components/common/category-button";
import { EmptyState } from "@/components/common/empty-state";
import { NoteCard } from "@/components/features/notes/note-card";
import { NotesHeader } from "@/components/layout/notes-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { useCreateNote, useNotes } from "@/hooks/use-notes";

export default function NotesPage() {
  const router = useRouter();
  // Active category filter: null = show all. Clicking the active category
  // again clears the filter (toggle).
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const categoriesQuery = useCategories();
  const notesQuery = useNotes({
    category: activeCategory ?? undefined,
  });
  const createNote = useCreateNote();

  const categories = categoriesQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  // A request is in flight only when we have nothing to show yet.
  const loading = notesQuery.isLoading || categoriesQuery.isLoading;

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  async function handleNewNote() {
    const note = await createNote.mutateAsync({ title: "", content: "" });
    router.push(`/notes/${note.id}`);
  }

  return (
    <div className="flex h-full w-full flex-col">
      <NotesHeader onNewNote={handleNewNote} disabled={createNote.isPending} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — category labels. Click to filter; click the active one again to clear. */}
        <aside className="w-60 shrink-0 overflow-y-auto p-3">
          {categoriesQuery.isLoading ? (
            <div className="flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="mt-3 h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <nav aria-label="Categories" className="flex flex-col gap-1">
              <div className="px-2.5 pb-2">
                <h1 className="font-sans text-xs font-bold leading-none tracking-normal text-foreground">
                  All Categories
                </h1>
              </div>
              {categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  label={category.name}
                  count={category.note_count}
                  color={category.color}
                  active={activeCategory === category.id}
                  onClick={() =>
                    setActiveCategory((prev) =>
                      prev === category.id ? null : category.id,
                    )
                  }
                />
              ))}
            </nav>
          )}
        </aside>

        {/* Main column */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-wrap gap-4">
                {["a", "b", "c", "d", "e", "f"].map((key) => (
                  <Skeleton key={key} className="h-64 w-80 rounded-2xl" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <EmptyState
                src="/images/bubble-tea.png"
                alt="A bubble tea illustration"
                message="I'm just here waiting for your charming notes..."
              />
            ) : (
              <div className="flex flex-wrap gap-4">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    category={categoryById.get(note.category)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
