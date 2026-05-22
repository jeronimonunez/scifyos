import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";
import { useFocusTrap } from "../lib/useFocusTrap";

const MODAL_EXIT_MS = 320;

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const { mounted, closing } = useOpenTransition(open, MODAL_EXIT_MS);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open && mounted);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close modal"
        onClick={onClose}
        className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/80 backdrop-blur-sm`}
      />
      <div className={`${closing ? "modal-exit" : "modal-enter"} relative w-full max-w-md border border-primary bg-bg-elevated text-fg shadow-[var(--shadow-glow)]`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary/60 bg-primary/10">
          <span className="text-xs uppercase tracking-widest text-primary">
            {title ?? "DIALOG"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-fg-muted hover:text-primary px-2 py-0.5 border border-transparent hover:border-primary/60 transition"
          >
            [×] CLOSE
          </button>
        </div>
        <div className="px-4 py-4 text-sm text-fg-muted">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-primary/30 flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function DemoModal() {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState<null | "yes" | "no">(null);

  return (
    <div className="flex flex-col gap-3 items-start">
      <button
        type="button"
        onClick={() => {
          setAccepted(null);
          setOpen(true);
        }}
        className="px-4 py-2 bg-primary text-primary-fg uppercase tracking-wider text-sm hover:opacity-90 transition"
      >
        ▶ INITIATE BREACH
      </button>

      {accepted && (
        <p className="text-xs uppercase tracking-wider text-fg-muted">
          // last response:{" "}
          <span className={accepted === "yes" ? "text-primary" : "text-danger"}>
            {accepted}
          </span>
        </p>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="SECURITY PROMPT"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setAccepted("no");
                setOpen(false);
              }}
              className="px-3 py-1.5 text-fg-muted hover:text-primary uppercase tracking-wider text-xs transition"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={() => {
                setAccepted("yes");
                setOpen(false);
              }}
              className="px-3 py-1.5 border border-danger text-danger hover:bg-danger/15 uppercase tracking-wider text-xs transition"
            >
              CONFIRM
            </button>
          </>
        }
      >
        <p>
          You are about to access <span className="text-primary">/dev/mainframe</span>.
          This action will be logged.
        </p>
        <p className="mt-2 text-fg-subtle">
          press <span className="text-primary">ESC</span> or click outside to abort.
        </p>
      </Modal>
    </div>
  );
}
