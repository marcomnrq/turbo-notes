"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/lib/api";
import { categoryKeys } from "@/lib/query-keys";

/**
 * Loads the current user's categories. Shared across every page via the
 * `categoryKeys.list` cache entry, so the editor page reuses what the list
 * page already fetched instead of firing a second request.
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: categoriesApi.list,
  });
}
