import { useEffect, useRef, useState } from "react";
import { APPS, type AppId } from "../lib/apps";
import { PROMPT } from "../lib/branding";
import { WINDOW_OPEN_EVENT } from "./WindowManager";

const MENU_APPS: AppId[] = [
  "terminal",
  "files",
  "logs",
  "shipcraft",
  "components",
  "playground",
  "hacking",
  "about",
  "settings",
];

export default function StartMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const launch = (id: AppId) => {
    window.dispatchEvent(
      new CustomEvent(WINDOW_OPEN_EVENT, { detail: { appId: id } }),
    );
    setOpen(false);
  };

  const shutDown = () => {
    setOpen(false);
    // Re-run boot animation on next /os visit.
    try {
      sessionStorage.removeItem("scifyos-booted");
    } catch {}
    window.location.href = "/";
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open start menu"
        aria-expanded={open}
        title="Start"
        className="fixed bottom-4 left-4 z-40 size-12 flex items-center justify-center border border-primary/40 bg-bg-elevated/90 backdrop-blur text-primary hover:border-primary hover:bg-primary/15 transition"
      >
        <svg viewBox="0 0 14 14" fill="currentColor" className="size-6" aria-hidden="true">
          <polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Start menu"
          className="start-menu-enter fixed bottom-20 left-4 z-40 w-60 border border-primary/40 bg-bg-elevated/95 backdrop-blur shadow-[var(--shadow-glow)]"
        >
          <div className="px-3 py-2 border-b border-primary/40 bg-primary/10 text-xs uppercase tracking-widest text-primary flex items-center justify-between">
            <span>// START</span>
            <span className="text-fg-subtle text-[10px]">{PROMPT}</span>
          </div>
          <ul className="flex flex-col text-xs">
            {MENU_APPS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => launch(id)}
                  className="w-full px-3 py-2 text-left text-fg-muted hover:bg-primary/10 hover:text-primary border-b border-primary/10 last:border-b-0 transition uppercase tracking-wider"
                >
                  ▸ {APPS[id].title}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-primary/40">
            <button
              type="button"
              role="menuitem"
              onClick={shutDown}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-danger hover:bg-danger/15 hover:text-danger transition uppercase tracking-wider text-xs"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
                className="size-3.5"
                aria-hidden="true"
              >
                <path d="M5 4 A6 6 0 1 0 11 4" />
                <line x1="8" y1="2" x2="8" y2="8" />
              </svg>
              shut down
            </button>
          </div>
        </div>
      )}
    </>
  );
}
