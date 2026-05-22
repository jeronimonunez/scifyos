import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Terminal() {
  const [lines, setLines] = useState<string[]>([
    "scifyos v0.1 — type a command and press Enter.",
    "try: help, whoami, ls, clear",
  ]);
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const run = (cmd: string) => {
    const c = cmd.trim();
    if (!c) return;
    let out: string;
    switch (c) {
      case "help":
        out = "available: help, whoami, ls, date, clear";
        break;
      case "whoami":
        out = "root@scifyos";
        break;
      case "ls":
        out = "design.system  themes/  README.md";
        break;
      case "date":
        out = new Date().toISOString();
        break;
      case "clear":
        setLines([]);
        return;
      default:
        out = `command not found: ${c}`;
    }
    setLines((l) => [...l, `$ ${c}`, out]);
  };

  return (
    <div className="border border-primary/40 bg-bg-elevated">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-primary/30 bg-primary/10">
        <span className="size-2 bg-danger"></span>
        <span className="size-2 bg-warning"></span>
        <span className="size-2 bg-success"></span>
        <span className="ml-2 text-xs uppercase tracking-widest text-fg-muted">
          /dev/tty0
        </span>
      </div>
      <div ref={scrollRef} className="p-3 text-sm h-56 overflow-y-auto space-y-0.5">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("$ ") ? "text-primary" : "text-fg-muted"
            }
          >
            {line}
          </div>
        ))}
      </div>
      <form
        className="flex items-center border-t border-primary/30"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <span className="px-3 text-primary">$</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="enter command…"
          className="flex-1 py-2 pr-3 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none text-sm"
        />
      </form>
    </div>
  );
}

export function Toggle() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={
          "relative w-14 h-7 border transition-colors " +
          (on
            ? "border-primary bg-primary/20"
            : "border-fg-subtle bg-bg-elevated")
        }
      >
        <span
          className={
            "absolute top-0.5 size-6 transition-all " +
            (on ? "left-7 bg-primary" : "left-0.5 bg-fg-subtle")
          }
        ></span>
      </button>
      <span className="text-xs uppercase tracking-widest">
        STATUS:{" "}
        <span className={on ? "text-primary" : "text-fg-muted"}>
          {on ? "ONLINE" : "OFFLINE"}
        </span>
      </span>
    </div>
  );
}

export function Progress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let id = window.setInterval(() => {
      setPct((p) => (p >= 100 ? 0 : p + 4));
    }, 120);
    return () => window.clearInterval(id);
  }, []);
  const filled = Math.floor(pct / 5);
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-widest text-fg-muted">
        DECRYPTING ████ {pct.toString().padStart(3, "0")}%
      </div>
      <div className="font-[inherit] text-primary text-lg leading-none select-none">
        [{"█".repeat(filled).padEnd(20, "░")}]
      </div>
    </div>
  );
}

type Tone = "primary" | "warning" | "danger";

const toneText: Record<Tone, string> = {
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
};

const toneBg: Record<Tone, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
};

function toneFor(pct: number): Tone {
  if (pct >= 85) return "danger";
  if (pct >= 65) return "warning";
  return "primary";
}

const initialStats: { label: string; pct: number; format: (p: number) => string }[] = [
  { label: "CPU LOAD", pct: 41, format: (p) => `${p}%` },
  { label: "MEMORY", pct: 31, format: (p) => `${(p / 12).toFixed(1)} / 8 GB` },
  { label: "NETWORK", pct: 18, format: (p) => `${(p * 1.4).toFixed(1)} KB/s` },
  { label: "THREATS", pct: 0, format: (p) => `${Math.round(p / 20)} ACTIVE` },
];

export function Stats() {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStats((prev) =>
        prev.map((s) => {
          const delta = Math.floor(Math.random() * 18 - 8);
          const pct = Math.max(0, Math.min(100, s.pct + delta));
          return { ...s, pct };
        }),
      );
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const tone = toneFor(s.pct);
        return (
          <div
            key={s.label}
            className="border border-primary/40 bg-bg-elevated p-3"
          >
            <div className="text-[10px] uppercase tracking-widest text-fg-muted">
              {s.label}
            </div>
            <div className={`mt-1 text-xl tracking-tight ${toneText[tone]}`}>
              {s.format(s.pct)}
            </div>
            <div className="mt-3 h-1 bg-primary/10 overflow-hidden">
              <div
                className={`h-full ${toneBg[tone]} transition-[width] duration-700 ease-out`}
                style={{ width: `${s.pct}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type LogLevel = "INFO" | "WARN" | "ERROR";

const logSamples: { level: LogLevel; msg: string }[] = [
  { level: "INFO", msg: "connection established → 10.0.0.1:22" },
  { level: "INFO", msg: "scanning subnet 192.168.0.0/24" },
  { level: "INFO", msg: "key exchange complete (RSA-4096)" },
  { level: "INFO", msg: "packet capture started on eth0" },
  { level: "INFO", msg: "decrypting payload (AES-256-GCM)" },
  { level: "WARN", msg: "rate limit approaching on port 443" },
  { level: "WARN", msg: "untrusted certificate at gateway.local" },
  { level: "WARN", msg: "unusual traffic pattern detected" },
  { level: "ERROR", msg: "auth failure: user=admin ip=185.220.101.4" },
  { level: "ERROR", msg: "service ssh-d crashed — restarting" },
  { level: "ERROR", msg: "connection refused by 10.0.0.42" },
];

const levelClass: Record<LogLevel, string> = {
  INFO: "text-primary",
  WARN: "text-warning",
  ERROR: "text-danger",
};

export function ActivityLog() {
  const [entries, setEntries] = useState<
    { id: number; ts: string; level: LogLevel; msg: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const pick = logSamples[Math.floor(Math.random() * logSamples.length)];
      const ts = new Date().toTimeString().slice(0, 8);
      counter.current += 1;
      setEntries((prev) =>
        [...prev, { id: counter.current, ts, ...pick }].slice(-14),
      );
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className="border border-primary/40 bg-bg-elevated">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-primary/30 bg-primary/10">
        <span className="text-xs uppercase tracking-widest text-fg-muted">
          /var/log/scifyos.log
        </span>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-fg-muted">
          <span className="size-1.5 bg-primary animate-pulse"></span>
          LIVE
        </span>
      </div>
      <div ref={scrollRef} className="p-3 h-56 overflow-y-auto text-xs space-y-0.5">
        {entries.length === 0 ? (
          <div className="text-fg-subtle">waiting for events…</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex gap-2">
              <span className="text-fg-subtle shrink-0">{e.ts}</span>
              <span className={`shrink-0 ${levelClass[e.level]}`}>
                [{e.level}]
              </span>
              <span className="text-fg-muted">{e.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const tabPanels = [
  {
    id: "overview",
    label: "OVERVIEW",
    rows: [
      ["uptime", "47d 12h 03m"],
      ["kernel", "scifyos 0.1.0-rc1"],
      ["host", "mainframe.local"],
      ["users", "root, ada, neo"],
    ] as [string, string][],
  },
  {
    id: "network",
    label: "NETWORK",
    rows: [
      ["interface", "eth0 (up)"],
      ["ipv4", "10.0.0.42 / 24"],
      ["gateway", "10.0.0.1"],
      ["throughput", "↑ 3.2 KB/s · ↓ 12.4 KB/s"],
    ] as [string, string][],
  },
  {
    id: "disk",
    label: "DISK",
    rows: [
      ["/ (root)", "12.1 / 64.0 GB"],
      ["/home", "84.3 / 256 GB"],
      ["/var", "3.7 / 16.0 GB"],
      ["/tmp", "0.2 / 4.0 GB"],
    ] as [string, string][],
  },
];

export function Tabs() {
  const [active, setActive] = useState(tabPanels[0].id);
  const current = tabPanels.find((t) => t.id === active) ?? tabPanels[0];

  return (
    <div className="border border-primary/40">
      <div className="flex border-b border-primary/30 bg-bg-elevated">
        {tabPanels.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={
                "px-4 py-2 text-xs uppercase tracking-wider transition-colors " +
                (isActive
                  ? "text-primary bg-primary/10 border-b-2 border-primary -mb-px"
                  : "text-fg-muted hover:text-primary border-b-2 border-transparent")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-bg-elevated">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {current.rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-primary/10 py-1.5">
              <dt className="text-fg-subtle uppercase text-xs tracking-wider">{k}</dt>
              <dd className="text-fg text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

type ToastLevel = "INFO" | "OK" | "WARN" | "ERROR";

type ToastEntry = {
  id: number;
  level: ToastLevel;
  ts: string;
  msg: string;
};

const toastAccentBorder: Record<ToastLevel, string> = {
  INFO: "border-l-primary",
  OK: "border-l-success",
  WARN: "border-l-warning",
  ERROR: "border-l-danger",
};

const toastAccentText: Record<ToastLevel, string> = {
  INFO: "text-primary",
  OK: "text-success",
  WARN: "text-warning",
  ERROR: "text-danger",
};

const toastIcon: Record<ToastLevel, string> = {
  INFO: "ℹ",
  OK: "✓",
  WARN: "▲",
  ERROR: "✕",
};

const toastButton: Record<ToastLevel, string> = {
  INFO: "border-primary text-primary hover:bg-primary/10",
  OK: "border-success text-success hover:bg-success/10",
  WARN: "border-warning text-warning hover:bg-warning/10",
  ERROR: "border-danger text-danger hover:bg-danger/10",
};

const toastSamples: Record<ToastLevel, string[]> = {
  INFO: [
    "connection established",
    "key exchange complete",
    "process queued for execution",
  ],
  OK: [
    "transfer complete — 1.2 GB in 4.3s",
    "backup verified",
    "access granted to /dev/mainframe",
  ],
  WARN: [
    "low signal strength",
    "rate limit approaching on port 443",
    "untrusted certificate detected",
  ],
  ERROR: [
    "intrusion detected from 185.220.101.4",
    "auth failure — too many attempts",
    "service ssh-d crashed",
  ],
};

const TOAST_DURATION = 4500;

export function ToastDemo() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const push = (level: ToastLevel) => {
    const samples = toastSamples[level];
    const msg = samples[Math.floor(Math.random() * samples.length)];
    const id = ++counter.current;
    const ts = new Date().toTimeString().slice(0, 8);
    setToasts((prev) => [...prev, { id, level, ts, msg }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  };

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const levels: ToastLevel[] = ["INFO", "OK", "WARN", "ERROR"];

  return (
    <div className="flex flex-wrap gap-2">
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => push(level)}
          className={`px-3 py-1.5 border uppercase tracking-wider text-xs transition ${toastButton[level]}`}
        >
          ▸ {level}
        </button>
      ))}

      {typeof document !== "undefined" &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none w-[min(22rem,calc(100vw-2rem))]">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                aria-live="polite"
                className={`toast-enter pointer-events-auto border border-primary/30 border-l-4 ${toastAccentBorder[t.level]} bg-bg-elevated shadow-[var(--shadow-glow)]`}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-primary/20 text-xs">
                  <span
                    className={`uppercase tracking-widest ${toastAccentText[t.level]}`}
                  >
                    {toastIcon[t.level]} [{t.level}]
                  </span>
                  <span className="text-fg-subtle ml-auto">{t.ts}</span>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                    className="text-fg-muted hover:text-primary"
                  >
                    [×]
                  </button>
                </div>
                <div className="px-3 py-2 text-sm text-fg-muted">{t.msg}</div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
