import { useEffect, useRef, useState } from "react";
import { APPS, type AppId } from "../lib/apps";
import Window, { type WindowState } from "./Window";

export const WINDOW_OPEN_EVENT = "scifyos:window:open";
export const WINDOW_CLOSE_EVENT = "scifyos:window:close";
export const WINDOWS_CHANGED_EVENT = "scifyos:windows:changed";
export const WINDOWS_QUERY_EVENT = "scifyos:windows:query";
export const PASSWORD_PROMPT_EVENT = "scifyos:password:prompt";

export type OpenWindowInfo = { appId: AppId; minimized: boolean };
export type OpenWindowDetail = { appId?: AppId; unlocked?: boolean };
export type PasswordPromptDetail = { appId: AppId };

const POSITIONS_KEY = "scifyos-os-window-positions";
const SAVE_DEBOUNCE_MS = 200;
const BASE_Z = 100;

// Collision-free across Vite HMR reloads (a module-scoped counter would reset
// while React preserved the existing windows state, producing duplicate keys).
function nextWindowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `w-${crypto.randomUUID()}`;
  }
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ─────────────────────────────────────────────────────────
   Position persistence. Each app remembers its last x/y/w/h
   in localStorage so reopening lands the window where the
   user left it — across reloads.

   We write to a ref synchronously inside open/move handlers
   so reads are always fresh, and persist to localStorage
   from a debounced effect so dragging doesn't hammer it
   30+ times per second.
   ───────────────────────────────────────────────────────── */

type StoredPos = { x: number; y: number; width: number; height: number };
type StoredPositions = Partial<Record<AppId, StoredPos>>;

function isValidPos(v: unknown): v is StoredPos {
  if (!v || typeof v !== "object") return false;
  const p = v as Partial<StoredPos>;
  return (
    typeof p.x === "number" &&
    typeof p.y === "number" &&
    typeof p.width === "number" &&
    typeof p.height === "number"
  );
}

function clampPos(p: StoredPos): StoredPos {
  if (typeof window === "undefined") return p;
  // Keep at least ~60px visible inside the viewport so the
  // user can always grab the title bar after a resize.
  const maxX = Math.max(0, window.innerWidth - 60);
  const maxY = Math.max(0, window.innerHeight - 60);
  return {
    x: Math.max(0, Math.min(maxX, p.x)),
    y: Math.max(0, Math.min(maxY, p.y)),
    width: p.width,
    height: p.height,
  };
}

function loadPositions(): StoredPositions {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: StoredPositions = {};
    for (const key of Object.keys(parsed)) {
      if (!(key in APPS)) continue;
      const v = (parsed as Record<string, unknown>)[key];
      if (isValidPos(v)) out[key as AppId] = clampPos(v);
    }
    return out;
  } catch {
    return {};
  }
}

function savePositions(positions: StoredPositions) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  } catch {}
}

export default function WindowManager() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const topZRef = useRef(BASE_Z);

  // Position cache — loaded once, mutated on open/move, persisted
  // via the debounced effect below.
  const positionsRef = useRef<StoredPositions | null>(null);
  if (positionsRef.current === null) {
    positionsRef.current = loadPositions();
  }

  // Keep a ref of the latest windows so the query event handler
  // (registered once on mount) can respond with current state.
  const windowsRef = useRef<WindowState[]>(windows);
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  // Debounced save. Every `windows` change reschedules; if drags
  // keep firing changes, the timer keeps resetting and only one
  // write happens after the user lets go.
  useEffect(() => {
    if (!positionsRef.current) return;
    const id = window.setTimeout(() => {
      if (positionsRef.current) savePositions(positionsRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [windows]);

  // Broadcast current open windows so the dock can render running
  // indicators / minimize state without owning the state itself.
  useEffect(() => {
    const open: OpenWindowInfo[] = windows.map((w) => ({
      appId: w.appId as AppId,
      minimized: w.minimized ?? false,
    }));
    window.dispatchEvent(
      new CustomEvent(WINDOWS_CHANGED_EVENT, { detail: { open } }),
    );
  }, [windows]);

  // Components that mount after WindowManager (e.g. OsDock) can fire
  // a query event to grab the current state.
  useEffect(() => {
    const onQuery = () => {
      const open: OpenWindowInfo[] = windowsRef.current.map((w) => ({
        appId: w.appId as AppId,
        minimized: w.minimized ?? false,
      }));
      window.dispatchEvent(
        new CustomEvent(WINDOWS_CHANGED_EVENT, { detail: { open } }),
      );
    };
    window.addEventListener(WINDOWS_QUERY_EVENT, onQuery);
    return () => window.removeEventListener(WINDOWS_QUERY_EVENT, onQuery);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenWindowDetail | undefined>).detail;
      if (!detail?.appId) return;
      const app = APPS[detail.appId];
      if (!app) return;

      // Gate password-protected apps unless: the window is already open
      // (re-focus from dock/start menu), or the prompt just unlocked it.
      const alreadyOpen = windowsRef.current.some(
        (w) => w.appId === detail.appId,
      );
      if (app.passwordProtected && !alreadyOpen && !detail.unlocked) {
        window.dispatchEvent(
          new CustomEvent<PasswordPromptDetail>(PASSWORD_PROMPT_EVENT, {
            detail: { appId: detail.appId },
          }),
        );
        return;
      }

      setWindows((prev) => {
        topZRef.current += 1;
        const nextZ = topZRef.current;
        const existing = prev.find((w) => w.appId === detail.appId);
        if (existing) {
          // Focus existing AND clear any minimized flag — clicking
          // the dock or start menu on a minimized window restores it.
          return prev.map((w) =>
            w.id === existing.id
              ? { ...w, z: nextZ, minimized: false }
              : w,
          );
        }
        const stored = positionsRef.current?.[detail.appId];
        const offset = prev.length * 28;
        const x = stored?.x ?? 60 + (offset % 200);
        const y = stored?.y ?? 50 + (offset % 140);
        const width = stored?.width ?? app.defaultWidth;
        const height = stored?.height ?? app.defaultHeight;

        // Seed the cache so the cascading default also gets saved.
        if (positionsRef.current) {
          positionsRef.current[detail.appId] = { x, y, width, height };
        }

        return [
          ...prev,
          {
            id: nextWindowId(),
            appId: app.id,
            title: app.title,
            x,
            y,
            width,
            height,
            z: nextZ,
          },
        ];
      });
    };

    const onClose = (e: Event) => {
      const detail = (e as CustomEvent<{ id?: string; appId?: AppId } | undefined>).detail;
      if (!detail) return;
      setWindows((prev) =>
        prev.filter(
          (w) =>
            !(detail.id && w.id === detail.id) &&
            !(detail.appId && w.appId === detail.appId),
        ),
      );
    };

    window.addEventListener(WINDOW_OPEN_EVENT, onOpen);
    window.addEventListener(WINDOW_CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(WINDOW_OPEN_EVENT, onOpen);
      window.removeEventListener(WINDOW_CLOSE_EVENT, onClose);
    };
  }, []);

  const close = (id: string) =>
    setWindows((ws) => ws.filter((w) => w.id !== id));

  const focus = (id: string) => {
    topZRef.current += 1;
    const newZ = topZRef.current;
    setWindows((ws) =>
      ws.map((w) =>
        w.id === id ? { ...w, z: newZ, minimized: false } : w,
      ),
    );
  };

  const minimize = (id: string) => {
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    );
  };

  const toggleMaximize = (id: string) => {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          // Restore previous position/size.
          const pre = w.preMaximize;
          return {
            ...w,
            maximized: false,
            preMaximize: undefined,
            x: pre?.x ?? w.x,
            y: pre?.y ?? w.y,
            width: pre?.width ?? w.width,
            height: pre?.height ?? w.height,
          };
        }
        return {
          ...w,
          maximized: true,
          preMaximize: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      }),
    );
  };

  const move = (id: string, x: number, y: number) => {
    setWindows((ws) => {
      const updated = ws.map((w) => (w.id === id ? { ...w, x, y } : w));
      const moved = updated.find((w) => w.id === id);
      if (moved && positionsRef.current) {
        positionsRef.current[moved.appId as AppId] = {
          x,
          y,
          width: moved.width,
          height: moved.height,
        };
      }
      return updated;
    });
  };

  return (
    <>
      {windows.map((w) => {
        const app = APPS[w.appId as AppId];
        if (!app) return null;
        const Component = app.Component;
        return (
          <Window
            key={w.id}
            win={w}
            onClose={() => close(w.id)}
            onMinimize={() => minimize(w.id)}
            onMaximize={() => toggleMaximize(w.id)}
            onFocus={() => focus(w.id)}
            onMove={(x, y) => move(w.id, x, y)}
          >
            <Component />
          </Window>
        );
      })}
    </>
  );
}
