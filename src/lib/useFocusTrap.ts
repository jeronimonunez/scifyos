import { useEffect, type RefObject } from "react";

/**
 * Confines Tab / Shift+Tab focus movement inside a container while `active`.
 * If focus leaves (or is currently outside) the container, the trap snaps
 * it back to the first/last tabbable element. Elements with tabindex="-1"
 * are skipped — use that on the backdrop button so it doesn't sit in the
 * tab order despite being clickable for outside-to-close.
 *
 * Listens at document level so it catches Tab regardless of where focus
 * currently is — important when other components (e.g. a terminal input)
 * grab focus back while the modal is open.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current ? container.contains(current) : false;

      if (e.shiftKey) {
        if (!inside || current === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!inside || current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, containerRef]);
}
