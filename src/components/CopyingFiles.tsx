import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";
import { useFocusTrap } from "../lib/useFocusTrap";

export const COPY_FILES_EVENT = "scifyos:fx:copy-files";

const FAKE_FILES = [
  "system32/ntoskrnl.exe",
  "userprofile/secrets.bin",
  ".ssh/id_rsa",
  "var/log/auth.log",
  "etc/shadow",
  "documents/manifesto.txt",
  "downloads/0day.exe",
  "mainframe/payload.bin",
  "registry/HKLM.dat",
  "boot/efi/scifyos.dat",
];

const COPY_DURATION_MS = 8000;
const TICK_MS = 100;
const MODAL_EXIT_MS = 320;

function FolderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 28"
      width="56"
      height="40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className={`text-primary shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M2 7 L14 7 L17 4 L38 4 L38 25 L2 25 Z" />
      <line x1="2" y1="10" x2="38" y2="10" />
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg
      viewBox="0 0 18 22"
      width="22"
      height="28"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      strokeLinecap="square"
      fill="var(--color-bg-elevated)"
      className="text-primary"
      aria-hidden="true"
    >
      <path d="M2 2 L12 2 L16 6 L16 20 L2 20 Z" />
      <polyline points="12,2 12,6 16,6" />
      <line x1="5" y1="10" x2="13" y2="10" />
      <line x1="5" y1="13" x2="13" y2="13" />
      <line x1="5" y1="16" x2="10" y2="16" />
    </svg>
  );
}

export default function CopyingFiles() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [duration, setDuration] = useState(COPY_DURATION_MS);
  const [autoClose, setAutoClose] = useState(false);
  const { mounted, closing } = useOpenTransition(open, MODAL_EXIT_MS);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trap Tab/Shift+Tab inside the dialog while open. Skip during the
  // hacked sequence (autoClose=true) so it doesn't fight the breach
  // modal's own trap when both are visible.
  useFocusTrap(dialogRef, open && mounted && !autoClose);

  useEffect(() => {
    const onFire = (e: Event) => {
      const detail = (
        e as CustomEvent<
          { duration?: number; autoClose?: boolean } | undefined
        >
      ).detail;
      setDuration(detail?.duration ?? COPY_DURATION_MS);
      setAutoClose(detail?.autoClose ?? false);
      setProgress(0);
      setFileIndex(0);
      setDone(false);
      setOpen(true);
    };
    window.addEventListener(COPY_FILES_EVENT, onFire);
    return () => window.removeEventListener(COPY_FILES_EVENT, onFire);
  }, []);

  // Progress simulation: monotonic with random jitter + occasional pauses.
  useEffect(() => {
    if (!open || done) return;
    const baseInc = (TICK_MS / duration) * 100;
    let current = 0;
    const id = window.setInterval(() => {
      const pause = Math.random() < 0.08;
      const jitter = (Math.random() * 2 - 0.4) * baseInc;
      const inc = pause ? 0 : Math.max(0, baseInc + jitter);
      current = Math.min(100, current + inc);
      setProgress(current);
      setFileIndex(
        Math.min(
          FAKE_FILES.length - 1,
          Math.floor((current / 100) * FAKE_FILES.length),
        ),
      );
      if (current >= 100) {
        setDone(true);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [open, done, duration]);

  // Auto-close (used by hacked sequence so the modal vanishes when the
  // copy completes — user-triggered opens still wait for a manual dismiss).
  useEffect(() => {
    if (!done || !autoClose) return;
    const t = window.setTimeout(() => setOpen(false), 350);
    return () => window.clearTimeout(t);
  }, [done, autoClose]);

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

  // Focus management: remember who had focus when we opened, take focus
  // ourselves (the CANCEL button), restore on close.
  useEffect(() => {
    if (open) {
      previousFocusRef.current =
        (document.activeElement as HTMLElement | null) ?? null;
      const t = window.setTimeout(() => buttonRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;

  const close = () => setOpen(false);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Copying files"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={close}
        className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/80 backdrop-blur-sm`}
      />
      <div
        className={`${closing ? "modal-exit" : "modal-enter"} relative w-full max-w-md border border-primary bg-bg-elevated text-fg shadow-[var(--shadow-glow)]`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/60 bg-primary/10">
          <span className="text-xs uppercase tracking-widest text-primary">
            COPYING FILES
          </span>
          <button
            type="button"
            onClick={close}
            className="text-xs uppercase tracking-wider text-fg-muted hover:text-primary px-2 py-0.5 border border-transparent hover:border-primary/60 transition"
          >
            [×] CLOSE
          </button>
        </div>

        <div className="px-6 py-7 space-y-5">
          {/* Folders + flying paper */}
          <div className="flex items-center gap-3">
            <FolderIcon />
            <div className="relative flex-1 h-10 overflow-hidden">
              {!done && (
                <div
                  className="copy-paper-fly absolute"
                  style={{ top: "calc(50% - 14px)" }}
                >
                  <PaperIcon />
                </div>
              )}
              {/* Static arrow when done */}
              {done && (
                <div className="absolute inset-0 flex items-center justify-center text-success text-xs uppercase tracking-widest">
                  ▸ done
                </div>
              )}
            </div>
            <FolderIcon className={done ? "" : "copy-folder-receive"} />
          </div>

          {/* Folder labels */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-fg-subtle">
            <span>~/src</span>
            <span>~/dst</span>
          </div>

          {/* Filename */}
          <div className="text-xs uppercase tracking-wider text-fg-muted truncate">
            {done ? (
              <span className="text-success">// transfer complete</span>
            ) : (
              <>
                copying:{" "}
                <span className="text-primary">{FAKE_FILES[fileIndex]}</span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 bg-primary/10 overflow-hidden">
              <div
                className={`h-full transition-[width] duration-100 ease-out ${done ? "bg-success" : "bg-primary"}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-fg-subtle">
              <span>{Math.floor(progress)}% complete</span>
              <span>
                {Math.min(fileIndex + 1, FAKE_FILES.length)} /{" "}
                {FAKE_FILES.length} files
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-t border-primary/30 flex justify-end gap-2 bg-primary/5">
          <button
            ref={buttonRef}
            type="button"
            onClick={close}
            className={`px-3 py-1.5 border uppercase tracking-wider text-xs transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              done
                ? "border-success text-success hover:bg-success/10"
                : "border-primary text-primary hover:bg-primary/10"
            }`}
          >
            ▸ {done ? "DONE" : "CANCEL"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
