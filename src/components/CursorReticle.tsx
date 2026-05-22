import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CURSOR_EVENT, type CursorState } from "../lib/preferences";

/**
 * Custom DOM cursor reticle. Hides the native pointer (via global CSS
 * rule on [data-cursor="on"]) and renders a green crosshair following
 * the mouse. Position is mutated on the ref directly to avoid a React
 * re-render on every pointermove; state changes (interactive/pressing)
 * still flow through React via data-state.
 *
 * Disabled automatically on coarse pointers (touch devices).
 */

const INTERACTIVE_SELECTOR =
  "button, a, [role=\"button\"], select, summary, label[for]";
const TEXT_SELECTOR =
  "input:not([type=\"button\"]):not([type=\"submit\"]):not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]), textarea, [contenteditable=\"true\"]";

export default function CursorReticle() {
  const [active, setActive] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.cursor === "on";
  });
  const [state, setState] = useState<"default" | "interactive" | "pressing">(
    "default",
  );
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const interactiveRef = useRef(false);
  const pressingRef = useRef(false);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CursorState>).detail;
      setActive(detail === "on");
    };
    window.addEventListener(CURSOR_EVENT, onChange);
    return () => window.removeEventListener(CURSOR_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;

    // Skip touch devices — let the OS handle the pointer.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const computeState = () => {
      if (pressingRef.current) {
        setState("pressing");
        return;
      }
      setState(interactiveRef.current ? "interactive" : "default");
    };

    const onMove = (e: PointerEvent) => {
      const node = ref.current;
      if (node) {
        node.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      const target = e.target as Element | null;
      const overText = !!target?.closest(TEXT_SELECTOR);
      if (overText) {
        setVisible(false);
        return;
      }
      if (!visible) setVisible(true);
      const isInteractive = !!target?.closest(INTERACTIVE_SELECTOR);
      if (isInteractive !== interactiveRef.current) {
        interactiveRef.current = isInteractive;
        computeState();
      }
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onDown = () => {
      pressingRef.current = true;
      computeState();
    };
    const onUp = () => {
      pressingRef.current = false;
      computeState();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
    };
  }, [active, visible]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className="cursor-reticle"
      data-visible={visible}
      data-state={state}
      aria-hidden="true"
    >
      <div className="cursor-reticle__inner">
        <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
          <circle
            cx="16"
            cy="16"
            r="9"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.55"
          />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
          <line x1="16" y1="2" x2="16" y2="5" stroke="currentColor" strokeWidth="1" />
          <line x1="16" y1="27" x2="16" y2="30" stroke="currentColor" strokeWidth="1" />
          <line x1="2" y1="16" x2="5" y2="16" stroke="currentColor" strokeWidth="1" />
          <line x1="27" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
