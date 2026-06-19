"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, notesApi } from "@/lib/api";
import { surfaceTint } from "@/lib/color";
import { formatNoteDate, formatNoteTimestamp } from "@/lib/date";
import type { Category, Note } from "@/lib/types";

interface NoteEditorProps {
  noteId: number;
  categories: Category[];
  initialNote?: Note;
}

type SaveState = "idle" | "saving" | "saved";

/**
 * Inline note editor.
 *
 * - Title + content are editable; changes are debounced and PATCHed, with a
 *   "Saving…/Saved" indicator and a live last-edited timestamp.
 * - Category can be switched via a dropdown, which also recolors the editor
 *   background to the category's color (mirroring the demo).
 * - Delete asks for confirmation, then returns to the notes list.
 */
export function NoteEditor({
  noteId,
  categories,
  initialNote,
}: NoteEditorProps) {
  const router = useRouter();

  const [note, setNote] = useState<Note | undefined>(initialNote);
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialNote?.category,
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirtyRef = useRef({ title, content });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the note if it wasn't passed in.
  useEffect(() => {
    if (initialNote) return;
    let active = true;
    notesApi
      .retrieve(noteId)
      .then((n) => {
        if (!active) return;
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setCategoryId(n.category);
      })
      .catch(() => {
        toast.error("Couldn't open this note.");
        router.push("/notes");
      });
    return () => {
      active = false;
    };
  }, [noteId, initialNote, router]);

  const persist = useCallback(
    async (field: "title" | "content" | "category", value: string | number) => {
      setSaveState("saving");
      try {
        const updated = await notesApi.update(noteId, { [field]: value });
        setNote(updated);
        setSaveState("saved");
        // Clear the "saved" indicator shortly after.
        setTimeout(
          () => setSaveState((s) => (s === "saved" ? "idle" : s)),
          1500,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          toast.error("This note no longer exists.");
          router.push("/notes");
        } else {
          toast.error("Couldn't save your changes.");
          setSaveState("idle");
        }
      }
    },
    [noteId, router],
  );

  // Debounced autosave for title/content.
  const scheduleSave = useCallback(
    (field: "title" | "content", value: string) => {
      dirtyRef.current[field] = value;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(field, dirtyRef.current[field]);
      }, 600);
    },
    [persist],
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave("title", value);
  }

  function handleContentChange(value: string) {
    setContent(value);
    scheduleSave("content", value);
  }

  function handleCategoryChange(value: number) {
    setCategoryId(value);
    void persist("category", value);
  }

  const activeCategory = categories.find((c) => c.id === categoryId);
  const loading = !note;

  return (
    // Top bar (category selector + X) sits above the tinted card. Both share
    // the full available width so the card's 3px border aligns with the left
    // edge of the selector and the right edge of the X button.
    <main className="flex w-full flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex h-full flex-col">
        {/* Top bar: category pill (left) + close (right). Sits above the card;
            the card below aligns to this row's edges. */}
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <Select
            value={categoryId}
            onValueChange={(v) => handleCategoryChange(Number(v))}
            disabled={loading || categories.length === 0}
          >
            <SelectTrigger className="h-[39px] w-[225px] gap-2 rounded-md border-black/15 bg-background/60 px-[15px] py-[7px] font-medium">
              <SelectValue placeholder="Category">
                {(value: number | null) => {
                  const cat = categories.find((c) => c.id === value);
                  if (!cat) return "Category";
                  return (
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden
                      />
                      {cat.name}
                    </span>
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close note"
              onClick={() => router.push("/notes")}
              className="text-foreground"
            >
              <XIcon />
            </Button>
          </div>
        </div>

        {/* Tinted editor card: 3px border, category-colored background.
            Spans the same width as the top bar above (selector → X). */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-2xl border-[3px] border-black/10 shadow-sm"
          style={activeCategory ? surfaceTint(activeCategory.color) : undefined}
        >
          {loading ? (
            <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-8">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-4 overflow-y-auto p-8">
              {/* Last-edited timestamp, upper-right quadrant */}
              <div className="flex justify-end">
                <span className="text-xs text-brand-muted tabular-nums">
                  {saveLabel(saveState, note?.updated_at)}
                </span>
              </div>

              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note Title"
                aria-label="Note title"
                className="w-full bg-transparent font-heading text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-black/30"
              />
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Pour your heart out..."
                className="flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-foreground shadow-none placeholder:text-black/40 focus-visible:ring-0"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function saveLabel(state: SaveState, updatedAt?: string): string {
  if (state === "saving") return "Saving…";
  if (state === "saved") return "Saved";
  if (updatedAt)
    return `Last Edited: ${formatNoteTimestamp(updatedAt)} · ${formatNoteDate(
      updatedAt,
    )}`;
  return "";
}
