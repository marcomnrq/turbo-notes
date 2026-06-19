"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { NoteEditor } from "@/components/features/notes/note-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { useNote } from "@/hooks/use-note";

/**
 * Editor route. Resolves the note id from params and loads the note, then
 * renders the editor. Categories come from the shared TanStack cache (the
 * same entry the list page populated), so opening a note issues no extra
 * categories request.
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
  const { id: rawId } = use(params);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const categoriesQuery = useCategories();
  const noteQuery = useNote(id);

  const loading = categoriesQuery.isLoading || noteQuery.isLoading;
  const categories = categoriesQuery.data ?? [];
  const note = noteQuery.data;

  if (loading || !note) {
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

  return <NoteEditor noteId={id} categories={categories} initialNote={note} />;
}
