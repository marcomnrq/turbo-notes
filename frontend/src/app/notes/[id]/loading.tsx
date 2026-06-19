import { Skeleton } from "@/components/ui/skeleton";

/** Instant fallback for /notes/[id] while the note + categories resolve. */
export default function NoteEditorLoading() {
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
