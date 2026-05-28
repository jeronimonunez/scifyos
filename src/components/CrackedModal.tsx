import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";
import { useFocusTrap } from "../lib/useFocusTrap";
import { WINDOW_OPEN_EVENT } from "./WindowManager";

const HACKING_CRACKED_EVENT = "scifyos:hacking:cracked";
export const EXPLORER_BREAK_LOCK_EVENT = "scifyos:explorer:break-lock";

type CrackedDetail = {
  target?: { kind?: string; id?: string; name?: string };
  word?: string;
  attemptsUsed?: number;
};

const EXIT_MS = 220;

/**
 * Global "ACCESS GRANTED" modal — listens for HACKING_CRACKED_EVENT
 * targeted at folders, shows a small confirmation, and on OK focuses
 * the Explorer window + dispatches a break-lock animation event.
 */
export default function CrackedModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<CrackedDetail | null>(null);
  const { mounted, closing } = useOpenTransition(open, EXIT_MS);
  const dialogRef = useRef<HTMLDivElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(dialogRef, open && mounted);

  useEffect(() => {
    const onCracked = (e: Event) => {
      const d = (e as CustomEvent<CrackedDetail>).detail;
      // Only show for folder targets in this pass.
      if (!d?.target || d.target.kind !== "folder") return;
      setDetail(d);
      setOpen(true);
    };
    window.addEventListener(HACKING_CRACKED_EVENT, onCracked);
    return () => window.removeEventListener(HACKING_CRACKED_EVENT, onCracked);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => okRef.current?.focus(), 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        confirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const confirm = () => {
    const target = detail?.target;
    setOpen(false);
    if (target?.kind === "folder" && target.id) {
      // Bring Explorer to the front, then ask it to play the break-lock
      // animation for this folder.
      window.dispatchEvent(
        new CustomEvent(WINDOW_OPEN_EVENT, { detail: { appId: "explorer" } }),
      );
      window.dispatchEvent(
        new CustomEvent<{ folderId: string }>(EXPLORER_BREAK_LOCK_EVENT, {
          detail: { folderId: target.id },
        }),
      );
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-label="Access granted"
      className="fixed inset-0 z-[125] flex items-center justify-center p-4"
    >
      <div
        className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/80 backdrop-blur-sm`}
      />
      <div
        className={`${closing ? "modal-exit" : "modal-enter"} relative w-full max-w-md border-2 border-primary bg-bg-elevated shadow-[var(--shadow-glow)]`}
      >
        <header className="flex items-center justify-between px-3 py-2 border-b-2 border-primary bg-primary/10">
          <span className="text-xs uppercase tracking-widest text-primary">
            // access granted
          </span>
        </header>
        <div className="px-6 py-6 text-center space-y-3">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="miter"
            strokeLinecap="square"
            className="size-16 mx-auto text-primary"
            aria-hidden="true"
          >
            <rect x="18" y="30" width="28" height="22" />
            <path d="M22 30 V22 A10 10 0 0 1 42 22 V30" />
            <line x1="32" y1="38" x2="32" y2="44" />
          </svg>
          <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
            target unlocked
          </p>
          <p className="text-lg uppercase tracking-widest text-primary">
            {detail?.target?.name ?? "—"}
          </p>
          {detail?.word && (
            <p className="text-[10px] uppercase tracking-widest text-fg-muted font-mono">
              password: {detail.word}
              {typeof detail.attemptsUsed === "number" && (
                <span className="text-fg-subtle"> · {detail.attemptsUsed} attempts</span>
              )}
            </p>
          )}
        </div>
        <footer className="px-3 py-3 border-t-2 border-primary flex justify-end bg-primary/5">
          <button
            ref={okRef}
            type="button"
            onClick={confirm}
            className="px-4 py-1.5 border border-primary text-primary hover:bg-primary/20 uppercase tracking-wider text-xs transition"
          >
            ▸ ok
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
