"use client";

import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { formatNoteDate } from "@/lib/date";
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
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    try {
      await notesApi.delete(noteId);
      toast.success("Note deleted.");
      router.push("/notes");
    } catch {
      toast.error("Couldn't delete the note.");
      setDeleting(false);
    }
  }

  const activeCategory = categories.find((c) => c.id === categoryId);
  const loading = !note;

  return (
    <div
      className="flex h-full flex-col"
      style={activeCategory ? surfaceTint(activeCategory.color) : undefined}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon data-icon="inline-start" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {saveLabel(saveState, note?.updated_at)}
          </span>
          <Select
            value={categoryId}
            onValueChange={(v) => handleCategoryChange(Number(v))}
            disabled={loading || categories.length === 0}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Category" />
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

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete note"
                  disabled={loading}
                >
                  <Trash2Icon />
                </Button>
              }
            />
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can't be undone. The note will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Editor body */}
      {loading ? (
        <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto p-6">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title"
            className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
          />
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing…"
            className="min-h-[60vh] flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
          />
        </div>
      )}
    </div>
  );
}

function saveLabel(state: SaveState, updatedAt?: string): string {
  if (state === "saving") return "Saving…";
  if (state === "saved") return "Saved";
  if (updatedAt) return `Last edited ${formatNoteDate(updatedAt)}`;
  return "";
}
