import { useEffect, useState, type ReactNode } from "react";
import { APPS, type AppId } from "../lib/apps";
import {
  WINDOWS_CHANGED_EVENT,
  WINDOWS_QUERY_EVENT,
  WINDOW_OPEN_EVENT,
  type OpenWindowInfo,
} from "./WindowManager";

type DockApp = {
  id: string;
  label: string;
  appId?: AppId;
  onClick?: () => void;
  icon: ReactNode;
};

function TerminalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-7"
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="19" height="16" />
      <polyline points="6,9 9,12 6,15" />
      <line x1="11.5" y1="15" x2="17" y2="15" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-7"
      aria-hidden="true"
    >
      <path d="M2 4 L9 4 L11 2 L22 2 L22 16 L2 16 Z" />
      <line x1="2" y1="6.5" x2="22" y2="6.5" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="size-7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </svg>
  );
}

function ExplorerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <rect x="6" y="11" width="4" height="4" fill="currentColor" />
      <rect x="14" y="11" width="4" height="4" />
      <rect x="6" y="17" width="4" height="2" />
      <rect x="14" y="17" width="4" height="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-7"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" />
      <polyline points="3,5 12,13 21,5" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-7"
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
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      className="size-7"
      aria-hidden="true"
    >
      <path d="M12 2 L18 14 L15 13 L12 20 L9 13 L6 14 Z" />
      <line x1="9" y1="9" x2="6" y2="11" />
      <line x1="15" y1="9" x2="18" y2="11" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-7"
      aria-hidden="true"
    >
      <polygon points="6,4 6,20 20,12" />
    </svg>
  );
}

function HackingIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className="size-7"
      aria-hidden="true"
    >
      {/* Hooded silhouette with face void via fill-rule:evenodd */}
      <path
        fillRule="evenodd"
        d="M16 3 C11 3 8 6 8 11 L8 20 Q8 21 9 21 L23 21 Q24 21 24 20 L24 11 C24 6 21 3 16 3 Z M10 11 L22 11 L22 18 L10 18 Z"
      />
      {/* Laptop: thin lid + trapezoid base */}
      <rect x="5" y="22" width="22" height="2" />
      <path d="M3 24 L29 24 L27 30 L5 30 Z" />
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
      className="size-2.5"
      aria-hidden="true"
    >
      <rect x="2.5" y="5.5" width="7" height="5" />
      <path d="M4 5.5 V3.5 A2 2 0 0 1 8 3.5 V5.5" />
      <line x1="6" y1="7.5" x2="6" y2="8.5" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-7"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.2" />
      <line x1="12" y1="2.5" x2="12" y2="5.5" />
      <line x1="12" y1="18.5" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5.5" y2="12" />
      <line x1="18.5" y1="12" x2="21.5" y2="12" />
      <line x1="5.2" y1="5.2" x2="7.3" y2="7.3" />
      <line x1="16.7" y1="16.7" x2="18.8" y2="18.8" />
      <line x1="5.2" y1="18.8" x2="7.3" y2="16.7" />
      <line x1="16.7" y1="7.3" x2="18.8" y2="5.2" />
    </svg>
  );
}

const DOCK_APPS: DockApp[] = [
  { id: "terminal",   label: "Terminal",   appId: "terminal",   icon: <TerminalIcon /> },
  { id: "files",      label: "Files",      appId: "files",      icon: <FolderIcon /> },
  { id: "explorer",   label: "Explorer",   appId: "explorer",   icon: <ExplorerIcon /> },
  { id: "logs",       label: "Logs",       appId: "logs",       icon: <LogsIcon /> },
  { id: "mail",       label: "Mail",       appId: "mail",       icon: <MailIcon /> },
  { id: "shipcraft",  label: "Shipcraft",  appId: "shipcraft",  icon: <ShipIcon /> },
  { id: "components", label: "Components", appId: "components", icon: <BoxIcon /> },
  { id: "playground", label: "Playground", appId: "playground", icon: <PlayIcon /> },
  { id: "hacking",    label: "Hacking",    appId: "hacking",    icon: <HackingIcon /> },
  { id: "settings",   label: "Settings",   appId: "settings",   icon: <CogIcon /> },
];

function DockItem({
  app,
  isOpen,
  isMinimized,
}: {
  app: DockApp;
  isOpen: boolean;
  isMinimized: boolean;
}) {
  const handleClick = () => {
    if (app.appId) {
      // Dispatching open on an already-open (possibly minimized) window
      // is handled by WindowManager — it focuses + unminimizes.
      window.dispatchEvent(
        new CustomEvent(WINDOW_OPEN_EVENT, { detail: { appId: app.appId } }),
      );
      return;
    }
    app.onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={app.label}
      className="block"
    >
      <span
        title={app.label}
        className="group relative flex items-center justify-center size-12 border border-primary/30 bg-bg/40 text-primary hover:border-primary hover:bg-primary/15 hover:scale-110 transition-all duration-150 cursor-pointer"
      >
        {app.icon}
        {app.appId && APPS[app.appId]?.passwordProtected && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 size-3.5 flex items-center justify-center border border-primary bg-bg-elevated text-primary"
          >
            <LockBadgeIcon />
          </span>
        )}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary border border-primary/40 bg-bg-elevated whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {app.label}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={
          "block mx-auto mt-1 size-1 transition-opacity " +
          (isMinimized ? "bg-warning " : "bg-primary ") +
          (isOpen ? "opacity-100" : "opacity-0")
        }
      />
    </button>
  );
}

export default function OsDock() {
  const [openWindows, setOpenWindows] = useState<OpenWindowInfo[]>([]);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: OpenWindowInfo[] }>).detail;
      if (detail?.open) setOpenWindows(detail.open);
    };
    window.addEventListener(WINDOWS_CHANGED_EVENT, onChange);
    // WindowManager may have mounted before us — ask it to broadcast now.
    window.dispatchEvent(new CustomEvent(WINDOWS_QUERY_EVENT));
    return () => window.removeEventListener(WINDOWS_CHANGED_EVENT, onChange);
  }, []);

  const openMap = new Map(openWindows.map((w) => [w.appId, w.minimized]));

  return (
    <div
      className="fixed left-1/2 bottom-4 -translate-x-1/2 z-30 flex items-end gap-2 px-3 py-2 border border-primary/40 bg-bg-elevated/85 backdrop-blur shadow-[var(--shadow-glow)] max-w-[calc(100%-2rem)]"
      aria-label="Dock"
    >
      {DOCK_APPS.map((app) => {
        const isOpen = app.appId !== undefined && openMap.has(app.appId);
        const isMinimized =
          app.appId !== undefined && openMap.get(app.appId) === true;
        return (
          <DockItem
            key={app.id}
            app={app}
            isOpen={isOpen}
            isMinimized={isMinimized}
          />
        );
      })}
    </div>
  );
}
