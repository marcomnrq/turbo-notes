import { Skeleton } from "@/components/ui/skeleton";

/**
 * Instant fallback for the /notes route while the notes + categories queries
 * resolve. Also covers client-side navigations back to the list.
 */
export default function NotesLoading() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center justify-end p-4">
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 shrink-0 p-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="mt-3 h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>
        <section className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap gap-4">
            {["a", "b", "c", "d", "e", "f"].map((key) => (
              <Skeleton key={key} className="h-64 w-80 rounded-2xl" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
