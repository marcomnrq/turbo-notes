"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Wraps the app in a single TanStack Query cache.
 *
 * The `QueryClient` is created in component state (not at module scope) so it
 * is never shared across requests on the server. Sensible defaults below keep
 * the UI snappy while avoiding noisy refetches:
 * - `staleTime: 30s` — navigating list → editor → list reuses cached data
 *   instead of refetching (this is what previously caused categories to load
 *   3–4× on the notes page).
 * - `refetchOnWindowFocus: false` — a notes app shouldn't hit the API every
 *   time the user tabs back.
 * - `retry: 1` — one retry is enough; the API client already retries on 401.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
