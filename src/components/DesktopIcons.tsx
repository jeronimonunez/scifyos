import { useEffect, useRef, useState, type ReactNode } from "react";
import { APPS, type AppId } from "../lib/apps";
import { WINDOW_OPEN_EVENT } from "./WindowManager";

type IconDef = {
  id: string;
  appId: AppId;
  label: string;
  icon: ReactNode;
};

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <path d="M2 6 L11 6 L14 3 L30 3 L30 21 L2 21 Z" />
      <line x1="2" y1="8" x2="30" y2="8" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="28" height="18" />
      <polyline points="7,10 11,13 7,16" />
      <line x1="14" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13" />
      <line x1="16" y1="13" x2="16" y2="23" />
      <circle cx="16" cy="9" r="1.2" fill="currentColor" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="11" height="11" />
      <rect x="18" y="3" width="11" height="11" />
      <rect x="3" y="18" width="11" height="11" />
      <rect x="18" y="18" width="11" height="11" />
    </svg>
  );
}

function LockBadgeIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-3"
      aria-hidden="true"
    >
      <rect x="2.5" y="5.5" width="7" height="5" />
      <path d="M4 5.5 V3.5 A2 2 0 0 1 8 3.5 V5.5" />
      <line x1="6" y1="7.5" x2="6" y2="8.5" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" />
      <line x1="6.5" y1="7.5" x2="17.5" y2="7.5" />
      <line x1="6.5" y1="11" x2="17.5" y2="11" />
      <line x1="6.5" y1="14.5" x2="13.5" y2="14.5" />
      <line x1="6.5" y1="18" x2="11" y2="18" />
    </svg>
  );
}

function ShipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <path d="M12 2 L18 14 L15 13 L12 20 L9 13 L6 14 Z" />
      <line x1="9" y1="9" x2="6" y2="11" />
      <line x1="15" y1="9" x2="18" y2="11" />
    </svg>
  );
}

function HackingIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className="size-9 text-primary"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16 3 C11 3 8 6 8 11 L8 20 Q8 21 9 21 L23 21 Q24 21 24 20 L24 11 C24 6 21 3 16 3 Z M10 11 L22 11 L22 18 L10 18 Z"
      />
      <rect x="5" y="22" width="22" height="2" />
      <path d="M3 24 L29 24 L27 30 L5 30 Z" />
    </svg>
  );
}

const ICONS: IconDef[] = [
  { id: "ico-about", appId: "about", label: "About", icon: <InfoIcon /> },
  { id: "ico-files", appId: "files", label: "Files", icon: <FolderIcon /> },
  { id: "ico-terminal", appId: "terminal", label: "Terminal", icon: <TerminalIcon /> },
  { id: "ico-logs", appId: "logs", label: "Logs", icon: <LogsIcon /> },
  { id: "ico-shipcraft", appId: "shipcraft", label: "Shipcraft", icon: <ShipIcon /> },
  { id: "ico-components", appId: "components", label: "Components", icon: <BoxIcon /> },
  { id: "ico-hacking", appId: "hacking", label: "Hacking", icon: <HackingIcon /> },
];

type Positions = Record<string, { x: number; y: number }>;

const STORAGE_KEY = "scifyos-desktop-icons";
const ICON_WIDTH = 84;
const ICON_HEIGHT = 84;
const GUTTER = 12;
const ORIGIN_X = 20;
const ORIGIN_Y = 20;

function defaultPositions(): Positions {
  const out: Positions = {};
  ICONS.forEach((icon, i) => {
    out[icon.id] = {
      x: ORIGIN_X,
      y: ORIGIN_Y + i * (ICON_HEIGHT + GUTTER),
    };
  });
  return out;
}

function loadPositions(): Positions {
  if (typeof window === "undefined") return defaultPositions();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPositions();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultPositions();
    return { ...defaultPositions(), ...parsed };
  } catch {
    return defaultPositions();
  }
}

export default function DesktopIcons() {
  // First paint must match the SSR'd HTML — render defaults, then swap in
  // the persisted positions after hydration to avoid a hydration mismatch.
  const [positions, setPositions] = useState<Positions>(defaultPositions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setPositions(loadPositions());
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch {}
  }, [positions]);

  // Clicking the empty desktop deselects
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-desktop-icon]")) {
        setSelectedId(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <>
      {ICONS.map((def, i) => {
        const fallback = {
          x: ORIGIN_X,
          y: ORIGIN_Y + i * (ICON_HEIGHT + GUTTER),
        };
        return (
          <DesktopIcon
            key={def.id}
            def={def}
            pos={positions[def.id] ?? fallback}
            selected={selectedId === def.id}
            onSelect={() => setSelectedId(def.id)}
            onMove={(x, y) =>
              setPositions((p) => ({ ...p, [def.id]: { x, y } }))
            }
          />
        );
      })}
    </>
  );
}

type DesktopIconProps = {
  def: IconDef;
  pos: { x: number; y: number };
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
};

const DOUBLE_CLICK_MS = 350;
const DRAG_THRESHOLD = 5;

function DesktopIcon({
  def,
  pos,
  selected,
  onSelect,
  onMove,
}: DesktopIconProps) {
  const lastClickRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onSelect();
    const startX = pos.x;
    const startY = pos.y;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    let dragged = false;

    const onMoveHandler = (ev: PointerEvent) => {
      const dx = ev.clientX - mouseX;
      const dy = ev.clientY - mouseY;
      if (
        !dragged &&
        (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
      ) {
        dragged = true;
      }
      if (dragged) {
        onMove(Math.max(0, startX + dx), Math.max(0, startY + dy));
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMoveHandler);
      window.removeEventListener("pointerup", onUp);
      if (!dragged) {
        const now = Date.now();
        if (now - lastClickRef.current < DOUBLE_CLICK_MS) {
          // Double click — open the app.
          window.dispatchEvent(
            new CustomEvent(WINDOW_OPEN_EVENT, {
              detail: { appId: def.appId },
            }),
          );
          lastClickRef.current = 0;
        } else {
          lastClickRef.current = now;
        }
      }
    };

    window.addEventListener("pointermove", onMoveHandler);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <button
      type="button"
      data-desktop-icon
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: ICON_WIDTH,
      }}
      className={`group flex flex-col items-center gap-1 px-2 py-2 border border-transparent select-none touch-none transition-colors ${
        selected
          ? "border-primary/50 bg-primary/15"
          : "hover:bg-primary/5"
      }`}
      aria-label={`Open ${def.label}`}
    >
      <div className="relative text-primary group-hover:scale-105 transition-transform">
        {def.icon}
        {APPS[def.appId]?.passwordProtected && (
          <span
            aria-label="password protected"
            title="Password required"
            className="absolute -top-1 -right-1 size-4 flex items-center justify-center border border-primary bg-bg-elevated text-primary"
          >
            <LockBadgeIcon />
          </span>
        )}
      </div>
      <span
        className={`text-[10px] uppercase tracking-widest text-center ${
          selected
            ? "text-primary"
            : "text-fg-muted group-hover:text-primary"
        }`}
      >
        {def.label}
      </span>
    </button>
  );
}
