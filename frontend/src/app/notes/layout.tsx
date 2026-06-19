/** App shell for the notes section. Each page renders its own header. */
export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex h-screen overflow-hidden">{children}</div>;
}
