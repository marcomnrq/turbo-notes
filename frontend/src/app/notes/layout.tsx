import { NotesHeader } from "@/components/notes-header";

/** App shell: sticky header + content area for the notes section. */
export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <NotesHeader />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
