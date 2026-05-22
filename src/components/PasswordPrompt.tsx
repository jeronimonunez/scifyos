import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";
import { useFocusTrap } from "../lib/useFocusTrap";
import { APPS, type AppId } from "../lib/apps";
import {
  PASSWORD_PROMPT_EVENT,
  WINDOW_OPEN_EVENT,
  type PasswordPromptDetail,
} from "./WindowManager";

const EXIT_MS = 220;
const SECRET = "admin";
const SHAKE_MS = 420;

export default function PasswordPrompt() {
  const [open, setOpen] = useState(false);
  const [appId, setAppId] = useState<AppId | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const { mounted, closing } = useOpenTransition(open, EXIT_MS);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusTrap(dialogRef, open && mounted);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      const detail = (e as CustomEvent<PasswordPromptDetail>).detail;
      if (!detail?.appId) return;
      setAppId(detail.appId);
      setValue("");
      setError(false);
      setOpen(true);
    };
    window.addEventListener(PASSWORD_PROMPT_EVENT, onPrompt);
    return () => window.removeEventListener(PASSWORD_PROMPT_EVENT, onPrompt);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
  }, [open, appId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;

  const app = appId ? APPS[appId] : null;
  const title = app?.title ?? "Locked";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;
    if (value === SECRET) {
      window.dispatchEvent(
        new CustomEvent(WINDOW_OPEN_EVENT, {
          detail: { appId, unlocked: true },
        }),
      );
      setOpen(false);
      return;
    }
    setError(true);
    setValue("");
    window.setTimeout(() => setError(false), SHAKE_MS);
    inputRef.current?.focus();
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Password required for ${title}`}
      className="fixed inset-0 z-[125] flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cancel"
        onClick={() => setOpen(false)}
        className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/80 backdrop-blur-sm`}
      />
      <form
        onSubmit={submit}
        className={`${closing ? "modal-exit" : "modal-enter"} ${error ? "pwd-shake" : ""} relative w-full max-w-sm border-2 border-primary bg-bg-elevated shadow-[var(--shadow-glow)]`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-primary bg-primary/10">
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="size-3.5"
              aria-hidden="true"
            >
              <rect x="3" y="6.5" width="8" height="6" />
              <path d="M4.5 6.5 V4 A2.5 2.5 0 0 1 9.5 4 V6.5" />
              <line x1="7" y1="8.5" x2="7" y2="10.5" />
            </svg>
            // authentication required
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs uppercase tracking-wider text-primary hover:bg-primary/20 px-2 py-0.5 border border-primary/60"
          >
            [×] cancel
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
              // accessing
            </p>
            <p className="text-lg uppercase tracking-widest text-primary">
              {title}
            </p>
          </div>

          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-fg-muted">
              // password
            </span>
            <span className="flex items-center gap-2 border border-primary/60 bg-bg px-2 py-1.5 text-xs">
              <span className="text-primary">$</span>
              <input
                ref={inputRef}
                type="password"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={error}
                className="flex-1 bg-transparent outline-none text-fg placeholder:text-fg-subtle font-mono tracking-widest"
                placeholder="••••••••"
              />
            </span>
          </label>

          <p
            className={`text-[10px] uppercase tracking-widest min-h-[1em] ${
              error ? "text-danger" : "text-fg-subtle/70"
            }`}
            aria-live="polite"
          >
            {error
              ? "// access denied · invalid credentials"
              : "// hint: admin"}
          </p>
        </div>

        <div className="px-3 py-3 border-t-2 border-primary flex gap-2 justify-end bg-primary/5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-fg-muted hover:text-primary uppercase tracking-wider text-xs transition"
          >
            cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 border border-primary text-primary hover:bg-primary/20 uppercase tracking-wider text-xs transition"
          >
            ▸ unlock
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
