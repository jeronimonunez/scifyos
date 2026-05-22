import { useEffect, useState, type ReactNode } from "react";
import FullTerminal from "../components/FullTerminal";
import FileTree from "../components/FileTree";
import HackingApp from "../components/HackingApp";
import LogsApp from "../components/LogsApp";
import ShipcraftApp from "../components/ShipcraftApp";
import {
  applyCRT,
  applyCursor,
  applyTheme,
  CRT_EVENT,
  CURSOR_EVENT,
  THEME_EVENT,
  type CRTState,
  type CursorState,
  type Theme,
} from "./preferences";

export type AppId =
  | "terminal"
  | "files"
  | "components"
  | "playground"
  | "hacking"
  | "logs"
  | "shipcraft"
  | "about"
  | "settings";

export type AppDef = {
  id: AppId;
  title: string;
  defaultWidth: number;
  defaultHeight: number;
  Component: () => ReactNode;
  passwordProtected?: boolean;
};

function TerminalApp() {
  return <FullTerminal embedded />;
}

function FilesApp() {
  return <FileTree embedded />;
}

function ComponentsApp() {
  return (
    <div className="p-4 space-y-3 text-xs text-fg-muted">
      <div className="text-xs uppercase tracking-widest text-primary">
        // components
      </div>
      <ul className="space-y-1">
        <li>· buttons (4 variants)</li>
        <li>· cards (2 variants)</li>
        <li>· inputs (with $ prefix)</li>
        <li>· badges (5 tones)</li>
        <li>· modal / drawer / toast</li>
        <li>· command palette</li>
        <li>· file tree</li>
      </ul>
      <a
        href="/components"
        className="text-primary uppercase tracking-widest underline underline-offset-4 inline-block"
      >
        ▸ open components page
      </a>
    </div>
  );
}

function PlaygroundApp() {
  return (
    <div className="p-4 space-y-3 text-xs text-fg-muted">
      <div className="text-xs uppercase tracking-widest text-primary">
        // playground
      </div>
      <p>
        modal, drawer, toast, command palette, copy progress, glitch FX,
        matrix rain, audio static.
      </p>
      <a
        href="/playground"
        className="text-primary uppercase tracking-widest underline underline-offset-4 inline-block"
      >
        ▸ open playground
      </a>
    </div>
  );
}

function AboutApp() {
  return (
    <div className="p-4 text-xs text-fg-muted space-y-3">
      <div>
        <p className="text-primary text-sm uppercase tracking-widest">SCIFYOS</p>
        <p className="text-fg-subtle uppercase tracking-widest">v0.1.0-rc1</p>
      </div>
      <p>a design system for things built after midnight.</p>
      <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-[10px] uppercase tracking-widest">
        <dt className="text-fg-subtle">kernel</dt>
        <dd>scifyos 0.1.0</dd>
        <dt className="text-fg-subtle">uptime</dt>
        <dd>47d 12h 03m</dd>
        <dt className="text-fg-subtle">stack</dt>
        <dd>astro · react · tailwind</dd>
        <dt className="text-fg-subtle">memory</dt>
        <dd>2.1 / 8 GB</dd>
      </dl>
    </div>
  );
}

function SettingsApp() {
  const [theme, setLocalTheme] = useState<Theme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark",
  );
  const [crt, setLocalCRT] = useState<CRTState>(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.crt === "on"
      ? "on"
      : "off",
  );
  const [cursor, setLocalCursor] = useState<CursorState>(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.cursor === "on"
      ? "on"
      : "off",
  );

  useEffect(() => {
    const onTheme = (e: Event) =>
      setLocalTheme((e as CustomEvent<Theme>).detail);
    const onCRT = (e: Event) =>
      setLocalCRT((e as CustomEvent<CRTState>).detail);
    const onCursor = (e: Event) =>
      setLocalCursor((e as CustomEvent<CursorState>).detail);
    window.addEventListener(THEME_EVENT, onTheme);
    window.addEventListener(CRT_EVENT, onCRT);
    window.addEventListener(CURSOR_EVENT, onCursor);
    return () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      window.removeEventListener(CRT_EVENT, onCRT);
      window.removeEventListener(CURSOR_EVENT, onCursor);
    };
  }, []);

  return (
    <div className="p-4 text-xs space-y-4">
      <Row label="theme">
        <Pill active={theme === "dark"} onClick={() => applyTheme("dark")}>
          DARK
        </Pill>
        <Pill active={theme === "light"} onClick={() => applyTheme("light")}>
          LIGHT
        </Pill>
      </Row>
      <Row label="crt effect">
        <Pill active={crt === "on"} onClick={() => applyCRT("on")}>
          ON
        </Pill>
        <Pill active={crt === "off"} onClick={() => applyCRT("off")}>
          OFF
        </Pill>
      </Row>
      <Row label="custom cursor">
        <Pill active={cursor === "on"} onClick={() => applyCursor("on")}>
          ON
        </Pill>
        <Pill active={cursor === "off"} onClick={() => applyCursor("off")}>
          OFF
        </Pill>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-fg-muted uppercase tracking-widest w-32 text-[10px]">
        // {label}
      </span>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 border text-[10px] uppercase tracking-widest transition ${
        active
          ? "border-primary text-primary bg-primary/15"
          : "border-primary/30 text-fg-muted hover:text-primary hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}

export const APPS: Record<AppId, AppDef> = {
  terminal: { id: "terminal", title: "Terminal", defaultWidth: 600, defaultHeight: 400, Component: TerminalApp },
  files: { id: "files", title: "Files", defaultWidth: 720, defaultHeight: 460, Component: FilesApp },
  components: { id: "components", title: "Components", defaultWidth: 400, defaultHeight: 300, Component: ComponentsApp },
  playground: { id: "playground", title: "Playground", defaultWidth: 400, defaultHeight: 220, Component: PlaygroundApp },
  hacking: { id: "hacking", title: "Hacking", defaultWidth: 760, defaultHeight: 540, Component: HackingApp, passwordProtected: true },
  logs: { id: "logs", title: "Logs", defaultWidth: 640, defaultHeight: 460, Component: LogsApp },
  shipcraft: { id: "shipcraft", title: "Shipcraft", defaultWidth: 820, defaultHeight: 560, Component: ShipcraftApp },
  about: { id: "about", title: "About", defaultWidth: 360, defaultHeight: 280, Component: AboutApp },
  settings: { id: "settings", title: "Settings", defaultWidth: 380, defaultHeight: 240, Component: SettingsApp },
};
