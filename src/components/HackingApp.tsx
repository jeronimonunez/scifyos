import { useEffect, useRef, useState } from "react";

/**
 * Multi-tool hacker dashboard. Three small mini-tools share one window
 * via tabbed navigation. Inactive tools stay mounted (display: none) so
 * partial state survives a tab switch.
 */

type ToolId = "scanner" | "cracker" | "decrypt" | "exploit" | "botnet";

// ─────────────────────────────────────────────────────────
// Cross-app request — other apps call requestCrack() to push
// a target into Codebreaker. Dispatches the request event AND
// stores a module-level pending target that survives the
// password-prompt round-trip (read by HackingApp on mount).
// ─────────────────────────────────────────────────────────

export const HACKING_REQUEST_EVENT = "scifyos:hacking:request";

let pendingTarget: CrackTarget | null = null;

export function requestCrack(target: CrackTarget): void {
  pendingTarget = target;
  window.dispatchEvent(
    new CustomEvent<CrackTarget>(HACKING_REQUEST_EVENT, { detail: target }),
  );
}

function consumePendingTarget(): CrackTarget | null {
  const t = pendingTarget;
  pendingTarget = null;
  return t;
}

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "scanner", label: "scanner" },
  { id: "cracker", label: "cracker" },
  { id: "decrypt", label: "decrypt" },
  { id: "exploit", label: "exploit" },
  { id: "botnet", label: "botnet" },
];

export default function HackingApp() {
  const [activeTool, setActiveTool] = useState<ToolId>("scanner");
  const [crackerTarget, setCrackerTarget] =
    useState<CrackTarget>(SELF_TEST_TARGET);

  // Apply pending request set before mount (e.g. from another app while
  // the password-prompt was on screen).
  useEffect(() => {
    const t = consumePendingTarget();
    if (t) {
      setCrackerTarget(t);
      setActiveTool("cracker");
    }
  }, []);

  // Apply live requests while already open.
  useEffect(() => {
    const onRequest = (e: Event) => {
      const target = (e as CustomEvent<CrackTarget>).detail;
      if (!target) return;
      setCrackerTarget(target);
      setActiveTool("cracker");
    };
    window.addEventListener(HACKING_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(HACKING_REQUEST_EVENT, onRequest);
  }, []);

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
          <CrackerTool target={crackerTarget} />
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

// ─────────────────────────────────────────────────────────
// Codebreaker — Fallout-style password puzzle. Procedural
// generation per attempt. Click a word to guess; similarity
// index reveals how many characters match by position.
// Find matched bracket pairs in the hex noise to either
// remove a dud word or restore an attempt.
//
// Pass 1: standalone "self-test" target. Pass 2+ will accept
// real targets (folders, doors, encrypted mail) via props.
// ─────────────────────────────────────────────────────────

export const HACKING_CRACKED_EVENT = "scifyos:hacking:cracked";
export const HACKING_FAILED_EVENT = "scifyos:hacking:failed";

export type CrackTarget = {
  /** "folder" | "door" | "email" | "self-test" — free-form for the game. */
  kind: string;
  id: string;
  /** Display string shown in the header (e.g. "classified/"). */
  name: string;
  difficulty?: number; // 1-5; defaults to 2
};

const SELF_TEST_TARGET: CrackTarget = {
  kind: "self-test",
  id: "demo",
  name: "demo network node",
  difficulty: 2,
};

const WORDS_BY_LENGTH: Record<number, string[]> = {
  5: ["AUDIT","BURST","CACHE","CODES","DELTA","ENTRY","EXFIL","FORGE","GHOST","HEIST","INPUT","LATCH","LOGIC","NOISE","PROBE","QUERY","ROUTE","SHELL","SHARD","SPARK","STACK","TOKEN","TRACE","VAULT","WIRED","XENON"],
  6: ["BINARY","BREACH","CIPHER","DAEMON","DOMAIN","ENCODE","ENGINE","GLITCH","HACKER","IMPORT","INJECT","KERNEL","MASKED","OBJECT","OUTPUT","PACKET","RECORD","SOCKET","STREAM","TARGET","TUNNEL","UPLOAD","VECTOR","WIDGET"],
  7: ["AIRLOCK","CENTRAL","CHANNEL","CRACKED","DECRYPT","ENCRYPT","EXPLOIT","GATEWAY","HARNESS","INSIDER","MISSILE","NETWORK","PRIVATE","PROCESS","QUARTER","RECORDS","ROUTING","SECTION","TRACKED","UPGRADE"],
  8: ["BACKDOOR","COVERAGE","DATABASE","FIREWALL","IDENTITY","INTRUDER","LAUNCHER","OBSERVER","OVERRIDE","PATTERNS","PHANTOMS","REGISTRY","SCRIPTED","SECURED!","ULTIMATE"],
  9: ["BANDWIDTH","BLUEPRINT","COMMANDER","ENCRYPTED","FILESHARE","FIREWALLS","FRAMEWORK","INTRUDERS","NETWORKED","OVERWRITE","PASSWORDS","PROCESSED","QUARTERED","STRUCTURE","SUSPECTED"],
};

const NOISE_CHARS = "0123456789ABCDEF.:|/\\!@#$%^&*-+=~";
const BRACKET_PAIRS = [
  { open: "[", close: "]" },
  { open: "{", close: "}" },
  { open: "(", close: ")" },
  { open: "<", close: ">" },
];

const GRID_ROWS = 16;
const GRID_COLS = 24;
const BASE_ADDR = 0xF4A8;

type CellKind = "noise" | "word" | "bracket";

type Cell = {
  char: string;
  kind: CellKind;
  /** When kind=word: which word string this cell belongs to. */
  word?: string;
  /** When kind=bracket: shared id between open and close cells. */
  bracketId?: string;
};

type Puzzle = {
  answer: string;
  words: string[];
  attempts: number;
  grid: Cell[][];
  /** Unique per generation — used as a key on the grid container so each
   *  new puzzle replays the reveal animation. */
  nonce: number;
};

function randNoise(): string {
  return NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(difficulty: number): Puzzle {
  const d = Math.max(1, Math.min(5, difficulty));
  const wordLength = 4 + d;                    // 5–9
  const wordCount = 6 + d * 2;                 // 8–16
  const attempts = Math.max(3, 5 - Math.floor((d - 1) / 2));

  const pool = WORDS_BY_LENGTH[wordLength] ?? WORDS_BY_LENGTH[6];
  const words = shuffle(pool).slice(0, Math.min(wordCount, pool.length));
  const answer = words[Math.floor(Math.random() * words.length)];

  // Fill grid with noise.
  const grid: Cell[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({ char: randNoise(), kind: "noise" });
    }
    grid.push(row);
  }

  const isFreeRange = (r: number, c0: number, c1: number) => {
    for (let c = c0; c <= c1; c++) {
      if (grid[r][c].kind !== "noise") return false;
    }
    return true;
  };

  // Place each word at a random row + column.
  for (const word of words) {
    let placed = false;
    for (let tries = 0; tries < 80 && !placed; tries++) {
      const r = Math.floor(Math.random() * GRID_ROWS);
      const c0 = Math.floor(Math.random() * (GRID_COLS - word.length));
      const c1 = c0 + word.length - 1;
      if (!isFreeRange(r, c0, c1)) continue;
      for (let i = 0; i < word.length; i++) {
        grid[r][c0 + i] = { char: word[i], kind: "word", word };
      }
      placed = true;
    }
  }

  // Place 4 bracket pairs (open + close on the same row).
  for (let i = 0; i < 4; i++) {
    const pair = BRACKET_PAIRS[i % BRACKET_PAIRS.length];
    const bracketId = `b-${i}`;
    for (let tries = 0; tries < 60; tries++) {
      const r = Math.floor(Math.random() * GRID_ROWS);
      const cOpen = Math.floor(Math.random() * (GRID_COLS - 4));
      const cClose = cOpen + 2 + Math.floor(Math.random() * (GRID_COLS - cOpen - 3));
      if (cClose >= GRID_COLS) continue;
      if (grid[r][cOpen].kind !== "noise") continue;
      if (grid[r][cClose].kind !== "noise") continue;
      grid[r][cOpen] = { char: pair.open, kind: "bracket", bracketId };
      grid[r][cClose] = { char: pair.close, kind: "bracket", bracketId };
      break;
    }
  }

  return { answer, words, attempts, grid, nonce: Date.now() + Math.random() };
}

function similarityIndex(guess: string, answer: string): number {
  let n = 0;
  const len = Math.min(guess.length, answer.length);
  for (let i = 0; i < len; i++) if (guess[i] === answer[i]) n++;
  return n;
}

type GuessLog = { word: string; similarity: number };

function CrackerTool({ target }: { target: CrackTarget }) {
  const [difficulty, setDifficulty] = useState<number>(target.difficulty ?? 2);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(difficulty));
  const [attemptsLeft, setAttemptsLeft] = useState<number>(puzzle.attempts);
  const [guesses, setGuesses] = useState<GuessLog[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [usedBrackets, setUsedBrackets] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [hoverWord, setHoverWord] = useState<string | null>(null);
  const [hoverBracket, setHoverBracket] = useState<string | null>(null);
  const [bracketLog, setBracketLog] = useState<string[]>([]);

  const reset = (nextDiff?: number) => {
    const d = nextDiff ?? difficulty;
    const p = generatePuzzle(d);
    setDifficulty(d);
    setPuzzle(p);
    setAttemptsLeft(p.attempts);
    setGuesses([]);
    setRemoved(new Set());
    setUsedBrackets(new Set());
    setStatus("playing");
    setHoverWord(null);
    setHoverBracket(null);
    setBracketLog([]);
  };

  // When a new target arrives (from requestCrack), regenerate a fresh
  // puzzle at the target's preferred difficulty.
  useEffect(() => {
    reset(target.difficulty ?? 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const guessWord = (word: string) => {
    if (status !== "playing") return;
    if (removed.has(word)) return;
    if (guesses.find((g) => g.word === word)) return;

    if (word === puzzle.answer) {
      setStatus("won");
      window.dispatchEvent(
        new CustomEvent(HACKING_CRACKED_EVENT, {
          detail: {
            target,
            word,
            attemptsUsed: puzzle.attempts - attemptsLeft + 1,
          },
        }),
      );
      return;
    }

    const sim = similarityIndex(word, puzzle.answer);
    const next = attemptsLeft - 1;
    setGuesses((prev) => [...prev, { word, similarity: sim }]);
    setAttemptsLeft(next);
    if (next <= 0) {
      setStatus("lost");
      window.dispatchEvent(
        new CustomEvent(HACKING_FAILED_EVENT, { detail: { target } }),
      );
    }
  };

  const activateBracket = (bracketId: string) => {
    if (status !== "playing") return;
    if (usedBrackets.has(bracketId)) return;
    setUsedBrackets((prev) => new Set(prev).add(bracketId));

    // Pick remaining wrong words.
    const remainingWrong = puzzle.words.filter(
      (w) =>
        w !== puzzle.answer &&
        !removed.has(w) &&
        !guesses.find((g) => g.word === w),
    );

    // 70% delete a dud, 30% restore an attempt. Fall back to whichever is
    // useful if the chosen branch has nothing to do.
    const tryDelete = Math.random() < 0.7;
    if (tryDelete && remainingWrong.length > 0) {
      const w = remainingWrong[Math.floor(Math.random() * remainingWrong.length)];
      setRemoved((prev) => new Set(prev).add(w));
      setBracketLog((p) => [...p, `▸ dud removed: ${w}`]);
    } else {
      setAttemptsLeft((prev) => Math.min(prev + 1, puzzle.attempts));
      setBracketLog((p) => [...p, "▸ attempt restored"]);
    }
  };

  // Render helpers
  const isCellInteractive = (cell: Cell): boolean => {
    if (status !== "playing") return false;
    if (cell.kind === "word") return !removed.has(cell.word!) && !guesses.find((g) => g.word === cell.word);
    if (cell.kind === "bracket") return !usedBrackets.has(cell.bracketId!);
    return false;
  };

  const cellClass = (cell: Cell): string => {
    if (cell.kind === "word") {
      const w = cell.word!;
      if (removed.has(w) || guesses.find((g) => g.word === w)) {
        return "text-fg-subtle/40 line-through";
      }
      const active = hoverWord === w;
      return active
        ? "bg-primary text-bg cursor-pointer"
        : "text-primary cursor-pointer";
    }
    if (cell.kind === "bracket") {
      const id = cell.bracketId!;
      if (usedBrackets.has(id)) return "text-fg-subtle/40";
      const active = hoverBracket === id;
      return active
        ? "bg-primary text-bg cursor-pointer"
        : "text-primary cursor-pointer";
    }
    return "text-fg-muted/70";
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* ASCII banner */}
      <pre
        aria-label="codebreaker"
        className="text-primary font-mono leading-[1.05] text-[10px] sm:text-xs select-none whitespace-pre"
      >
{`█▀▀ █▀█ █▀▄ █▀▀ █▄▄ █▀█ █▀▀ ▄▀█ █▄▀ █▀▀ █▀█
█▄▄ █▄█ █▄▀ ██▄ █▄█ █▀▄ ██▄ █▀█ █ █ ██▄ █▀▄`}
      </pre>

      {/* Header: target + difficulty + attempts */}
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest">
        <span className="text-fg-subtle">target: <span className="text-fg-muted">{target.name}</span></span>
        <span className="ml-auto flex items-center gap-1">
          <span className="text-fg-subtle">diff:</span>
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => reset(d)}
              className={`size-5 border text-[10px] flex items-center justify-center transition ${
                d === difficulty
                  ? "border-primary bg-primary text-bg font-bold"
                  : "border-primary/40 text-primary hover:bg-primary/15"
              }`}
            >
              {d}
            </button>
          ))}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
        <span className="text-fg-subtle">attempts:</span>
        <span className="flex gap-1">
          {Array.from({ length: puzzle.attempts }).map((_, i) => (
            <span
              key={i}
              className={`block w-3 h-2 ${
                i < attemptsLeft
                  ? "bg-primary"
                  : "bg-primary/15 border border-primary/30"
              }`}
            />
          ))}
        </span>
        <span className="text-fg-muted tabular-nums">
          {attemptsLeft}/{puzzle.attempts}
        </span>
      </div>

      {/* Side-by-side: hex grid (left) + activity log (right). */}
      <div className="flex gap-3 min-h-0">
        {/* Hex grid */}
        <div
          key={puzzle.nonce}
          className="flex-1 border border-primary/30 bg-bg/40 px-3 py-2 font-mono font-bold text-sm leading-[1.5] select-none overflow-x-auto"
        >
          {puzzle.grid.map((row, r) => (
            <div
              key={r}
              className="whitespace-pre codebreaker-row"
              style={{ animationDelay: `${r * 30}ms` }}
            >
              <span className="text-fg-subtle mr-3 font-normal">
                0x{(BASE_ADDR + r * 4).toString(16).toUpperCase()}
              </span>
              {row.map((cell, c) => (
                <span
                  key={c}
                  className={cellClass(cell)}
                  onMouseEnter={() => {
                    if (!isCellInteractive(cell)) {
                      setHoverWord(null);
                      setHoverBracket(null);
                      return;
                    }
                    if (cell.kind === "word") {
                      setHoverWord(cell.word!);
                      setHoverBracket(null);
                    } else if (cell.kind === "bracket") {
                      setHoverBracket(cell.bracketId!);
                      setHoverWord(null);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoverWord(null);
                    setHoverBracket(null);
                  }}
                  onClick={() => {
                    if (!isCellInteractive(cell)) return;
                    if (cell.kind === "word") guessWord(cell.word!);
                    else if (cell.kind === "bracket") activateBracket(cell.bracketId!);
                  }}
                >
                  {cell.char}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Log + status */}
        <div className="w-64 shrink-0 border border-primary/30 bg-bg/40 px-3 py-2 font-mono text-xs leading-relaxed overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-1">
            // log
          </p>
          {status === "won" && (
            <p className="codebreaker-row text-success">
              ▸ access granted · {puzzle.answer}
            </p>
          )}
          {status === "lost" && (
            <p className="codebreaker-row text-danger">
              ▸ lockout · password was {puzzle.answer}
            </p>
          )}
          {status === "playing" &&
            guesses.length === 0 &&
            bracketLog.length === 0 && (
              <p className="codebreaker-row text-fg-subtle">// awaiting input</p>
            )}
          {guesses.map((g, i) => (
            <p key={`g-${i}`} className="codebreaker-row text-fg-muted">
              ▸ {g.word}
              <br />
              <span className="text-fg-subtle">
                · similarity {g.similarity}/{puzzle.answer.length}
              </span>
            </p>
          ))}
          {bracketLog.map((line, i) => (
            <p key={`b-${i}`} className="codebreaker-row text-primary/80">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Reset */}
      {status !== "playing" && (
        <button
          type="button"
          onClick={() => reset()}
          className="self-start px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary/15 transition"
        >
          ▸ retry
        </button>
      )}
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
