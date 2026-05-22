import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";
import { useFocusTrap } from "../lib/useFocusTrap";

export const BREACH_EVENT = "scifyos:breach";
const BREACH_EXIT_MS = 320;

export default function BreachAlert() {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = useOpenTransition(open, BREACH_EXIT_MS);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open && mounted);

  useEffect(() => {
    const onBreach = () => setOpen(true);
    window.addEventListener(BREACH_EVENT, onBreach);
    return () => window.removeEventListener(BREACH_EVENT, onBreach);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;

  const close = () => setOpen(false);

  return createPortal(
    <>
      <div className="breach-pulse" aria-hidden="true"></div>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label="Security breach"
        className="fixed inset-0 z-[125] flex items-center justify-center p-4"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Dismiss alert"
          onClick={close}
          className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/80 backdrop-blur-sm`}
        />
        <div className={`${closing ? "modal-exit" : "modal-enter"} relative w-full max-w-md border-2 border-danger bg-bg-elevated text-danger shadow-[0_0_40px_-4px_color-mix(in_oklch,var(--color-danger)_70%,transparent)]`}>
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-danger bg-danger/15">
            <span className="text-xs uppercase tracking-widest text-danger">
              ⚠ !!! SECURITY BREACH !!! ⚠
            </span>
            <button
              type="button"
              onClick={close}
              className="text-xs uppercase tracking-wider text-danger hover:bg-danger/20 px-2 py-0.5 border border-danger"
            >
              [×] ABORT
            </button>
          </div>

          <div className="px-6 py-8 text-center space-y-5">
            <svg
              viewBox="0 0 80 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinejoin="miter"
              strokeLinecap="square"
              className="size-24 mx-auto text-danger"
              aria-hidden="true"
            >
              <path d="M40 5 L76 65 L4 65 Z" />
              <line x1="40" y1="26" x2="40" y2="48" strokeWidth="5" />
              <rect x="38" y="54" width="4" height="4" fill="currentColor" stroke="none" />
            </svg>

            <div className="space-y-1">
              <p className="text-3xl uppercase tracking-widest">DANGER.</p>
              <p className="text-2xl uppercase tracking-widest">SECURITY BREACH.</p>
              <p className="text-2xl uppercase tracking-widest">ABORT.</p>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-danger/70">
              // trace: 185.220.101.4 → /dev/mainframe<br />
              // payload: rootkit.bin · 4.2 MB<br />
              // exfil: 87% complete
            </p>
          </div>

          <div className="px-3 py-3 border-t-2 border-danger flex gap-2 justify-end bg-danger/5">
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 text-danger/70 hover:text-danger uppercase tracking-wider text-xs transition"
            >
              DISMISS
            </button>
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 border border-danger text-danger hover:bg-danger/20 uppercase tracking-wider text-xs transition"
            >
              ▸ INITIATE ABORT
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
