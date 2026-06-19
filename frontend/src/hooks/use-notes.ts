"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { categoriesApi, notesApi } from "@/lib/api";
import { categoryKeys, noteKeys } from "@/lib/query-keys";
import type { Note } from "@/lib/types";

/** Query parameters for the notes list (all optional). */
export interface NotesListParams {
  category?: number;
  search?: string;
}

/**
 * Loads the notes list, optionally filtered. The query key embeds the params,
 * so switching the category filter swaps cache entries cleanly (one request
 * per filter value, deduped by TanStack).
 */
export function useNotes(params: NotesListParams = {}) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: () => notesApi.list(params),
  });
}

/**
 * Create a note. Busts the whole notes list and the category list (so the
 * per-category counts update). On success returns the new note so the caller
 * can navigate to its editor route.
 */
export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title?: string; content?: string }) =>
      notesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: () => toast.error("Couldn't create a new note."),
  });
}

/**
 * Update a note (debounced autosave uses this). Updates the matching detail
 * cache in place and invalidates lists + categories so timestamps and counts
 * stay fresh — replacing the old `[notes] → refetch categories` cascade.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Pick<Note, "title" | "content" | "category">>;
    }) => notesApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(noteKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/**
 * Delete a note. Removes its detail entry, busts the lists, and refreshes
 * category counts.
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/**
 * Prefetch the categories list (e.g. on the list page) so the editor route
 * can read from cache without an extra request.
 */
export function usePrefetchCategories() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.prefetchQuery({
      queryKey: categoryKeys.list(),
      queryFn: categoriesApi.list,
    });
}
