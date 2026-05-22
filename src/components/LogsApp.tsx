import { useEffect, useMemo, useRef, useState } from "react";

type LogEntry = {
  id: string;
  date: string;
  title: string;
  author: string;
  computer: string;
  content: string;
};

const LOGS: LogEntry[] = [
  {
    id: "log-001",
    date: "2026-05-19 02:47",
    title: "first contact on subnet 10.4.0.0/16",
    author: "operator/jnz",
    computer: "node-04.scifyos",
    content: `something is pinging back from the dark side of the subnet. signature
doesn't match any registered host. it answers in 4ms — which is way
too fast for a misconfig.

i ran a passive trace. the packets come in malformed, then realign
themselves mid-flight, like the protocol is being rewritten as it
travels. that shouldn't be possible.

flagging for review. setting honeypot on 10.4.7.42.`,
  },
  {
    id: "log-002",
    date: "2026-05-18 23:11",
    title: "honeypot bait taken",
    author: "operator/jnz",
    computer: "honey-01.scifyos",
    content: `the honeypot took a hit. 3.2GB exfiltrated in under 90 seconds. that's
not a script kiddie — that's purpose-built tooling.

attacker fingerprint:
  - no user agent
  - no banner grabs
  - tls handshake forged with a self-signed cert dated 2031
  - response time consistent with a host inside our own perimeter

the cert date is the part i can't stop reading.`,
  },
  {
    id: "log-003",
    date: "2026-05-18 09:02",
    title: "missing build artifact: kernel-rc1.bin",
    author: "ci/automation",
    computer: "build-02.scifyos",
    content: `nightly build completed at 03:14. artifact upload reported success.
artifact is not in the bucket.

s3 logs show the PUT request, with a 200 OK response — but the object
listing returns zero matches. checksums in the deploy manifest reference
a file that does not exist anywhere we can see.

reverting deploy to rc0. opened ticket SCI-4471.`,
  },
  {
    id: "log-004",
    date: "2026-05-17 14:33",
    title: "anomaly: power draw on rack 7",
    author: "ops/morrigan",
    computer: "mainframe.scifyos",
    content: `rack 7 is pulling 1.6kW above baseline. nothing was provisioned there
this week. PDU logs show three blade servers active that aren't in the
inventory.

i walked the floor. the slots are empty. the lights are off. but the
PDU swears 1.6kW is being consumed somewhere.`,
  },
  {
    id: "log-005",
    date: "2026-05-16 21:58",
    title: "decrypt success — file 'truth.enc'",
    author: "operator/jnz",
    computer: "node-04.scifyos",
    content: `cracked the file pulled off the honeypot. it's a single sentence.

  "you are not the first."

no signature. no metadata. file mtime is 2031-01-01 00:00:00 UTC.
i'm going to bed.`,
  },
  {
    id: "log-006",
    date: "2026-05-15 11:21",
    title: "rotated keys, found extras",
    author: "ops/morrigan",
    computer: "vault-01.scifyos",
    content: `quarterly key rotation. expected 14 keys in the vault. found 17.

three of them are valid. three of them have access scopes that don't
appear anywhere in our policy graph. one of them is scoped to a host
that was decommissioned two years ago, but the host is still resolving.

revoked all three. waiting to see who notices.`,
  },
  {
    id: "log-007",
    date: "2026-05-14 03:09",
    title: "ssh from a country we don't operate in",
    author: "siem/auto",
    computer: "edge-03.scifyos",
    content: `successful ssh from 185.220.101.4 (TOR exit). used a key fingerprint
that matches root@build-02.

build-02 is air-gapped. has been air-gapped since february.

something on the inside is signing requests as build-02 and sending
them out. need to walk every host with that key authorized.`,
  },
  {
    id: "log-008",
    date: "2026-05-13 18:47",
    title: "audit: process tree on node-04",
    author: "operator/jnz",
    computer: "node-04.scifyos",
    content: `there is a process running as PID 0. you cannot run a process as PID 0.
the scheduler is PID 0.

it has been alive for 47 days, 12 hours, 3 minutes. that's our uptime.
exactly. to the second.

kill -9 0 does nothing. kill -9 -1 does nothing. i don't know what to
write here.`,
  },
];

// ─────────────────────────────────────────────────────────
// Audio: small synth blips for nav / select / back. Lazy
// AudioContext — created on first user gesture inside the app.
// ─────────────────────────────────────────────────────────

type WebkitWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function useLogsAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = () => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctxRef.current = new Ctx();
    } catch {
      return null;
    }
    return ctxRef.current;
  };

  const blip = (freq: number, durMs: number, type: OscillatorType, peak: number) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.02);
  };

  return {
    nav: () => blip(880, 50, "square", 0.04),
    select: () => {
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.linearRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    },
    back: () => {
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    },
  };
}

// ─────────────────────────────────────────────────────────

type View = { kind: "list" } | { kind: "detail"; logId: string };

export default function LogsApp() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const audio = useLogsAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const logs = LOGS;
  const activeLog = useMemo(
    () => (view.kind === "detail" ? logs.find((l) => l.id === view.logId) : null),
    [view, logs],
  );

  // Focus the container when the view changes so arrow keys work right
  // away — without stealing focus from other windows when the app first
  // mounts (handled by the click-to-focus interaction).
  useEffect(() => {
    if (view.kind === "list") {
      containerRef.current?.focus();
    }
  }, [view.kind]);

  // Scroll the selected row into view as we move.
  useEffect(() => {
    if (view.kind !== "list") return;
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-log-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, view.kind]);

  const moveSelection = (delta: number) => {
    setSelectedIndex((i) => {
      const next = Math.min(logs.length - 1, Math.max(0, i + delta));
      if (next !== i) audio.nav();
      return next;
    });
  };

  const openSelected = () => {
    const log = logs[selectedIndex];
    if (!log) return;
    audio.select();
    setView({ kind: "detail", logId: log.id });
  };

  const back = () => {
    audio.back();
    setView({ kind: "list" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (view.kind === "list") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        if (selectedIndex !== 0) {
          audio.nav();
          setSelectedIndex(0);
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const last = logs.length - 1;
        if (selectedIndex !== last) {
          audio.nav();
          setSelectedIndex(last);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        openSelected();
      }
    } else {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        back();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="h-full w-full flex flex-col bg-bg text-xs outline-none"
    >
      {view.kind === "list" ? (
        <>
          <div className="px-3 py-2 border-b border-primary/30 bg-bg-elevated text-[10px] uppercase tracking-widest text-fg-subtle flex items-center justify-between">
            <span>
              <span className="text-primary">//</span> logs
            </span>
            <span>
              {logs.length} entries · ↑↓ navigate · enter open
            </span>
          </div>
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Log entries"
            className="flex-1 overflow-y-auto"
          >
            {logs.map((log, i) => {
              const selected = i === selectedIndex;
              return (
                <li
                  key={log.id}
                  data-log-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => {
                    if (i !== selectedIndex) {
                      audio.nav();
                      setSelectedIndex(i);
                    }
                  }}
                  onClick={() => {
                    setSelectedIndex(i);
                    audio.select();
                    setView({ kind: "detail", logId: log.id });
                  }}
                  className={`px-3 py-2 border-b border-primary/10 flex items-center gap-4 cursor-pointer transition-colors ${
                    selected
                      ? "bg-primary text-bg"
                      : "text-fg-muted hover:text-primary"
                  }`}
                >
                  <span
                    className={`font-mono tabular-nums tracking-tight ${
                      selected ? "text-bg" : "text-fg-subtle"
                    }`}
                  >
                    {log.date}
                  </span>
                  <span
                    aria-hidden="true"
                    className={selected ? "text-bg" : "text-primary/60"}
                  >
                    ▸
                  </span>
                  <span className="uppercase tracking-wider truncate">
                    {log.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : activeLog ? (
        <>
          <div className="px-3 py-2 border-b border-primary/30 bg-bg-elevated text-[10px] uppercase tracking-widest flex items-center gap-3">
            <button
              type="button"
              onClick={back}
              className="px-2 py-0.5 border border-primary/50 text-primary hover:bg-primary/15 hover:border-primary transition flex items-center gap-1"
              aria-label="Back to log list"
            >
              <span aria-hidden="true">◂</span> back
            </button>
            <span className="text-fg-subtle">esc / backspace</span>
            <span className="ml-auto text-primary">// {activeLog.id}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <h2 className="text-lg uppercase tracking-widest text-primary">
              {activeLog.title}
            </h2>
            <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-[10px] uppercase tracking-widest">
              <dt className="text-fg-subtle">date</dt>
              <dd className="text-fg-muted font-mono">{activeLog.date}</dd>
              <dt className="text-fg-subtle">author</dt>
              <dd className="text-fg-muted">{activeLog.author}</dd>
              <dt className="text-fg-subtle">computer</dt>
              <dd className="text-fg-muted">{activeLog.computer}</dd>
            </dl>
            <div className="border-t border-primary/20 pt-4">
              <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-2">
                // entry
              </p>
              <pre className="whitespace-pre-wrap break-words text-fg leading-relaxed font-mono text-xs">
                {activeLog.content}
              </pre>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
