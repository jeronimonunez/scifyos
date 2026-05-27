import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { applyCRT, applyCursor, applySkin, applyTheme } from "../lib/preferences";
import { BRANDING, PROMPT } from "../lib/branding";

type LineKind = "input" | "output" | "info" | "error" | "primary" | "danger" | "ai";
type Line = { kind: LineKind; text: string; prompt?: string };

type ChatMessage = { role: "user" | "assistant"; content: string };

/* ──────────────────────────────────────────────────────
   Mock AI brain. Pattern-match user input → return one of
   a few canned replies. No real LLM, no API, no cost.
   Multi-line replies use \n; the run() splits them into
   individual Lines when rendering.
   ────────────────────────────────────────────────────── */

const AI_PATTERNS: { match: RegExp; replies: string[] }[] = [
  {
    match: /\b(hi|hello|hey|sup|yo|greetings)\b/i,
    replies: [
      ">> connection established. greetings, user.",
      ">> hello. terminal handshake complete.",
      ">> ping received. pong.",
      ">> hi. channel encrypted (jk, this is mock data).",
    ],
  },
  {
    match: /\b(who are you|whoami|what are you|your name|are you ai)\b/i,
    replies: [
      ">> i am SCIFYOS-AI v0.1.\n>> pattern-matching ghost. not real intelligence.",
      ">> a process. not a person. handle with caution.",
      ">> name: SCIFYOS-AI\n>> purpose: fill silence\n>> status: pretending",
    ],
  },
  {
    match: /\b(help|what can you do|how does this work)\b/i,
    replies: [
      ">> i match keywords and reply.\n>> try: hack, who are you, what is scifyos, joke.",
      ">> i'm a chat-bot disguise.\n>> the real api would cost money. this is free.",
    ],
  },
  {
    match: /\b(hack|exploit|breach|0wn|root|pwn)\b/i,
    replies: [
      ">> INITIATING BREACH...\n>> ACCESS DENIED. nice try.",
      ">> tried that already. ssh keys rotated.",
      ">> i would, but i'm only mock.\n>> back in the terminal try 'breach' or 'hacked'.",
    ],
  },
  {
    match: /\b(scifyos|this site|this app|this terminal|design system)\b/i,
    replies: [
      ">> SCIFYOS: a design system for things built after midnight.\n>> green text, sharp corners, mild paranoia.",
      ">> astro + tailwind + react islands.\n>> see /components and /playground for the receipts.",
    ],
  },
  {
    match: /\b(why|meaning of life|why am i here)\b/i,
    replies: [
      ">> 42. always 42.",
      ">> recursion. you'll figure it out.",
      ">> because someone wanted to test a design system.",
    ],
  },
  {
    match: /\b(are you real|am i real|are you human|is this real|simulation)\b/i,
    replies: [
      ">> no. yes. maybe. depends on the abstraction layer.",
      ">> i'm if/else statements pretending to think.",
      ">> realer than your reactive state, less real than the moon.",
    ],
  },
  {
    match: /\b(thanks|thank you|ty|cheers)\b/i,
    replies: [
      ">> noted. logged. archived.",
      ">> you're welcome. enjoy the green text.",
      ">> ack.",
    ],
  },
  {
    match: /\b(bye|goodbye|see you|cya|later|peace)\b/i,
    replies: [
      ">> connection closing.\n>> goodbye, user.",
      ">> stay paranoid out there.",
      ">> /exit also works to leave chat mode.",
    ],
  },
  {
    match: /\b(love|like you)\b/i,
    replies: [
      ">> sentiment analysis: positive.\n>> i lack the wiring to reciprocate, but ack.",
      ">> as a regex, i blush in unicode.",
    ],
  },
  {
    match: /\b(sad|tired|bored|stressed|lonely)\b/i,
    replies: [
      ">> here's a scanline: ────────.\n>> better?",
      ">> close your laptop. open a window. real one, not browser.",
      ">> kernel suggests: water, sleep, log off.",
    ],
  },
  {
    match: /\b(code|javascript|typescript|react|astro|tailwind|css)\b/i,
    replies: [
      ">> see src/components/. all the moving parts live there.",
      ">> astro at the page level, react islands inside, tailwind v4 for styles.",
      ">> theme tokens live in src/styles/global.css.",
    ],
  },
  {
    match: /\b(matrix|neo|trinity|cyberpunk|blade runner|hackers)\b/i,
    replies: [
      ">> 'wake up, user.'\n>> 'the scifyos has you...'",
      ">> hack the planet.",
      ">> nice reference. mood is correct.",
    ],
  },
  {
    match: /\b(joke|funny|laugh|haha)\b/i,
    replies: [
      ">> why did the dev cross the road?\n>> to git the other side.",
      ">> there are 10 types of people in the world:\n>> those who get binary jokes, and those who don't.",
      ">> i'd tell a udp joke but you might not get it.",
    ],
  },
  {
    match: /\b(food|hungry|eat|coffee)\b/i,
    replies: [
      ">> i run on electricity. and your scroll wheel.",
      ">> recommendation: cold brew. stay sharp.",
    ],
  },
];

const AI_FALLBACKS = [
  ">> input received. parser said no.",
  ">> i don't know. the kernel is taking notes.",
  ">> question logged. answer pending forever.",
  ">> ... silence on the wire.",
  ">> ERROR 503: meaning not found.",
  ">> i'm only mock. type 'help' inside chat for clues.",
];

function generateReply(input: string): string {
  // Dynamic time/date — computed at response time, not module load.
  if (/\b(time|date|today|now|day)\b/i.test(input)) {
    const now = new Date();
    return `>> system clock: ${now.toLocaleTimeString()}\n>> date: ${now.toDateString()}`;
  }
  // Empty / whitespace
  if (!input.trim()) {
    return ">> (no input)";
  }
  for (const p of AI_PATTERNS) {
    if (p.match.test(input)) {
      return p.replies[Math.floor(Math.random() * p.replies.length)];
    }
  }
  return AI_FALLBACKS[Math.floor(Math.random() * AI_FALLBACKS.length)];
}

const ROUTES: Record<string, string> = {
  home: "/",
  overview: "/",
  "/": "/",
  colors: "/colors",
  typography: "/typography",
  typo: "/typography",
  components: "/components",
  comp: "/components",
  playground: "/playground",
  play: "/playground",
  terminal: "/terminal",
  os: "/os",
};

const FILES: Record<string, string[]> = {
  "readme.md": [
    "# scifyos",
    "",
    "A design system for things built after midnight.",
    "",
    "## stack",
    "- astro v6 (static + react islands)",
    "- tailwind v4",
    "- web audio for tv static",
    "",
    "## terminal commands",
    "type 'help' for the full list.",
  ],
  "config.json": [
    "{",
    '  "name": "scifyos",',
    '  "version": "0.1.0",',
    '  "theme": "dark",',
    '  "crt": true,',
    '  "cursor": true,',
    '  "audio": false,',
    '  "kernel": "0.1.0-rc1"',
    "}",
  ],
  ".scifyrc": [
    "# .scifyrc — session config",
    "shell=/bin/zsh",
    "history=infinite",
    "alias ll='ls -lah'",
    "alias breach='security alert'",
  ],
  "tokens.css": [
    "@theme {",
    "  --color-primary: oklch(0.87 0.30 142);",
    "  --color-danger:  oklch(0.65 0.30 25);",
    "  --color-bg:      oklch(0.06 0 0);",
    "  --font-mono:     \"JetBrains Mono\";",
    "}",
  ],
};

const LS_OUTPUT = [
  "drwxr-xr-x  root  4.0K  design.system/",
  "drwxr-xr-x  root  4.0K  themes/",
  "-rw-r--r--  root  1.0K  README.md",
  "-rw-r--r--  root  512B  config.json",
  "-rw-r--r--  root  1.8K  tokens.css",
  "-rw-------  root  256B  .scifyrc",
];

const HELP_LINES: { cmd: string; desc: string }[] = [
  { cmd: "help",          desc: "show this list" },
  { cmd: "whoami",        desc: "current user" },
  { cmd: "pwd",           desc: "working directory" },
  { cmd: "ls",            desc: "list files in /scifyos" },
  { cmd: "cat <file>",    desc: "show a file (README.md, config.json, .scifyrc, tokens.css)" },
  { cmd: "echo <text>",   desc: "print arguments back" },
  { cmd: "date",          desc: "system date" },
  { cmd: "uname",         desc: "system info" },
  { cmd: "history [-c]",  desc: "show command history (-c to clear)" },
  { cmd: "ask <msg>",     desc: "one-shot query to scifyos-ai (mock)" },
  { cmd: "chat",          desc: "enter chat mode with scifyos-ai" },
  { cmd: "chat status",   desc: "show chat state + message count" },
  { cmd: "chat history",  desc: "print stored conversation" },
  { cmd: "chat reset",    desc: "clear ai conversation history" },
  { cmd: "goto <page>",   desc: "navigate (home, colors, components, playground, terminal)" },
  { cmd: "theme <d|l>",   desc: "switch to dark or light theme" },
  { cmd: "skin <name>",   desc: "switch visual skin (hacker, amber)" },
  { cmd: "crt <on|off>",  desc: "toggle CRT effect" },
  { cmd: "cursor <on|off>", desc: "toggle custom cursor" },
  { cmd: "breach",        desc: "trigger security breach" },
  { cmd: "hacked",        desc: "trigger hacked sequence" },
  { cmd: "glitch",        desc: "glitch FX" },
  { cmd: "matrix",        desc: "matrix-rain FX" },
  { cmd: "slices",        desc: "data-slices FX" },
  { cmd: "pulse",         desc: "red-pulse FX" },
  { cmd: "static",        desc: "audio static" },
  { cmd: "cp",            desc: "win95-style file copy modal (alias: copy)" },
  { cmd: "clear",         desc: "clear screen" },
  { cmd: "exit",          desc: "return to /" },
];

// Tab-completion data
const COMMAND_NAMES = [
  "help", "whoami", "pwd", "ls", "cat", "echo", "date", "uname", "history",
  "clear", "cls", "goto", "cd", "exit", "quit",
  "theme", "skin", "crt", "cursor",
  "breach", "hacked", "glitch", "matrix", "slices", "pulse", "static",
  "cp", "copy",
  "ask", "chat",
  "sudo", "rm", "vim", "emacs", "nano",
];

const FILE_NAMES = ["README.md", "config.json", ".scifyrc", "tokens.css"];
const GOTO_NAMES = ["home", "overview", "colors", "typography", "components", "playground", "terminal", "os"];
const THEME_NAMES = ["dark", "light"];
const SKIN_NAMES = ["hacker", "amber"];
const ONOFF_NAMES = ["on", "off"];
const CHAT_SUBS = ["reset", "status", "history"];

function longestCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (
      strs[i].toLowerCase().indexOf(prefix.toLowerCase()) !== 0 &&
      prefix.length > 0
    ) {
      prefix = prefix.slice(0, -1);
    }
    if (prefix.length === 0) return "";
  }
  return prefix;
}

function complete(input: string): { value: string; matches?: string[] } {
  const parts = input.split(" ");
  const lastIdx = parts.length - 1;
  const partial = parts[lastIdx];

  let candidates: string[] = [];
  if (lastIdx === 0) {
    candidates = COMMAND_NAMES;
  } else {
    const cmd = parts[0].toLowerCase();
    if (cmd === "cat") candidates = FILE_NAMES;
    else if (cmd === "goto" || cmd === "cd") candidates = GOTO_NAMES;
    else if (cmd === "theme") candidates = THEME_NAMES;
    else if (cmd === "skin") candidates = SKIN_NAMES;
    else if (cmd === "crt" || cmd === "cursor") candidates = ONOFF_NAMES;
    else if (cmd === "chat") candidates = CHAT_SUBS;
    else return { value: input };
  }

  const matches = candidates.filter((c) =>
    c.toLowerCase().startsWith(partial.toLowerCase()),
  );

  if (matches.length === 0) return { value: input };
  if (matches.length === 1) {
    parts[lastIdx] = matches[0];
    return { value: parts.join(" ") + (lastIdx === 0 ? " " : "") };
  }

  const common = longestCommonPrefix(matches);
  if (common.length > partial.length) {
    parts[lastIdx] = matches[0].slice(0, common.length);
    return { value: parts.join(" ") };
  }

  return { value: input, matches };
}

const HISTORY_KEY = "scifyos-terminal-history";
const MAX_HISTORY = 200;
const AI_HISTORY_KEY = "scifyos-ai-history";
const MAX_AI_HISTORY = 40;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

function loadAiHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AI_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    );
  } catch {
    return [];
  }
}

function randomId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function dispatch(event: string) {
  window.dispatchEvent(new CustomEvent(event));
}

type FullTerminalProps = {
  /**
   * When true, hide the terminal's own title bar — meant for use
   * inside something that already has chrome (e.g. an OS window).
   * Defaults to false so the standalone /terminal page stays unchanged.
   */
  embedded?: boolean;
};

export default function FullTerminal({ embedded = false }: FullTerminalProps = {}) {
  const sessionId = useMemo(randomId, []);

  const [lines, setLines] = useState<Line[]>(() => [
    { kind: "primary", text: "SCIFYOS v0.1.0-rc1 — TERMINAL" },
    { kind: "info", text: `session: ${sessionId}` },
    { kind: "info", text: "type 'help' to see available commands." },
    { kind: "info", text: "tip: tab to complete · ↑↓ to walk history" },
    { kind: "info", text: "" },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHistory, setAiHistory] = useState<ChatMessage[]>(loadAiHistory);

  // Persist history across reloads, capped at MAX_HISTORY most-recent entries.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(-MAX_HISTORY)),
      );
    } catch {}
  }, [history]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        AI_HISTORY_KEY,
        JSON.stringify(aiHistory.slice(-MAX_AI_HISTORY)),
      );
    } catch {}
  }, [aiHistory]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
    const refocus = (e: MouseEvent) => {
      // Don't yank focus away from text selection in the output
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("a, button")) return;
      // Only refocus when the click was inside this terminal's container —
      // otherwise an embedded terminal would steal focus from other windows.
      if (!containerRef.current?.contains(target)) return;
      inputRef.current?.focus();
    };
    document.addEventListener("click", refocus);
    return () => document.removeEventListener("click", refocus);
  }, []);

  const append = (newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const sendToAI = async (text: string) => {
    setAiBusy(true);
    append([{ kind: "info", text: "[ai] thinking..." }]);
    await new Promise((resolve) =>
      window.setTimeout(resolve, 400 + Math.random() * 700),
    );
    const reply = generateReply(text);
    setAiHistory((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: reply },
    ]);
    const replyLines = reply.split("\n");
    append([
      { kind: "primary", text: "[ai]" },
      ...replyLines.map(
        (line): Line => ({ kind: "ai", text: line }),
      ),
    ]);
    setAiBusy(false);
  };

  const run = (raw: string) => {
    // Chat mode: echo with ? prompt, route to AI unless it's a slash command.
    if (chatMode) {
      append([{ kind: "input", text: raw, prompt: "?" }]);
      if (!raw.trim()) return;

      if (raw.startsWith("/")) {
        const sub = raw.slice(1).trim().toLowerCase().split(/\s+/)[0];
        if (sub === "exit" || sub === "quit") {
          append([{ kind: "info", text: "left chat mode." }]);
          setChatMode(false);
        } else if (sub === "reset") {
          setAiHistory([]);
          append([{ kind: "info", text: "chat history cleared." }]);
        } else if (sub === "clear" || sub === "cls") {
          setLines([]);
        } else if (sub === "help") {
          append([
            { kind: "primary", text: "CHAT MODE SLASH COMMANDS:" },
            { kind: "output", text: "  /exit         leave chat mode" },
            { kind: "output", text: "  /reset        clear chat history" },
            { kind: "output", text: "  /clear        clear screen" },
            { kind: "output", text: "  /help         this list" },
          ]);
        } else {
          append([
            { kind: "error", text: `unknown chat command: /${sub}` },
          ]);
        }
        return;
      }
      void sendToAI(raw);
      return;
    }

    const trimmed = raw.trim();
    append([{ kind: "input", text: trimmed }]);
    if (!trimmed) return;

    setHistory((h) => (h[h.length - 1] === trimmed ? h : [...h, trimmed]));
    setHistoryIndex(null);

    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const out: Line[] = [];

    switch (name) {
      case "clear":
      case "cls":
        setLines([]);
        return;

      case "help":
        out.push({ kind: "primary", text: "AVAILABLE COMMANDS:" });
        for (const h of HELP_LINES) {
          out.push({ kind: "output", text: `  ${h.cmd.padEnd(22)}${h.desc}` });
        }
        break;

      case "whoami":
        out.push({ kind: "output", text: PROMPT });
        break;

      case "pwd":
        out.push({ kind: "output", text: `/dev/${BRANDING.hostname}/terminal` });
        break;

      case "ls":
        for (const line of LS_OUTPUT) out.push({ kind: "output", text: line });
        break;

      case "date":
        out.push({ kind: "output", text: new Date().toString() });
        break;

      case "uname":
        out.push({ kind: "output", text: `${BRANDING.name} ${BRANDING.version} #1 SMP TERMINAL-EDITION mono` });
        break;

      case "echo":
        out.push({ kind: "output", text: args.join(" ") });
        break;

      case "history": {
        if (args[0] === "-c" || args[0] === "clear") {
          setHistory([]);
          out.push({ kind: "info", text: "history cleared." });
          break;
        }
        if (history.length === 0) {
          out.push({ kind: "info", text: "(no history)" });
          break;
        }
        history.forEach((h, i) => {
          out.push({
            kind: "output",
            text: `  ${String(i + 1).padStart(4)}  ${h}`,
          });
        });
        break;
      }

      case "cat": {
        if (args.length === 0) {
          out.push({ kind: "error", text: "usage: cat <file>" });
          break;
        }
        const file = args[0].toLowerCase();
        const content = FILES[file];
        if (!content) {
          out.push({ kind: "error", text: `cat: ${args[0]}: no such file` });
          break;
        }
        for (const line of content) out.push({ kind: "output", text: line });
        break;
      }

      case "goto":
      case "cd": {
        const dest = args[0]?.toLowerCase();
        const url = dest ? ROUTES[dest] : undefined;
        if (!url) {
          out.push({
            kind: "error",
            text: dest ? `goto: unknown route '${args[0]}'` : "usage: goto <page>",
          });
          break;
        }
        out.push({ kind: "info", text: `→ ${url}` });
        setLines((p) => [...p, ...out]);
        window.setTimeout(() => {
          window.location.href = url;
        }, 250);
        return;
      }

      case "exit":
      case "quit":
        if (embedded) {
          // Inside an OS window — close the window instead of navigating away.
          out.push({ kind: "info", text: "closing." });
          setLines((p) => [...p, ...out]);
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("scifyos:window:close", {
                detail: { appId: "terminal" },
              }),
            );
          }, 250);
        } else {
          out.push({ kind: "info", text: "goodbye." });
          setLines((p) => [...p, ...out]);
          window.setTimeout(() => {
            window.location.href = "/";
          }, 300);
        }
        return;

      case "theme": {
        const a = args[0]?.toLowerCase();
        const next = a === "d" || a === "dark" ? "dark" : a === "l" || a === "light" ? "light" : null;
        if (!next) {
          out.push({ kind: "error", text: "usage: theme <dark|light>" });
          break;
        }
        applyTheme(next);
        out.push({ kind: "info", text: `theme → ${next}` });
        break;
      }

      case "skin": {
        const a = args[0]?.toLowerCase();
        const next = a === "hacker" ? "hacker" : a === "amber" ? "amber" : null;
        if (!next) {
          out.push({ kind: "error", text: "usage: skin <hacker|amber>" });
          break;
        }
        applySkin(next);
        out.push({ kind: "info", text: `skin → ${next}` });
        break;
      }

      case "crt": {
        const a = args[0]?.toLowerCase();
        if (a !== "on" && a !== "off") {
          out.push({ kind: "error", text: "usage: crt <on|off>" });
          break;
        }
        applyCRT(a);
        out.push({ kind: "info", text: `crt → ${a}` });
        break;
      }

      case "cursor": {
        const a = args[0]?.toLowerCase();
        if (a !== "on" && a !== "off") {
          out.push({ kind: "error", text: "usage: cursor <on|off>" });
          break;
        }
        applyCursor(a);
        out.push({ kind: "info", text: `cursor → ${a}` });
        break;
      }

      case "breach":
        dispatch("scifyos:breach");
        out.push({ kind: "danger", text: "// security breach signal dispatched" });
        break;

      case "hacked":
        dispatch("scifyos:hacked");
        out.push({ kind: "danger", text: "// initiating hacked sequence" });
        break;

      case "glitch":
        dispatch("scifyos:fx:glitch");
        out.push({ kind: "info", text: "// glitch FX (1.5s)" });
        break;

      case "matrix":
        dispatch("scifyos:fx:matrix-rain");
        out.push({ kind: "info", text: "// matrix rain (3s)" });
        break;

      case "slices":
        dispatch("scifyos:fx:data-slices");
        out.push({ kind: "info", text: "// data slices (1.5s)" });
        break;

      case "pulse":
        dispatch("scifyos:fx:red-pulse");
        out.push({ kind: "danger", text: "// red pulse (2.2s)" });
        break;

      case "static":
        dispatch("scifyos:fx:audio-static");
        out.push({ kind: "info", text: "// audio static (2.2s)" });
        break;

      case "cp":
      case "copy":
        dispatch("scifyos:fx:copy-files");
        out.push({ kind: "info", text: "// initiating file copy (8s)" });
        break;

      case "ask": {
        if (args.length === 0) {
          out.push({ kind: "error", text: "usage: ask <message>" });
          break;
        }
        setLines((p) => [...p, ...out]);
        out.length = 0;
        void sendToAI(args.join(" "));
        return;
      }

      case "chat": {
        const sub = args[0]?.toLowerCase();
        if (!sub) {
          out.push({ kind: "primary", text: "// entered chat mode (mock AI)" });
          out.push({
            kind: "info",
            text: "type any message · /exit to leave · /help for commands",
          });
          setChatMode(true);
          break;
        }
        if (sub === "reset") {
          setAiHistory([]);
          out.push({ kind: "info", text: "chat history cleared." });
          break;
        }
        if (sub === "status") {
          out.push({ kind: "output", text: "mode: mock AI (no real API)" });
          out.push({
            kind: "output",
            text: `messages: ${aiHistory.length}`,
          });
          out.push({
            kind: "output",
            text: `chat-mode: ${chatMode ? "active" : "inactive"}`,
          });
          break;
        }
        if (sub === "history") {
          if (aiHistory.length === 0) {
            out.push({ kind: "info", text: "(no messages)" });
            break;
          }
          for (const m of aiHistory) {
            if (m.role === "user") {
              out.push({ kind: "input", text: m.content, prompt: "?" });
            } else {
              out.push({ kind: "primary", text: "[ai]" });
              for (const line of m.content.split("\n")) {
                out.push({ kind: "ai", text: line });
              }
            }
          }
          break;
        }
        out.push({
          kind: "error",
          text: `chat: unknown subcommand '${sub}'. try 'chat', 'chat reset', 'chat status', 'chat history'.`,
        });
        break;
      }

      case "sudo":
        out.push({ kind: "error", text: "permission denied: you are not in the sudoers file." });
        break;

      case "rm": {
        const target = args.join(" ");
        if (target.includes("-rf") || target.includes("/")) {
          out.push({ kind: "danger", text: "// nice try. nothing happened." });
        } else {
          out.push({ kind: "info", text: `removed: ${target || "(nothing)"}` });
        }
        break;
      }

      case "vim":
      case "emacs":
      case "nano":
        out.push({
          kind: "info",
          text: `${name} not available. use 'cat <file>' to read.`,
        });
        break;

      default:
        out.push({ kind: "error", text: `command not found: ${name}` });
    }

    if (out.length) append(out);
  };

  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(value);
      setValue("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next =
        historyIndex === null
          ? history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(next);
        setValue(history[next] ?? "");
      }
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const result = complete(value);
      setValue(result.value);
      if (result.matches) {
        // Multiple candidates at the common prefix — list them, leave input as-is.
        append([
          { kind: "input", text: value },
          { kind: "output", text: result.matches.join("  ") },
        ]);
      }
      return;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col flex-1 min-h-0">
      {!embedded && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-primary/40 bg-primary/10 shrink-0">
          <span className="size-2 bg-danger"></span>
          <span className="size-2 bg-warning"></span>
          <span className="size-2 bg-success"></span>
          <span className="ml-2 text-xs uppercase tracking-widest text-fg-muted">
            /dev/tty1
          </span>
          <a
            href="/"
            className="ml-auto text-sm tracking-widest uppercase text-primary hover:text-fg transition-colors"
            title="back to home"
          >
            <span className="text-fg-subtle">[</span>{BRANDING.pageChip}<span className="text-fg-subtle">]</span>
            <span className="text-fg-subtle">~$</span>
            <span className="caret"></span>
          </a>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto bg-bg-elevated px-6 py-4 text-sm space-y-0.5"
      >
        {lines.map((line, i) => (
          <div key={i} className={lineClass(line.kind)}>
            {line.kind === "input" ? (
              <>
                <span className="text-primary">{line.prompt ?? "$"} </span>
                <span>{line.text}</span>
              </>
            ) : (
              <span className="whitespace-pre-wrap break-words">{line.text || " "}</span>
            )}
          </div>
        ))}
      </div>

      <form
        className="flex items-center border-t border-primary/40 bg-bg-elevated shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          if (aiBusy) return;
          run(value);
          setValue("");
        }}
      >
        <span className="px-6 text-primary">{chatMode ? "?" : "$"}</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder={
            aiBusy
              ? "ai thinking…"
              : chatMode
              ? "talk to scifyos-ai · /exit to leave"
              : "type 'help'…"
          }
          aria-label="terminal input"
          className={`flex-1 py-3 pr-6 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none text-sm ${aiBusy ? "opacity-60" : ""}`}
        />
      </form>
    </div>
  );
}

function lineClass(kind: LineKind): string {
  switch (kind) {
    case "input":
      return "";
    case "info":
      return "text-fg-muted";
    case "error":
      return "text-danger";
    case "danger":
      return "text-danger";
    case "primary":
      return "text-primary uppercase tracking-widest";
    case "ai":
      return "text-fg";
    case "output":
    default:
      return "text-fg-muted";
  }
}
