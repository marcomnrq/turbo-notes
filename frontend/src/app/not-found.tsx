import Link from "next/link";

/**
 * Custom 404. Rendered when `notFound()` is thrown anywhere (e.g. an invalid
 * note id in /notes/[id]) or when no route matches. This is a server component
 * (statically prerendered), so it must not carry client-only props like
 * `onClick` — the link alone handles navigation.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-5xl font-bold text-brand">404</h1>
      <p className="max-w-md text-sm text-brand-muted">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/notes"
        className="inline-flex h-10 items-center justify-center rounded-full border border-brand-muted bg-background px-6 text-sm font-bold leading-none text-brand-muted transition-colors hover:bg-brand-muted/5"
      >
        Back to notes
      </Link>
    </main>
  );
}
