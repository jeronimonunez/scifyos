import { useEffect, useState } from "react";
import NotificationPanel from "./NotificationPanel";
import { BRANDING } from "../lib/branding";
import { PALETTE_OPEN_EVENT } from "./CommandPalette";

function WifiIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M2.5 6.5 Q8 2.5 13.5 6.5" />
      <path d="M4.5 9 Q8 6.5 11.5 9" />
      <path d="M6.5 11.5 Q8 10.5 9.5 11.5" />
      <circle cx="8" cy="13.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function BatteryIcon({ pct }: { pct: number }) {
  const fill = Math.max(0, Math.min(1, pct / 100));
  return (
    <svg
      viewBox="0 0 26 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="size-4"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="22" height="10" />
      <rect x="24" y="4" width="1.5" height="4" fill="currentColor" />
      <rect
        x="2.5"
        y="2.5"
        width={Math.max(0, 19 * fill)}
        height="7"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

const MENU_ITEMS = ["File", "Edit", "View", "Help"];

export default function OsTopBar() {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour12: false }));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-1.5 border-b border-primary/40 bg-bg-elevated/95 backdrop-blur text-xs uppercase tracking-wider shrink-0 relative z-20">
      <div className="flex items-center gap-4 min-w-0">
        <span className="font-bold text-primary flex items-center gap-1.5">
          <svg
            viewBox="0 0 14 14"
            fill="currentColor"
            className="size-3.5"
            aria-hidden="true"
          >
            <polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" />
          </svg>
          {BRANDING.name}
        </span>
        <nav className="hidden sm:flex items-center gap-3 text-fg-muted">
          {MENU_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              className="hover:text-primary transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-fg-muted shrink-0">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent(PALETTE_OPEN_EVENT))
          }
          aria-label="Open command palette"
          title="Open command palette (⌘K)"
          className="text-fg-muted hover:text-primary transition-colors"
        >
          ⌘K
        </button>
        <NotificationPanel />
        <span title="Network" className="flex items-center gap-1">
          <WifiIcon />
          <span className="hidden md:inline text-[10px]">scifynet</span>
        </span>
        <span title="Battery" className="flex items-center gap-1">
          <BatteryIcon pct={87} />
          <span className="text-[10px]">87%</span>
        </span>
        <span className="text-primary tabular-nums">{time}</span>
      </div>
    </div>
  );
}
