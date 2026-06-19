"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Debounce + flush helper for the editor's autosave.
 *
 * Each call to `schedule` resets the pending timer; the latest field/value is
 * kept in a ref so a flurry of keystrokes collapses into one save. On unmount,
 * any pending save is flushed immediately so changes aren't lost when the user
 * navigates away mid-debounce.
 *
 * @param save   Called with the last scheduled (field, value) pair.
 * @param delay  Debounce window in ms (default 600).
 */
export function useDebouncedSave<TField extends string>(
  save: (field: TField, value: string) => void,
  delay = 600,
) {
  const pendingRef = useRef<{ field: TField; value: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const schedule = useCallback(
    (field: TField, value: string) => {
      pendingRef.current = { field, value };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const pending = pendingRef.current;
        pendingRef.current = null;
        timerRef.current = null;
        if (pending) saveRef.current(pending.field, pending.value);
      }, delay);
    },
    [delay],
  );

  // Flush on unmount so a half-typed change isn't dropped.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const pending = pendingRef.current;
        pendingRef.current = null;
        timerRef.current = null;
        if (pending) saveRef.current(pending.field, pending.value);
      }
    };
  }, []);

  return { schedule };
}
