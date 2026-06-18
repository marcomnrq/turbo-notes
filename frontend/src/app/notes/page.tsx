"use client";

import { FileTextIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CategorySidebar } from "@/components/category-sidebar";
import { EmptyState } from "@/components/empty-state";
import { NoteCard } from "@/components/note-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesApi, notesApi } from "@/lib/api";
import type { Category, Note } from "@/lib/types";

export default function NotesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Initial load: fetch categories + notes together on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [cats, ns] = await Promise.all([
          categoriesApi.list(),
          notesApi.list(),
        ]);
        if (!active) return;
        setCategories(cats);
        setNotes(ns);
      } catch {
        if (active) toast.error("Couldn't load your notes.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Re-fetch notes when the category filter or search changes.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ns = await notesApi.list({
          category: activeCategory ?? undefined,
          search,
        });
        if (active) setNotes(ns);
      } catch {
        if (active) toast.error("Couldn't load your notes.");
      }
    })();
    return () => {
      active = false;
    };
  }, [activeCategory, search]);

  // Refresh category counts after notes change. The dependency on `notes` is
  // intentional — counts must update when notes are created/edited/deleted.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger
  useEffect(() => {
    let active = true;
    categoriesApi
      .list()
      .then((cats) => active && setCategories(cats))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [notes]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  async function handleNewNote() {
    setCreating(true);
    try {
      const note = await notesApi.create({ title: "", content: "" });
      router.push(`/notes/${note.id}`);
    } catch {
      toast.error("Couldn't create a new note.");
      setCreating(false);
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r p-3 md:block">
        {loading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="mt-3 h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <CategorySidebar
            categories={categories}
            activeId={activeCategory}
            totalCount={categories.reduce((sum, c) => sum + c.note_count, 0)}
            onSelect={setActiveCategory}
          />
        )}
      </aside>

      {/* Main column */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative flex-1">
            <SearchIcon
              data-icon="inline-start"
              className="pointer-events-none absolute inset-y-0 my-auto start-3 size-4 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="ps-9"
            />
          </div>
          <Button onClick={handleNewNote} disabled={creating} size="lg">
            <PlusIcon data-icon="inline-start" />
            New note
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {["a", "b", "c", "d", "e", "f"].map((key) => (
                <Skeleton key={key} className="h-44 w-full rounded-xl" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon className="size-6" />}
              title="No notes yet"
              description="Click “New note” to capture your first thought. It's saved automatically as you type."
              action={
                <Button onClick={handleNewNote} disabled={creating} size="lg">
                  <PlusIcon data-icon="inline-start" />
                  New note
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </>
  );
}
