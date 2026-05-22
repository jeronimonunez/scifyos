import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";

const DRAWER_EXIT_MS = 240;

export type DrawerSide = "right" | "left" | "bottom";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  children: ReactNode;
  footer?: ReactNode;
};

const sidePosition: Record<DrawerSide, string> = {
  right: "top-0 bottom-0 right-0 w-[min(28rem,100vw)] border-l-2",
  left: "top-0 bottom-0 left-0 w-[min(28rem,100vw)] border-r-2",
  bottom: "left-0 right-0 bottom-0 h-[min(60vh,32rem)] border-t-2",
};

const enterClass: Record<DrawerSide, string> = {
  right: "drawer-enter-right",
  left: "drawer-enter-left",
  bottom: "drawer-enter-bottom",
};

const exitClass: Record<DrawerSide, string> = {
  right: "drawer-exit-right",
  left: "drawer-exit-left",
  bottom: "drawer-exit-bottom",
};

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
}: DrawerProps) {
  const { mounted, closing } = useOpenTransition(open, DRAWER_EXIT_MS);

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
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[110]"
    >
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/70 backdrop-blur-sm`}
      />
      <aside
        className={`${closing ? exitClass[side] : enterClass[side]} absolute ${sidePosition[side]} border-primary bg-bg-elevated text-fg shadow-[var(--shadow-glow)] flex flex-col`}
      >
        <header className="flex items-center justify-between px-3 py-2 border-b border-primary/40 bg-primary/10 shrink-0">
          <span className="text-xs uppercase tracking-widest text-primary">
            {title ?? "DRAWER"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-fg-muted hover:text-primary px-2 py-0.5 border border-transparent hover:border-primary/60 transition"
          >
            [×] CLOSE
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 text-sm text-fg-muted">
          {children}
        </div>
        {footer && (
          <footer className="px-4 py-3 border-t border-primary/30 flex gap-2 justify-end shrink-0">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}

const inspectorRows: [string, ReactNode][] = [
  ["id", "NODE-4F2A"],
  ["status", <span className="text-success">ONLINE</span>],
  ["ip", "10.0.0.42"],
  ["protocol", "ssh-2"],
  ["last seen", "47s ago"],
  ["cpu", "47%"],
  ["memory", "2.1 / 8 GB"],
  ["uptime", "47d 12h 03m"],
];

export default function DemoDrawer() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<DrawerSide>("right");

  const trigger = (s: DrawerSide) => {
    setSide(s);
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["right", "left", "bottom"] as DrawerSide[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => trigger(s)}
            className="px-3 py-1.5 border border-primary text-primary uppercase tracking-wider text-xs hover:bg-primary/10 transition"
          >
            ▸ OPEN {s.toUpperCase()}
          </button>
        ))}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`INSPECTOR · ${side.toUpperCase()}`}
        side={side}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-fg-muted hover:text-primary uppercase tracking-wider text-xs transition"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 bg-primary text-primary-fg uppercase tracking-wider text-xs hover:opacity-90 transition"
            >
              SAVE
            </button>
          </>
        }
      >
        <p className="text-xs uppercase tracking-widest text-primary mb-3">
          // node details
        </p>
        <dl className="space-y-0">
          {inspectorRows.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-4 border-b border-primary/10 py-1.5"
            >
              <dt className="text-fg-subtle uppercase text-xs tracking-wider">
                {k}
              </dt>
              <dd className="text-fg text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-fg-subtle">
          // press ESC, click the backdrop, or close from the header.
        </p>
      </Drawer>
    </div>
  );
}
