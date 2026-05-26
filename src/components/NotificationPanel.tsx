import { useEffect, useRef, useState } from "react";
import { BRANDING } from "../lib/branding";

type Notif = {
  id: string;
  title: string;
  body: string;
  time: string;
  tone?: "primary" | "warning" | "danger";
};

const SAMPLE_NOTIFS: Notif[] = [
  {
    id: "n1",
    title: "system boot complete",
    body: "all services online · uptime 0d 0h 1m",
    time: "just now",
    tone: "primary",
  },
  {
    id: "n2",
    title: "incoming connection",
    body: "10.0.0.42 attempting ssh handshake on port 22",
    time: "2 min ago",
    tone: "warning",
  },
  {
    id: "n3",
    title: "// reminder",
    body: "press ⌘K from any non-bare page to open the command palette",
    time: "12 min ago",
  },
  {
    id: "n4",
    title: "kernel update available",
    body: `${BRANDING.name} 0.1.1 ready · install via terminal: 'sudo reboot'`,
    time: "1 hr ago",
  },
];

const toneClass: Record<NonNullable<Notif["tone"]>, string> = {
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
};

function BellIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      strokeLinecap="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M3 12 L13 12 L11.5 10.5 L11.5 7 Q11.5 4 8 4 Q4.5 4 4.5 7 L4.5 10.5 Z" />
      <path d="M7 14 Q8 15 9 14" />
    </svg>
  );
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
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

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle notifications"
        aria-expanded={open}
        className={`flex items-center gap-1 px-1.5 py-0.5 -my-0.5 transition ${
          open ? "text-primary" : "text-fg-muted hover:text-primary"
        }`}
      >
        <BellIcon />
        <span className="text-[10px]">{SAMPLE_NOTIFS.length}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="notification-enter fixed right-3 top-10 z-40 w-80 max-w-[calc(100vw-1.5rem)] border border-primary/40 bg-bg-elevated/95 backdrop-blur shadow-[var(--shadow-glow)]"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary/40 bg-primary/10">
            <span className="text-xs uppercase tracking-widest text-primary">
              // notifications
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-fg-muted hover:text-primary text-[10px] uppercase tracking-widest"
            >
              CLOSE
            </button>
          </div>
          <ul className="p-2 space-y-2 max-h-80 overflow-y-auto">
            {SAMPLE_NOTIFS.map((n) => (
              <li
                key={n.id}
                className="p-2 border border-primary/20 bg-bg/40"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`uppercase tracking-wider text-[10px] truncate ${
                      n.tone ? toneClass[n.tone] : "text-primary"
                    }`}
                  >
                    {n.title}
                  </p>
                  <span className="text-fg-subtle text-[10px] tabular-nums shrink-0">
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-fg-muted mt-1">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
