"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NoteEditor } from "@/components/note-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesApi, notesApi } from "@/lib/api";
import type { Category, Note } from "@/lib/types";

/**
 * Editor route. A client wrapper that resolves the note id from params and
 * loads the categories + note, then renders the editor.
 *
 * Auth (the access token) lives in the browser, so this page is a client
 * component: the API client attaches the token and the request flows through
 * the same-origin rewrite proxy.
 */
export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [resolved, setResolved] = useState<{ id: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [note, setNote] = useState<Note | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Resolve the (async) params promise.
  useEffect(() => {
    params.then(({ id }) => {
      const noteId = Number(id);
      if (Number.isInteger(noteId) && noteId > 0) {
        setResolved({ id: noteId });
      } else {
        notFound();
      }
    });
  }, [params]);

  // Load categories + note once the id resolves.
  useEffect(() => {
    if (!resolved) return;
    let active = true;
    (async () => {
      try {
        const [cats, n] = await Promise.all([
          categoriesApi.list().catch(() => [] as Category[]),
          notesApi.retrieve(resolved.id),
        ]);
        if (!active) return;
        setCategories(cats);
        setNote(n);
      } catch {
        if (active) toast.error("Couldn't open this note.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [resolved]);

  if (!resolved) return null;

  if (loading) {
    return (
      <main className="w-full flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto h-full w-full max-w-5xl space-y-4 rounded-2xl border border-black/10 bg-card p-8 shadow-sm">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    );
  }

  return (
    <NoteEditor
      noteId={resolved.id}
      categories={categories}
      initialNote={note}
    />
  );
}
