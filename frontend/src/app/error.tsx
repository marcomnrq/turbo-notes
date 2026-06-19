"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Catches uncaught errors thrown during render of
 * any segment under the root layout. Renders a friendly message with a retry
 * button instead of Next.js's default error shell.
 *
 * Note: this must be a client component and must not export `metadata`.
 */
// Next.js requires the error-boundary component to be named `Error`; the
// global shadow is expected here.
// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js error boundary
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the browser console for debugging; in production
    // you'd typically forward this to your error-reporting service.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-4xl font-bold text-brand">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-brand-muted">
        An unexpected error occurred while loading this page. You can try again,
        or head back to your notes.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.location.assign("/notes")}
        >
          Go to notes
        </Button>
      </div>
    </main>
  );
}
