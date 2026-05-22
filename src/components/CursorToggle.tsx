import { useEffect, useState } from "react";
import {
  applyCursor,
  CURSOR_EVENT,
  type CursorState,
} from "../lib/preferences";

function getInitialCursor(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.cursor === "on";
}

export default function CursorToggle() {
  const [on, setOn] = useState<boolean>(getInitialCursor);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CursorState>).detail;
      setOn(detail === "on");
    };
    window.addEventListener(CURSOR_EVENT, onChange);
    return () => window.removeEventListener(CURSOR_EVENT, onChange);
  }, []);

  const toggle = () => {
    applyCursor(on ? "off" : "on");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Turn custom cursor ${on ? "off" : "on"}`}
      title={`Turn custom cursor ${on ? "off" : "on"}`}
      className="px-3 py-1.5 text-xs uppercase tracking-wider text-fg-muted hover:text-primary border border-primary/40 hover:border-primary transition-colors"
    >
      {on ? "■ CRSR" : "□ CRSR"}
    </button>
  );
}
