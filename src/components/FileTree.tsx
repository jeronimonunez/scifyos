import { useState, type ReactNode } from "react";

type GitStatus = "M" | "A" | "?" | "U";

type FileNode = {
  type: "file";
  name: string;
  size: string;
  content: string;
  status?: GitStatus;
};

type DirNode = {
  type: "dir";
  name: string;
  children: TreeNode[];
};

type TreeNode = FileNode | DirNode;

const readme = `# scifyos

A design system for things built after midnight.

## stack
- astro v6
- tailwind v4
- react (islands only)

## tokens
all colors, fonts, radii live in src/styles/global.css.
edit once, the whole site reflows.

## commands
$ pnpm dev      → dev server
$ pnpm build    → static build → dist/

press ⌘K anywhere for the command palette.
`;

const packageJson = `{
  "name": "scifyos",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev":   "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro":            "^6.3.5",
    "@astrojs/react":   "^5.0.5",
    "@tailwindcss/vite":"^4.3.0",
    "react":            "^19.2.6",
    "react-dom":        "^19.2.6",
    "tailwindcss":      "^4.3.0"
  }
}
`;

const astroConfig = `import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
`;

const globalCss = `@import "tailwindcss";

@theme {
  --color-primary:     oklch(0.87 0.30 142);  /* fluo green */
  --color-danger:      oklch(0.65 0.30 25);   /* fluo red  */
  --color-bg:          oklch(0.06 0 0);       /* near-black */
  --color-bg-elevated: oklch(0.12 0.02 142);
  --font-mono:         "JetBrains Mono", ui-monospace, monospace;
  --radius-md:         0;                     /* sharp corners */
  --shadow-glow:       0 0 0 1px ..., 0 0 24px ...;
}

/* CRT overlay, scanlines, breach pulse, toast-in keyframes…
   see full file for the complete set. */
`;

const modalTsx = `import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(/* dialog markup */, document.body);
}
`;

const commandPaletteTsx = `// ~270 lines — see full file.
//
// Portal-mounted searchable launcher. Listens for ⌘K / Ctrl+K
// on document and toggles open. Filters commands by label or
// group. ↑↓ to navigate, ⏎ to run, ESC to close.
//
// Mounted globally in src/layouts/Layout.astro so the shortcut
// works on every page.
//
// To add a command:
//
//   {
//     id: 'sys-clear',
//     group: 'SYSTEM',
//     label: 'Clear Local Storage',
//     action: () => { localStorage.clear(); location.reload(); }
//   }
`;

const breachAlertTsx = `import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const BREACH_EVENT = "scifyos:breach";

export default function BreachAlert() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onBreach = () => setOpen(true);
    window.addEventListener(BREACH_EVENT, onBreach);
    return () => window.removeEventListener(BREACH_EVENT, onBreach);
  }, []);

  if (!open) return null;
  return createPortal(/* red pulse + danger modal */, document.body);
}

// Fire from anywhere:
// window.dispatchEvent(new CustomEvent("scifyos:breach"));
`;

const preferencesTs = `export type Theme = "dark" | "light";
export type CRTState = "on" | "off";

export const THEME_EVENT = "scifyos:theme-change";
export const CRT_EVENT   = "scifyos:crt-change";

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("scifyos-theme", theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function applyCRT(state: CRTState) {
  document.documentElement.dataset.crt = state;
  localStorage.setItem("scifyos-crt", state);
  window.dispatchEvent(new CustomEvent(CRT_EVENT, { detail: state }));
}
`;

const playgroundTsx = `// Single file hosting the interactive demos:
//
//   Terminal       — fake CLI with help/whoami/ls/date/clear
//   Toggle         — animated switch
//   Progress       — ASCII progress bar
//   Stats          — live metric tiles, danger threshold at 85%
//   ActivityLog    — streaming feed (INFO / WARN / ERROR)
//   Tabs           — three-panel data switcher
//   ToastDemo      — four-level transient notifications
//
// Each is a self-contained export, so you can import just the
// ones you need on any page.
`;

const indexAstro = `---
import Layout from "../layouts/Layout.astro";
---

<Layout title="scifyos · theme">
  <h1 class="text-5xl tracking-tight uppercase">
    <span class="text-fg-subtle">&gt;</span>
    a <span class="text-primary">theme</span> for things
    built after midnight.
  </h1>
  <p class="text-fg-muted">…</p>
</Layout>
`;

const layoutAstro = `---
import "../styles/global.css";
import ThemeSwitcher  from "../components/ThemeSwitcher.tsx";
import CRTToggle      from "../components/CRTToggle.tsx";
import CommandPalette from "../components/CommandPalette.tsx";
---

<html lang="en">
  <head>
    <script is:inline>
      // restore theme + CRT before paint (no flash)
    </script>
  </head>
  <body class="bg-bg text-fg">
    <header>
      <nav>…</nav>
      <CommandPalette client:load />
      <CRTToggle      client:load />
      <ThemeSwitcher  client:load />
    </header>
    <main><slot /></main>
    <div class="crt-overlay">…</div>
  </body>
</html>
`;

const tsconfig = `{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
`;

const gitignore = `node_modules
dist
.astro
.DS_Store
*.log
`;

const placeholder = `// no preview available.
// open the real file at this path.
`;

const tree: DirNode = {
  type: "dir",
  name: "scifyos",
  children: [
    {
      type: "dir",
      name: "src",
      children: [
        {
          type: "dir",
          name: "components",
          children: [
            { type: "file", name: "BreachAlert.tsx", size: "2.7 KB", content: breachAlertTsx, status: "A" },
            { type: "file", name: "CommandPalette.tsx", size: "6.4 KB", content: commandPaletteTsx, status: "M" },
            { type: "file", name: "CRTToggle.tsx", size: "0.9 KB", content: placeholder, status: "M" },
            { type: "file", name: "FileTree.tsx", size: "5.8 KB", content: placeholder, status: "A" },
            { type: "file", name: "Modal.tsx", size: "1.8 KB", content: modalTsx, status: "M" },
            { type: "file", name: "Playground.tsx", size: "11.2 KB", content: playgroundTsx, status: "M" },
            { type: "file", name: "ThemeSwitcher.tsx", size: "0.9 KB", content: placeholder, status: "M" },
          ],
        },
        {
          type: "dir",
          name: "layouts",
          children: [
            { type: "file", name: "Layout.astro", size: "2.5 KB", content: layoutAstro, status: "M" },
          ],
        },
        {
          type: "dir",
          name: "lib",
          children: [
            { type: "file", name: "preferences.ts", size: "0.7 KB", content: preferencesTs, status: "A" },
          ],
        },
        {
          type: "dir",
          name: "pages",
          children: [
            { type: "file", name: "colors.astro", size: "1.5 KB", content: placeholder, status: "M" },
            { type: "file", name: "components.astro", size: "13.8 KB", content: placeholder, status: "M" },
            { type: "file", name: "index.astro", size: "1.3 KB", content: indexAstro, status: "M" },
            { type: "file", name: "playground.astro", size: "4.4 KB", content: placeholder, status: "M" },
            { type: "file", name: "typography.astro", size: "1.4 KB", content: placeholder, status: "M" },
          ],
        },
        {
          type: "dir",
          name: "styles",
          children: [
            { type: "file", name: "global.css", size: "4.6 KB", content: globalCss, status: "M" },
          ],
        },
      ],
    },
    { type: "file", name: ".gitignore", size: "0.2 KB", content: gitignore },
    { type: "file", name: "astro.config.mjs", size: "0.2 KB", content: astroConfig },
    { type: "file", name: "package.json", size: "0.5 KB", content: packageJson, status: "M" },
    { type: "file", name: "pnpm-lock.yaml", size: "94 KB", content: "# lockfile (94 KB)\n# elided for brevity", status: "?" },
    { type: "file", name: "README.md", size: "0.6 KB", content: readme },
    { type: "file", name: "tsconfig.json", size: "0.2 KB", content: tsconfig },
  ],
};

const INITIAL_EXPANDED = new Set([
  "/scifyos",
  "/scifyos/src",
  "/scifyos/src/components",
]);

function getExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1);
}

const extTag: Record<string, string> = {
  tsx: "TSX",
  ts: "TS",
  astro: "ASTRO",
  css: "CSS",
  json: "JSON",
  md: "MD",
  mjs: "JS",
  yaml: "YAML",
};

const extColor: Record<string, string> = {
  tsx: "text-accent",
  ts: "text-accent",
  astro: "text-primary",
  css: "text-success",
  json: "text-warning",
  md: "text-fg-muted",
  mjs: "text-warning",
  js: "text-warning",
  yaml: "text-fg-subtle",
};

const statusColor: Record<GitStatus, string> = {
  M: "text-warning",
  A: "text-success",
  "?": "text-fg-subtle",
  U: "text-danger",
};

/* ─────────────────────────────────────────────────────
   Lightweight syntax highlighter — no deps, no WASM.
   Combines a few regexes into one alternation; each
   capture group maps to a colour class.
   ───────────────────────────────────────────────────── */

const TOKEN_PATTERNS: Array<[string, string]> = [
  ["comment", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/.source],
  ["string", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/.source],
  ["atrule", /@[a-zA-Z][\w-]*/.source],
  ["cssvar", /--[a-zA-Z][\w-]*/.source],
  [
    "keyword",
    /\b(?:import|export|from|const|let|var|function|return|if|else|type|interface|default|async|await|true|false|null|undefined|new|class|extends|implements|public|private|protected|static|enum|namespace|in|of|for|while|switch|case|break|continue|throw|try|catch|finally|do|as|void|this|super|readonly)\b/.source,
  ],
  ["number", /\b\d+(?:\.\d+)?\b/.source],
];

const TOKEN_RE = new RegExp(
  TOKEN_PATTERNS.map(([, src]) => `(${src})`).join("|"),
  "g",
);

const tokenClass: Record<string, string> = {
  comment: "text-fg-subtle italic",
  string: "text-warning",
  atrule: "text-primary",
  cssvar: "text-success",
  keyword: "text-primary",
  number: "text-accent",
};

function tokenizeCode(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  let key = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > last) {
      out.push(text.slice(last, match.index));
    }
    let kind: string | null = null;
    for (let i = 1; i < match.length; i++) {
      if (match[i] !== undefined) {
        kind = TOKEN_PATTERNS[i - 1][0];
        break;
      }
    }
    out.push(
      <span key={key++} className={kind ? tokenClass[kind] : undefined}>
        {match[0]}
      </span>,
    );
    last = TOKEN_RE.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function tokenizeMarkdown(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => {
    let cls: string | undefined;
    if (line.startsWith("# ")) cls = "text-primary";
    else if (line.startsWith("## ")) cls = "text-primary/80";
    else if (line.startsWith("### ")) cls = "text-fg";
    else if (line.startsWith("- ")) cls = "text-fg-muted";
    else if (line.startsWith("$")) cls = "text-warning";
    else if (line.startsWith("//")) cls = "text-fg-subtle italic";
    return (
      <span key={i} className={cls}>
        {line}
        {"\n"}
      </span>
    );
  });
}

function Highlight({ text, lang }: { text: string; lang: string }) {
  if (lang === "md") return <>{tokenizeMarkdown(text)}</>;
  return <>{tokenizeCode(text)}</>;
}

type FileTreeProps = {
  /**
   * When true, fill the parent container instead of locking the panels
   * to h-96. Also forces the 2-column layout regardless of viewport
   * width and drops the outer border (the host container provides it).
   * Use inside something already bordered, like an OS window.
   */
  embedded?: boolean;
};

export default function FileTree({ embedded = false }: FileTreeProps = {}) {
  const [expanded, setExpanded] = useState<Set<string>>(INITIAL_EXPANDED);
  const [selected, setSelected] = useState<{ path: string; node: FileNode } | null>({
    path: "/scifyos/README.md",
    node: tree.children.find(
      (c) => c.type === "file" && c.name === "README.md",
    ) as FileNode,
  });

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: TreeNode, parentPath: string, depth: number): ReactNode => {
    const path = `${parentPath}/${node.name}`;
    if (node.type === "dir") {
      const isOpen = expanded.has(path);
      return (
        <div key={path}>
          <button
            type="button"
            onClick={() => toggle(path)}
            style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
            className="w-full flex items-center gap-1.5 py-0.5 pr-2 text-left text-sm hover:text-primary transition-colors"
          >
            <span className="text-fg-subtle w-3 text-center">
              {isOpen ? "▼" : "▶"}
            </span>
            <span className="text-primary">{node.name}/</span>
          </button>
          {isOpen &&
            node.children.map((c) => renderNode(c, path, depth + 1))}
        </div>
      );
    }
    const isSelected = selected?.path === path;
    const fileExt = getExt(node.name);
    const nameClass = isSelected
      ? "text-primary"
      : `${extColor[fileExt] ?? "text-fg-muted"} group-hover:text-primary`;
    return (
      <button
        key={path}
        type="button"
        onClick={() => setSelected({ path, node })}
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
        className={
          "group w-full flex items-center gap-1.5 py-0.5 pr-2 text-left text-sm transition-colors " +
          (isSelected ? "bg-primary/15" : "")
        }
      >
        <span className="text-fg-subtle">·</span>
        <span className={`flex-1 truncate transition-colors ${nameClass}`}>
          {node.name}
        </span>
        <span
          className={`w-3 text-center text-[10px] font-bold shrink-0 ${
            node.status ? statusColor[node.status] : "text-transparent"
          }`}
          aria-label={node.status ? `git status: ${node.status}` : undefined}
        >
          {node.status ?? " "}
        </span>
        <span className="text-[10px] text-fg-subtle shrink-0 w-12 text-right tabular-nums">
          {node.size}
        </span>
      </button>
    );
  };

  const ext = selected ? getExt(selected.node.name) : "";
  const lang = extTag[ext] ?? ext.toUpperCase();

  return (
    <div
      className={
        embedded
          ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] flex-1 min-h-0 bg-bg-elevated"
          : "grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border border-primary/40 bg-bg-elevated"
      }
    >
      {/* Tree panel */}
      <div
        className={
          embedded
            ? "flex flex-col min-h-0 border-r border-primary/30"
            : "flex flex-col border-b lg:border-b-0 lg:border-r border-primary/30"
        }
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-primary/30 bg-primary/10 shrink-0">
          <span className="text-xs uppercase tracking-widest text-fg-muted">
            ~/scifyos
          </span>
          <span className="text-[10px] uppercase tracking-widest text-fg-subtle">
            EXPLORER
          </span>
        </div>
        <div
          className={
            embedded
              ? "flex-1 min-h-0 overflow-y-auto py-1"
              : "h-96 overflow-y-auto py-1"
          }
        >
          {renderNode(tree, "", 0)}
        </div>
      </div>

      {/* Content panel */}
      <div className={embedded ? "flex flex-col min-w-0 min-h-0" : "flex flex-col min-w-0"}>
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-b border-primary/30 bg-primary/10 text-xs shrink-0">
          <span className="uppercase tracking-widest text-fg-muted truncate">
            {selected ? selected.path.slice(1) : "no file selected"}
          </span>
          {selected && (
            <span className="flex items-center gap-2 shrink-0">
              {lang && (
                <span className="text-[10px] uppercase tracking-widest text-primary border border-primary/40 px-1.5 py-0.5">
                  {lang}
                </span>
              )}
              <span className="text-[10px] uppercase tracking-widest text-fg-subtle">
                {selected.node.size}
              </span>
            </span>
          )}
        </div>
        <div
          className={
            embedded
              ? "flex-1 min-h-0 overflow-auto p-3"
              : "h-96 overflow-auto p-3"
          }
        >
          {selected ? (
            <pre className="text-xs text-fg-muted leading-relaxed"><code><Highlight text={selected.node.content} lang={ext} /></code></pre>
          ) : (
            <pre className="text-xs text-fg-subtle">{`$ awaiting input...
//
// pick a file from the tree on the left.`}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
