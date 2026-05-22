import { useEffect, useRef, useState } from "react";

/**
 * Multi-tool hacker dashboard. Three small mini-tools share one window
 * via tabbed navigation. Inactive tools stay mounted (display: none) so
 * partial state survives a tab switch.
 */

type ToolId = "scanner" | "cracker" | "decrypt" | "exploit" | "botnet";

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "scanner", label: "scanner" },
  { id: "cracker", label: "cracker" },
  { id: "decrypt", label: "decrypt" },
  { id: "exploit", label: "exploit" },
  { id: "botnet", label: "botnet" },
];

export default function HackingApp() {
  const [activeTool, setActiveTool] = useState<ToolId>("scanner");

  return (
    <div className="flex flex-col h-full text-xs">
      {/* status header */}
      <div className="px-4 py-2 border-b border-primary/30 bg-primary/10 flex items-center justify-between shrink-0">
        <span className="text-primary uppercase tracking-widest">
          // scifyos.hack <span className="text-fg-subtle">▸</span> {activeTool}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-fg-subtle">
          v0.1
        </span>
      </div>

      {/* tab nav */}
      <nav className="flex border-b border-primary/30 shrink-0">
        {TOOLS.map((tool) => {
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className={
                "px-4 py-2 text-[10px] uppercase tracking-widest border-r border-primary/20 transition-colors " +
                (active
                  ? "text-primary bg-primary/10 border-b-2 border-b-primary -mb-px"
                  : "text-fg-muted hover:text-primary border-b-2 border-b-transparent -mb-px")
              }
            >
              {tool.label}
            </button>
          );
        })}
      </nav>

      {/* tool content — all mounted, hidden via display:none */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className={activeTool === "scanner" ? "" : "hidden"}>
          <ScannerTool />
        </div>
        <div className={activeTool === "cracker" ? "" : "hidden"}>
          <CrackerTool />
        </div>
        <div className={activeTool === "decrypt" ? "" : "hidden"}>
          <DecryptTool />
        </div>
        <div className={activeTool === "exploit" ? "" : "hidden"}>
          <ExploitTool />
        </div>
        <div className={activeTool === "botnet" ? "" : "hidden"}>
          <BotnetTool />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Scanner — fake port scan that streams results in.
   ───────────────────────────────────────────────────── */

type ScanResult = {
  ip: string;
  ports: number[];
  compromised: boolean;
};

const PORT_POOL = [22, 80, 443, 3306, 5432, 8080, 21, 25, 53, 3389];

function makeFakeResult(): ScanResult {
  const ip = `10.0.0.${1 + Math.floor(Math.random() * 254)}`;
  const ports = PORT_POOL.filter(() => Math.random() > 0.55);
  if (ports.length === 0) ports.push(PORT_POOL[Math.floor(Math.random() * PORT_POOL.length)]);
  return { ip, ports, compromised: Math.random() < 0.22 };
}

function ScannerTool() {
  const [target, setTarget] = useState("10.0.0.1/24");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = resultsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [results]);

  const startScan = async () => {
    if (scanning) return;
    setScanning(true);
    setResults([]);
    const count = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      await new Promise((r) => setTimeout(r, 180 + Math.random() * 420));
      setResults((prev) => [...prev, makeFakeResult()]);
    }
    setScanning(false);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-fg-muted uppercase tracking-widest text-[10px] w-14">
          target:
        </span>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          spellCheck={false}
          className="flex-1 px-2 py-1.5 bg-bg border border-primary/40 text-fg focus:outline-none focus:border-primary text-xs font-mono"
        />
        <button
          type="button"
          onClick={startScan}
          disabled={scanning}
          className="px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {scanning ? "scanning…" : "▸ scan"}
        </button>
      </div>
      <div
        ref={resultsRef}
        className="border border-primary/30 bg-bg/40 p-3 font-mono text-[11px] space-y-0.5 h-56 overflow-y-auto"
      >
        {results.length === 0 && !scanning && (
          <div className="text-fg-subtle">// awaiting input.</div>
        )}
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-2 leading-relaxed">
            <span className="text-primary w-24">{r.ip}</span>
            <span className="text-fg-subtle">ports:</span>
            <span className="text-warning flex-1">{r.ports.join(",")}</span>
            <span
              className={
                r.compromised
                  ? "text-danger uppercase tracking-widest"
                  : "text-success uppercase tracking-widest"
              }
            >
              {r.compromised ? "[VULN]" : "[OK]"}
            </span>
          </div>
        ))}
        {scanning && (
          <div className="text-fg-muted animate-pulse">// scanning subnet…</div>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-fg-subtle">
        <span>// {results.length} host{results.length === 1 ? "" : "s"} found</span>
        <span>
          // {results.filter((r) => r.compromised).length} vulnerable
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Cracker — animated brute-force that locks characters
   progressively left-to-right.
   ───────────────────────────────────────────────────── */

const FAKE_PASSWORDS = [
  "hunter2",
  "qwerty123",
  "letmein",
  "password1",
  "admin",
  "iloveyou",
  "12345678",
  "scifyos",
  "0day!",
  "root",
  "neo1999",
];

const CRACK_CHARS =
  "abcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function pickFakePassword(): string {
  return FAKE_PASSWORDS[Math.floor(Math.random() * FAKE_PASSWORDS.length)];
}

function CrackerTool() {
  const [target, setTarget] = useState("root@10.0.0.42");
  const [cracking, setCracking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const startCrack = async () => {
    if (cracking) return;
    setCracking(true);
    setProgress(0);
    setResult(null);

    const finalPassword = pickFakePassword();
    const totalSteps = 40;

    for (let step = 0; step <= totalSteps; step++) {
      const pct = Math.round((step / totalSteps) * 100);
      setProgress(pct);
      const lockedCount = Math.floor((step / totalSteps) * finalPassword.length);
      const locked = finalPassword.slice(0, lockedCount);
      const remaining = finalPassword.length - lockedCount;
      const random = Array.from({ length: remaining }, () =>
        CRACK_CHARS[Math.floor(Math.random() * CRACK_CHARS.length)],
      ).join("");
      setAttempt(locked + random);
      await new Promise((r) => setTimeout(r, 60 + Math.random() * 70));
    }

    setProgress(100);
    setAttempt(finalPassword);
    setResult(finalPassword);
    setCracking(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-fg-muted uppercase tracking-widest text-[10px] w-14">
          target:
        </span>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          spellCheck={false}
          className="flex-1 px-2 py-1.5 bg-bg border border-primary/40 text-fg focus:outline-none focus:border-primary text-xs font-mono"
        />
        <button
          type="button"
          onClick={startCrack}
          disabled={cracking}
          className="px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {cracking ? "cracking…" : "▸ crack"}
        </button>
      </div>

      <div className="border border-primary/30 bg-bg/40 px-4 py-5 space-y-3 text-center">
        <div className="text-[10px] uppercase tracking-widest text-fg-subtle">
          attempting
        </div>
        <div className="text-primary text-2xl tracking-[0.4em] font-mono min-h-[2rem]">
          {attempt || "_ _ _ _ _ _ _ _"}
        </div>
        <div className="h-1 bg-primary/10 overflow-hidden">
          <div
            className={`h-full transition-[width] duration-75 ${result ? "bg-success" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-[10px] uppercase tracking-widest h-3">
          {result ? (
            <span className="text-success">▸ matched: {result}</span>
          ) : cracking ? (
            <span className="text-fg-muted">{progress}% · trying combos…</span>
          ) : (
            <span className="text-fg-subtle">// idle</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Decrypt — fake algorithm-walking, real ROT13 output.
   ───────────────────────────────────────────────────── */

const FAKE_ALGOS = [
  "caesar-13",
  "base64",
  "xor-key",
  "rsa-2048",
  "des-3",
  "blowfish",
];

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function DecryptTool() {
  const [input, setInput] = useState(
    "Uryyb. Lbh sbhaq gur cnffjbeq: jbeqcnff42",
  );
  const [decrypting, setDecrypting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);

  const startDecrypt = async () => {
    if (decrypting || !input.trim()) return;
    setDecrypting(true);
    setOutput(null);

    // Walk through 3-5 algorithms before "finding" the match.
    const picks = FAKE_ALGOS
      .map((a) => [a, Math.random()] as const)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3 + Math.floor(Math.random() * 2))
      .map(([a]) => a);

    for (let i = 0; i < picks.length - 1; i++) {
      setStatus(`trying ${picks[i]}… failed`);
      await new Promise((r) => setTimeout(r, 220 + Math.random() * 300));
    }
    setStatus(`trying ${picks[picks.length - 1]}… match!`);
    await new Promise((r) => setTimeout(r, 350));

    setOutput(rot13(input));
    setDecrypting(false);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
        <label className="text-fg-muted uppercase tracking-widest text-[10px]">
          ciphertext
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          rows={4}
          placeholder="paste encrypted text here…"
          className="w-full px-2 py-1.5 bg-bg border border-primary/40 text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary font-mono text-xs resize-none"
        />
      </div>
      <button
        type="button"
        onClick={startDecrypt}
        disabled={decrypting || !input.trim()}
        className="w-full px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {decrypting ? "decrypting…" : "▸ decrypt"}
      </button>
      {status && (
        <div className={`text-[10px] uppercase tracking-widest ${output ? "text-success" : "text-warning"}`}>
          // {status}
        </div>
      )}
      {output && (
        <div className="border border-success/40 bg-success/5 p-3 space-y-1">
          <div className="text-success uppercase tracking-widest text-[10px]">
            ▸ plaintext
          </div>
          <div className="text-fg font-mono text-xs whitespace-pre-wrap break-words">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Exploit deployer — pick a fake CVE, fire it at a host,
   watch a multi-step deployment log resolve.
   ───────────────────────────────────────────────────── */

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type Exploit = {
  id: string;
  name: string;
  severity: Severity;
};

const EXPLOITS: Exploit[] = [
  { id: "CVE-2024-9999", name: "scifyd buffer overflow",     severity: "CRITICAL" },
  { id: "CVE-2024-8743", name: "ssh-mod remote code exec",   severity: "CRITICAL" },
  { id: "CVE-2024-7501", name: "admin panel SQL injection",  severity: "HIGH" },
  { id: "CVE-2024-6022", name: "header auth bypass",         severity: "HIGH" },
  { id: "CVE-2024-5418", name: "kernel privilege escalation",severity: "CRITICAL" },
  { id: "CVE-2024-4203", name: "webmail stored XSS",         severity: "MEDIUM" },
  { id: "CVE-2024-3119", name: "dns cache poison",           severity: "MEDIUM" },
  { id: "CVE-2024-2087", name: "logrotate symlink race",     severity: "LOW" },
];

const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICAL: "text-danger",
  HIGH: "text-warning",
  MEDIUM: "text-accent",
  LOW: "text-fg-subtle",
};

const FINGERPRINTS = [
  "Linux 5.4 (Ubuntu 20.04)",
  "Linux 4.19 (Debian 10)",
  "FreeBSD 13.0",
  "Windows Server 2019 build 17763",
  "OpenBSD 7.0",
];

const FAILURE_REASONS = [
  "host patched",
  "firewall dropped packet",
  "WAF intercepted payload",
  "kernel ASLR randomized layout",
  "intrusion detection alerted",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ExploitTool() {
  const [target, setTarget] = useState("10.0.0.42");
  const [selectedId, setSelectedId] = useState<string>(EXPLOITS[0].id);
  const [deploying, setDeploying] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const deploy = async () => {
    if (deploying) return;
    const exploit = EXPLOITS.find((e) => e.id === selectedId);
    if (!exploit) return;
    setDeploying(true);
    setLog([]);

    const success = Math.random() > 0.2;
    const payloadKB = 20 + Math.floor(Math.random() * 220);
    const steps: string[] = [
      `// load module: ${exploit.id}`,
      `// target ${target}`,
      `// opening tcp socket... [OK]`,
      `// fingerprinting host: ${pickRandom(FINGERPRINTS)}`,
      `// uploading payload (${payloadKB} KB)...`,
      `// triggering vulnerability...`,
      success
        ? `▸ SUCCESS · shell acquired (uid=0, gid=0)`
        : `✗ FAILED · ${pickRandom(FAILURE_REASONS)}`,
    ];

    for (const step of steps) {
      await new Promise((r) =>
        setTimeout(r, 260 + Math.random() * 380),
      );
      setLog((prev) => [...prev, step]);
    }

    setDeploying(false);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-fg-muted uppercase tracking-widest text-[10px] w-14">
          target:
        </span>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          spellCheck={false}
          className="flex-1 px-2 py-1.5 bg-bg border border-primary/40 text-fg focus:outline-none focus:border-primary text-xs font-mono"
        />
        <button
          type="button"
          onClick={deploy}
          disabled={deploying}
          className="px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {deploying ? "deploying…" : "▸ deploy"}
        </button>
      </div>

      <div className="border border-primary/30 bg-bg/40">
        <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-fg-subtle border-b border-primary/20">
          // exploit registry · {EXPLOITS.length} entries
        </div>
        <div className="max-h-36 overflow-y-auto">
          {EXPLOITS.map((ex) => {
            const active = selectedId === ex.id;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => !deploying && setSelectedId(ex.id)}
                disabled={deploying}
                className={
                  "w-full px-3 py-1.5 text-left border-b border-primary/10 last:border-b-0 transition-colors disabled:cursor-not-allowed " +
                  (active
                    ? "bg-primary/15 text-primary"
                    : "text-fg-muted hover:bg-primary/5 hover:text-primary")
                }
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span>{ex.id}</span>
                  <span
                    className={`text-[9px] uppercase tracking-widest ${SEVERITY_COLOR[ex.severity]}`}
                  >
                    {ex.severity}
                  </span>
                </div>
                <div className="text-fg-subtle text-[10px] truncate">
                  {ex.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={logRef}
        className="border border-primary/30 bg-bg/40 p-3 font-mono text-[11px] space-y-0.5 h-28 overflow-y-auto"
      >
        {log.length === 0 && !deploying && (
          <div className="text-fg-subtle">// pick an exploit and target a host.</div>
        )}
        {log.map((line, i) => (
          <div
            key={i}
            className={
              line.includes("SUCCESS")
                ? "text-success"
                : line.includes("FAILED")
                  ? "text-danger"
                  : "text-fg-muted"
            }
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Botnet console — grid of compromised machines with
   multi-select + a remote command runner.
   ───────────────────────────────────────────────────── */

type NodeStatus = "online" | "working" | "offline";

type BotNode = {
  id: string;
  hostname: string;
  ip: string;
  status: NodeStatus;
};

const NATO = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot",
  "golf", "hotel", "india", "juliet", "kilo", "lima",
];

function makeBots(): BotNode[] {
  return NATO.map((name) => ({
    id: name,
    hostname: `node-${name}`,
    ip: `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`,
    status: Math.random() > 0.15 ? "online" : "offline",
  }));
}

function fakeBotnetResult(cmd: string): string {
  const c = cmd.trim().toLowerCase();
  if (!c) return "[no-op]";
  if (c === "ls" || c === "dir") return "config.json  secrets/  passwd.bin";
  if (c === "whoami") return "root";
  if (c.startsWith("uname")) return "Linux 5.4.0-72-generic";
  if (c === "pwd") return "/root";
  if (c === "id") return "uid=0(root) gid=0(root) groups=0(root)";
  if (c === "date") return new Date().toUTCString();
  if (c === "exit") return "session terminated";
  if (c.startsWith("cat ")) return `[${Math.floor(Math.random() * 8192)} bytes dumped]`;
  if (c.startsWith("echo ")) return cmd.slice(5);
  if (c.startsWith("rm ")) return "[deleted]";
  if (c.startsWith("curl ") || c.startsWith("wget ")) return "[200 OK · 4.2 KB]";
  return "[exit 0]";
}

const STATUS_DOT: Record<NodeStatus, string> = {
  online: "bg-success",
  working: "bg-warning animate-pulse",
  offline: "bg-danger/40",
};

function BotnetTool() {
  const [nodes, setNodes] = useState<BotNode[]>(makeBots);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [command, setCommand] = useState("whoami");
  const [output, setOutput] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  // Background: nodes occasionally flicker between online/offline.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.status === "working") return n;
          if (Math.random() < 0.04) {
            return { ...n, status: n.status === "online" ? "offline" : "online" };
          }
          return n;
        }),
      );
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(nodes.filter((n) => n.status === "online").map((n) => n.id)));
  const clearSelect = () => setSelected(new Set());

  const execute = async () => {
    if (executing || !command.trim() || selected.size === 0) return;
    setExecuting(true);

    const targets = nodes.filter(
      (n) => selected.has(n.id) && n.status === "online",
    );
    if (targets.length === 0) {
      setOutput((p) => [...p, `// no online targets in selection.`]);
      setExecuting(false);
      return;
    }

    // Mark targets as working.
    setNodes((prev) =>
      prev.map((n) =>
        selected.has(n.id) && n.status === "online"
          ? { ...n, status: "working" as NodeStatus }
          : n,
      ),
    );

    setOutput((p) => [...p, `$ ${command}  →  ${targets.length} node${targets.length === 1 ? "" : "s"}`]);

    for (const t of targets) {
      await new Promise((r) => setTimeout(r, 90 + Math.random() * 220));
      setOutput((p) => [...p, `  ${t.hostname}: ${fakeBotnetResult(command)}`]);
    }

    setNodes((prev) =>
      prev.map((n) => (n.status === "working" ? { ...n, status: "online" } : n)),
    );
    setExecuting(false);
  };

  const onlineCount = nodes.filter((n) => n.status === "online").length;

  return (
    <div className="p-4 space-y-3">
      <div className="border border-primary/30 bg-bg/40">
        <div className="flex items-center justify-between gap-2 px-3 py-1 text-[10px] uppercase tracking-widest text-fg-subtle border-b border-primary/20">
          <span>
            // fleet · {onlineCount}/{nodes.length} online · {selected.size} selected
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="hover:text-primary transition-colors"
            >
              all
            </button>
            <button
              type="button"
              onClick={clearSelect}
              className="hover:text-primary transition-colors"
            >
              none
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px max-h-36 overflow-y-auto">
          {nodes.map((n) => {
            const isSelected = selected.has(n.id);
            const isOffline = n.status === "offline";
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !isOffline && toggleSelect(n.id)}
                disabled={isOffline}
                className={
                  "px-2 py-1.5 text-left transition-colors " +
                  (isSelected
                    ? "bg-primary/15 text-primary"
                    : isOffline
                      ? "text-fg-subtle/40 cursor-not-allowed"
                      : "text-fg-muted hover:bg-primary/5 hover:text-primary")
                }
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <span className={`size-1.5 ${STATUS_DOT[n.status]} shrink-0`}></span>
                  <span className="truncate">{n.hostname}</span>
                </div>
                <div className="text-[9px] text-fg-subtle tabular-nums truncate">
                  {n.ip}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          execute();
        }}
      >
        <span className="text-primary text-xs select-none">$</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="command…"
          className="flex-1 px-2 py-1.5 bg-bg border border-primary/40 text-fg focus:outline-none focus:border-primary text-xs font-mono"
        />
        <button
          type="submit"
          disabled={executing || !command.trim() || selected.size === 0}
          className="px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {executing ? "exec…" : "▸ exec"}
        </button>
      </form>

      <div
        ref={outputRef}
        className="border border-primary/30 bg-bg/40 p-3 font-mono text-[11px] space-y-0.5 h-28 overflow-y-auto"
      >
        {output.length === 0 && (
          <div className="text-fg-subtle">// select nodes and run a command.</div>
        )}
        {output.map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("$ ")
                ? "text-primary"
                : line.startsWith("//")
                  ? "text-fg-subtle italic"
                  : "text-fg-muted"
            }
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
