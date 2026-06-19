import Image from "next/image";

interface EmptyStateProps {
  src: string;
  alt: string;
  message: string;
  /** Optional intrinsic image size; the displayed size is responsive. */
  width?: number;
  height?: number;
}

/**
 * Centered illustration + message shown when a list has no items.
 * Reused across the notes list (and any future empty surfaces).
 */
export function EmptyState({
  src,
  alt,
  message,
  width = 297,
  height = 296,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="max-h-[40vh] w-auto max-w-[60vw] object-contain"
        priority
      />
      <p className="font-sans text-2xl font-normal leading-none tracking-normal text-brand-muted">
        {message}
      </p>
    </div>
  );
}
