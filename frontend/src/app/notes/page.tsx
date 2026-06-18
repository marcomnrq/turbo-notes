"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CategorySidebar } from "@/components/category-sidebar";
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
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-black/10 p-3 md:block">
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
        <div className="flex items-center gap-3 border-b border-black/10 p-4">
          <div className="relative flex-1">
            <SearchIcon
              data-icon="inline-start"
              className="pointer-events-none absolute inset-y-0 my-auto start-3 size-4 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="h-10 rounded-full border-brand-muted/40 ps-9"
            />
          </div>
          <Button
            onClick={handleNewNote}
            disabled={creating}
            className="h-10 rounded-full bg-brand-btn font-bold text-brand-btn-foreground hover:bg-brand-btn/90"
          >
            <PlusIcon data-icon="inline-start" />
            New Note
          </Button>
        </div>

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
                width={160}
                height={160}
                className="h-40 w-40 object-contain"
                priority
              />
              <p className="font-heading text-lg text-brand-muted">
                I&apos;m just here waiting for your charming notes...
              </p>
              <Button
                onClick={handleNewNote}
                disabled={creating}
                className="mt-2 h-10 rounded-full bg-brand-btn font-bold text-brand-btn-foreground hover:bg-brand-btn/90"
              >
                <PlusIcon data-icon="inline-start" />
                New Note
              </Button>
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
    </>
  );
}
