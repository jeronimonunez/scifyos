import { useEffect, useRef, useState } from "react";
import { BRANDING, PROMPT } from "../lib/branding";

const SESSION_KEY = "scifyos-booted";
const EXIT_MS = 520;

type Tone = "ok" | "fail" | "warn" | "default" | "banner";
type BootLine = { text: string; tone?: Tone; pause?: number };

const BOOT_LINES: BootLine[] = [
  { text: `${BRANDING.name} kernel v${BRANDING.version} (${PROMPT})`, tone: "banner", pause: 120 },
  { text: "Copyright (c) 2026 jeronimo.nunez · all rights reserved", tone: "banner" },
  { text: "" },
  { text: `[    0.000000] Booting ${BRANDING.name}...`, pause: 90 },
  { text: "[    0.000412] CPU: 8x Synthetic Xeon @ 4.4 GHz" },
  { text: "[    0.001209] Memory: 8192 MiB / 8192 MiB available" },
  { text: "[    0.001834] ACPI: Core revision 20240321" },
  { text: "[    0.014320] PCI: probing bus 00..." },
  { text: "[    0.038901] PCI: 12 devices detected" },
  { text: "[    0.047301] usb 1-1: new high-speed USB device" },
  { text: "[    0.082101] net eth0: link up, 1000 Mbps full-duplex" },
  { text: "[    0.103487] Loaded module: cryptd" },
  { text: "[    0.118993] Loaded module: tcp_bbr" },
  { text: "[    0.142718] systemd[1]: starting basic system", pause: 160 },
  { text: "[  OK  ] Mounted /dev/sda1 → /", tone: "ok" },
  { text: "[  OK  ] Mounted tmpfs → /run", tone: "ok" },
  { text: "[  OK  ] Reached target Network.", tone: "ok" },
  { text: "[  OK  ] Started SSH Daemon.", tone: "ok" },
  { text: "[  OK  ] Started System Logger.", tone: "ok" },
  { text: "[  OK  ] Started Cron Service.", tone: "ok" },
  { text: "[ WARN ] firmware/snd_hda_intel missing (ignored)", tone: "warn" },
  { text: "[ FAIL ] DRM driver gpu_passthrough — running degraded", tone: "fail" },
  { text: "[  OK  ] Started Display Manager.", tone: "ok" },
  { text: "[  OK  ] Mounted /home", tone: "ok" },
  { text: "[  OK  ] Reached target Multi-User System.", tone: "ok" },
  { text: `[  OK  ] Loaded ${BRANDING.servicesPath}/window-manager.so`, tone: "ok" },
  { text: `[  OK  ] Loaded ${BRANDING.servicesPath}/dock.so`, tone: "ok" },
  { text: `[  OK  ] Loaded ${BRANDING.servicesPath}/desktop.so`, tone: "ok" },
  { text: `[  OK  ] Loaded ${BRANDING.servicesPath}/terminal.so`, tone: "ok" },
  { text: "[  OK  ] Started Greeter.", tone: "ok", pause: 200 },
  { text: "" },
  { text: `${BRANDING.name} ready · welcome, ${BRANDING.user}`, tone: "ok", pause: 320 },
];

function toneClass(tone?: Tone): string {
  switch (tone) {
    case "ok": return "text-primary";
    case "fail": return "text-danger";
    case "warn": return "text-warning";
    case "banner": return "text-primary";
    default: return "text-fg-muted";
  }
}

export default function BootScreen() {
  // Render the boot every time someone enters /os in a fresh tab.
  // Reusing the session flag keeps reloads from spamming the animation
  // during local dev navigation.
  const [shouldBoot] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  });
  const [lines, setLines] = useState<BootLine[]>([]);
  const [done, setDone] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  // Remove the SSR'd pre-boot placeholder once we own the screen.
  useEffect(() => {
    document.getElementById("scifyos-pre-boot")?.remove();
    if (!shouldBoot) {
      // Already booted this session — skip straight to the OS.
      setDone(true);
      setClosing(true);
      const t = window.setTimeout(() => setDone(true), EXIT_MS);
      return () => window.clearTimeout(t);
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [shouldBoot]);

  // Stream the lines with variable cadence.
  useEffect(() => {
    if (!shouldBoot) return;
    let i = 0;
    let timer: number;

    const tick = () => {
      if (cancelledRef.current) return;
      if (i >= BOOT_LINES.length) {
        timer = window.setTimeout(() => {
          if (cancelledRef.current) return;
          setClosing(true);
          window.setTimeout(() => {
            sessionStorage.setItem(SESSION_KEY, "1");
            setDone(true);
          }, EXIT_MS);
        }, 480);
        return;
      }
      const line = BOOT_LINES[i];
      setLines((prev) => [...prev, line]);
      i += 1;
      const base = line.pause ?? 40;
      const jitter = Math.random() * 50;
      timer = window.setTimeout(tick, base + jitter);
    };

    timer = window.setTimeout(tick, 120);
    return () => {
      cancelledRef.current = true;
      window.clearTimeout(timer);
    };
  }, [shouldBoot]);

  // Pin scroll to the bottom as new lines come in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Any key or click skips to the end.
  useEffect(() => {
    if (!shouldBoot || done) return;
    const skip = () => {
      if (cancelledRef.current) return;
      cancelledRef.current = true;
      setLines(BOOT_LINES);
      setClosing(true);
      window.setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setDone(true);
      }, EXIT_MS);
    };
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [shouldBoot, done]);

  if (done) return null;

  const total = BOOT_LINES.length;
  const progress = Math.min(1, lines.length / total);
  const pct = Math.round(progress * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Booting ${BRANDING.name}`}
      className={`fixed inset-0 z-[200] bg-bg text-primary font-mono text-xs flex flex-col ${
        closing ? "boot-exit" : "boot-enter"
      }`}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden px-4 sm:px-8 py-6 leading-[1.55]"
      >
        {lines.map((line, i) => (
          <div key={i} className={toneClass(line.tone)}>
            {line.text || " "}
          </div>
        ))}
        {!closing && (
          <span className="inline-block w-[0.6em] h-[1em] align-text-bottom bg-primary boot-caret" />
        )}
      </div>

      <div className="border-t border-primary/30 px-4 sm:px-8 py-3 text-[10px] uppercase tracking-widest text-fg-muted flex items-center gap-4">
        <span className="text-primary">// boot</span>
        <div className="flex-1 h-1.5 border border-primary/40 bg-bg-elevated overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{ width: `${pct}%`, transition: "width 80ms linear" }}
          />
        </div>
        <span className="text-primary tabular-nums">{pct.toString().padStart(3, "0")}%</span>
        <span className="hidden sm:inline text-fg-subtle">press any key to skip</span>
      </div>
    </div>
  );
}
