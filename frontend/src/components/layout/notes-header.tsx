"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NotesHeaderProps {
  onNewNote: () => void;
  disabled?: boolean;
}

/**
 * Full-width header for the notes route. The "New Note" action is pinned to
 * the right. Extracted so the header layout is owned in one place as more
 * actions (search, sort) land here.
 */
export function NotesHeader({ onNewNote, disabled }: NotesHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-end p-4">
      <Button
        variant="outline"
        onClick={onNewNote}
        disabled={disabled}
        className="h-10 rounded-full"
      >
        <PlusIcon data-icon="inline-start" />
        New Note
      </Button>
    </header>
  );
}
