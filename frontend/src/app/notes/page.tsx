"use client";

import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NoteCard } from "@/components/note-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesApi, notesApi } from "@/lib/api";
import type { Category, Note } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  // Active category filter: null = show all. Clicking the active category
  // again clears the filter (toggle).
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

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

  // Re-fetch notes when the category filter changes.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ns = await notesApi.list({
          category: activeCategory ?? undefined,
        });
        if (active) setNotes(ns);
      } catch {
        if (active) toast.error("Couldn't load your notes.");
      }
    })();
    return () => {
      active = false;
    };
  }, [activeCategory]);

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
    try {
      const note = await notesApi.create({ title: "", content: "" });
      router.push(`/notes/${note.id}`);
    } catch {
      toast.error("Couldn't create a new note.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Full-width header: New Note button pinned to the right. */}
      <header className="flex items-center justify-end p-4">
        <Button
          variant="outline"
          onClick={handleNewNote}
          className="h-10 rounded-full"
        >
          <PlusIcon data-icon="inline-start" />
          New Note
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — category labels. Click to filter; click the active one again to clear. */}
        <aside className="w-60 shrink-0 overflow-y-auto p-3">
          {loading ? (
            <div className="flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="mt-3 h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <nav className="flex flex-col gap-1">
              <div className="px-2.5 pb-2">
                <span className="font-sans text-xs font-bold leading-none tracking-normal text-foreground">
                  All Categories
                </span>
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
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-wrap gap-4">
                {["a", "b", "c", "d", "e", "f"].map((key) => (
                  <Skeleton
                    key={key}
                    className="h-[246px] w-[303px] rounded-2xl"
                  />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                <Image
                  src="/images/bubble-tea.png"
                  alt="A bubble tea illustration"
                  width={297}
                  height={296}
                  className="max-h-[50vh] w-auto max-w-[80vw] object-contain"
                  priority
                />
                <p className="font-sans text-2xl font-normal leading-none tracking-normal text-brand-muted">
                  I&apos;m just here waiting for your charming notes...
                </p>
              </div>
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

/** Clickable category row. Highlights when active (filter applied). */
function CategoryButton({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
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
