import { useEffect, useState } from "react";

/**
 * Bridges a boolean `open` prop with an exit animation. The underlying
 * tree stays mounted for `exitMs` after `open` flips to false so the
 * exit keyframes have time to play.
 *
 * Returns:
 *   - `mounted`: render the portal / dialog when true
 *   - `closing`: true during the exit window — apply your *-exit classes
 */
export function useOpenTransition(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, exitMs);
    return () => window.clearTimeout(t);
    // `mounted` is intentionally read-only here — we react to `open` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { mounted, closing };
}
