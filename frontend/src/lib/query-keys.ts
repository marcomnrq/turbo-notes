/**
 * Centralized query-key factories.
 *
 * Co-locating keys here guarantees every hook builds them the same way, so two
 * components asking for the same data share one cache entry (the fix for the
 * duplicate-request bug: the list page and the editor page now read the same
 * `categoryKeys.list` entry instead of each firing their own request).
 *
 * Convention (TanStack): keys are arrays ordered from least to most specific,
 * so invalidating a prefix (`["notes"]`) busts every notes query.
 */

export const noteKeys = {
  all: ["notes"] as const,
  lists: () => [...noteKeys.all, "list"] as const,
  list: (params: { category?: number; search?: string }) =>
    [...noteKeys.lists(), params] as const,
  details: () => [...noteKeys.all, "detail"] as const,
  detail: (id: number) => [...noteKeys.details(), id] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};
