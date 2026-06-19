"use client";

import { useQuery } from "@tanstack/react-query";

import { notesApi } from "@/lib/api";
import { noteKeys } from "@/lib/query-keys";

/** Loads a single note by id. Cached per-id and deduped across mount/unmount. */
export function useNote(id: number) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.retrieve(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}
