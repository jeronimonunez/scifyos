import { useEffect, useMemo, useRef, useState } from "react";
import { useNavAudio } from "../lib/useNavAudio";
import {
  addUnlocked,
  EXPLORER_UNLOCK_EVENT,
  loadUnlocked,
} from "../lib/explorerUnlock";
import { requestCrack } from "./HackingApp";
import { EXPLORER_BREAK_LOCK_EVENT } from "./CrackedModal";
import { WINDOW_OPEN_EVENT } from "./WindowManager";
import { WINDOW_SHAKE_EVENT } from "./Window";
import {
  FOLDER_PASSWORD,
  FS_ROOT,
  type FileNode,
  type FolderNode,
  type ImageNode,
  type SoundNode,
  type TextNode,
} from "../data/explorer-fs";


// ─────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────

function FolderIcon() {
  return (
    <svg viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinejoin="miter" className="size-12">
      <path d="M3 9 L17 9 L21 5 L45 5 L45 32 L3 32 Z"/>
      <line x1="3" y1="12" x2="45" y2="12"/>
    </svg>
  );
}

function TextFileIcon() {
  return (
    <svg viewBox="0 0 36 44" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinejoin="miter" className="size-12">
      <path d="M5 3 L25 3 L33 11 L33 41 L5 41 Z"/>
      <path d="M25 3 L25 11 L33 11"/>
      <line x1="9"  y1="18" x2="29" y2="18"/>
      <line x1="9"  y1="23" x2="29" y2="23"/>
      <line x1="9"  y1="28" x2="29" y2="28"/>
      <line x1="9"  y1="33" x2="21" y2="33"/>
    </svg>
  );
}

function ImageFileIcon() {
  return (
    <svg viewBox="0 0 36 44" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinejoin="miter" className="size-12">
      <path d="M5 3 L25 3 L33 11 L33 41 L5 41 Z"/>
      <path d="M25 3 L25 11 L33 11"/>
      <rect x="9" y="17" width="20" height="18"/>
      <circle cx="14" cy="22" r="1.6" fill="currentColor"/>
      <polyline points="9,30 16,24 22,28 29,22 29,35 9,35" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function SoundFileIcon() {
  return (
    <svg viewBox="0 0 36 44" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinejoin="miter" className="size-12">
      <path d="M5 3 L25 3 L33 11 L33 41 L5 41 Z"/>
      <path d="M25 3 L25 11 L33 11"/>
      <path d="M11 26 L15 26 L19 22 L19 30 L15 26" fill="currentColor"/>
      <path d="M21 24 Q23 26 21 28"/>
      <path d="M23 22 Q26 26 23 30"/>
    </svg>
  );
}

function LockBadgeIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="square" strokeLinejoin="miter" className="size-3.5">
      <rect x="2.5" y="5.5" width="7" height="5"/>
      <path d="M4 5.5 V3.5 A2 2 0 0 1 8 3.5 V5.5"/>
      <line x1="6" y1="7.5" x2="6" y2="8.5"/>
    </svg>
  );
}

function iconFor(node: FileNode) {
  if (node.type === "folder") return <FolderIcon/>;
  if (node.type === "image") return <ImageFileIcon/>;
  if (node.type === "sound") return <SoundFileIcon/>;
  return <TextFileIcon/>;
}

// ─────────────────────────────────────────────────────────

/** Walk the folder tree along an array of folder ids and return
 *  the resolved folder, or the root if any id is unknown. */
function resolveFolder(root: FolderNode, path: string[]): FolderNode {
  let current: FolderNode = root;
  for (const id of path) {
    const next = current.children.find((c) => c.id === id);
    if (!next || next.type !== "folder") return root;
    current = next;
  }
  return current;
}

export default function ExplorerApp() {
  const [path, setPath] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<
    TextNode | ImageNode | SoundNode | null
  >(null);
  /** Folder ids the user has authenticated against. Shared with the
   *  Terminal via the EXPLORER_UNLOCK_EVENT / sessionStorage module. */
  const [unlockedFolders, setUnlockedFolders] = useState<Set<string>>(
    loadUnlocked,
  );
  /** Folder waiting on a password — drives the inline prompt overlay. */
  const [pendingUnlock, setPendingUnlock] = useState<FolderNode | null>(null);
  /** Folder id whose lock badge is currently playing the break animation. */
  const [breakingId, setBreakingId] = useState<string | null>(null);
  const breakTimerRef = useRef<number | null>(null);
  const audio = useNavAudio();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync from sessionStorage when another component (e.g. the Terminal)
  // unlocks a folder.
  useEffect(() => {
    const onSync = () => setUnlockedFolders(loadUnlocked());
    window.addEventListener(EXPLORER_UNLOCK_EVENT, onSync);
    return () => window.removeEventListener(EXPLORER_UNLOCK_EVENT, onSync);
  }, []);

  // Listen for break-lock events from CrackedModal — play the shatter
  // animation on the matching folder's lock badge.
  useEffect(() => {
    const onBreak = (e: Event) => {
      const id = (e as CustomEvent<{ folderId: string }>).detail?.folderId;
      if (!id) return;
      if (breakTimerRef.current !== null) {
        window.clearTimeout(breakTimerRef.current);
      }
      setBreakingId(id);
      breakTimerRef.current = window.setTimeout(() => {
        setBreakingId(null);
        breakTimerRef.current = null;
      }, 700);
    };
    window.addEventListener(EXPLORER_BREAK_LOCK_EVENT, onBreak);
    return () => {
      window.removeEventListener(EXPLORER_BREAK_LOCK_EVENT, onBreak);
      if (breakTimerRef.current !== null) {
        window.clearTimeout(breakTimerRef.current);
      }
    };
  }, []);

  const folder = useMemo(() => resolveFolder(FS_ROOT, path), [path]);

  // Crumb display — show "home" + each folder name.
  const crumbs = useMemo(() => {
    const out: { id: string | null; name: string }[] = [
      { id: null, name: FS_ROOT.name },
    ];
    let current: FolderNode = FS_ROOT;
    for (const id of path) {
      const next = current.children.find((c) => c.id === id);
      if (!next || next.type !== "folder") break;
      out.push({ id, name: next.name });
      current = next;
    }
    return out;
  }, [path]);

  // Focus the container after navigating so keyboard works without click.
  useEffect(() => {
    containerRef.current?.focus();
  }, [path, preview]);

  const open = (node: FileNode) => {
    if (node.type === "folder") {
      // Gate protected folders unless already unlocked this session.
      if (node.passwordProtected && !unlockedFolders.has(node.id)) {
        audio.nav();
        setPendingUnlock(node);
        return;
      }
      audio.select();
      setPath((p) => [...p, node.id]);
      setSelectedId(null);
      setPreview(null);
    } else {
      audio.select();
      setPreview(node);
      setSelectedId(node.id);
    }
  };

  const submitUnlock = (value: string): boolean => {
    if (!pendingUnlock) return false;
    if (value !== FOLDER_PASSWORD) {
      audio.denied();
      window.dispatchEvent(
        new CustomEvent(WINDOW_SHAKE_EVENT, { detail: { appId: "explorer" } }),
      );
      return false;
    }
    const id = pendingUnlock.id;
    audio.select();
    // Writes to sessionStorage + dispatches EXPLORER_UNLOCK_EVENT, which
    // the effect above picks up to refresh local state. Terminal does the
    // same so unlocks sync both ways.
    addUnlocked(id);
    setPath((p) => [...p, id]);
    setSelectedId(null);
    setPreview(null);
    setPendingUnlock(null);
    return true;
  };

  const goUp = () => {
    if (path.length === 0) return;
    audio.back();
    setPath((p) => p.slice(0, -1));
    setSelectedId(null);
    setPreview(null);
  };

  const moveSelection = (delta: number) => {
    const items = folder.children;
    if (items.length === 0) return;
    const idx = selectedId ? items.findIndex((i) => i.id === selectedId) : -1;
    const next = idx === -1 ? 0 : Math.min(items.length - 1, Math.max(0, idx + delta));
    if (next !== idx) {
      audio.nav();
      setSelectedId(items[next].id);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (preview) {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        audio.back();
        setPreview(null);
      }
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const node = folder.children.find((i) => i.id === selectedId);
      if (node) open(node);
    } else if (e.key === "Escape" || e.key === "Backspace") {
      e.preventDefault();
      goUp();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative h-full w-full flex flex-col bg-bg text-xs outline-none"
    >
      {/* Header / breadcrumb */}
      <div className="px-3 py-2 border-b border-primary/30 bg-bg-elevated text-[10px] uppercase tracking-widest flex items-center gap-3">
        <button
          type="button"
          onClick={goUp}
          disabled={path.length === 0}
          aria-label="Go up one folder"
          className="px-2 py-0.5 border border-primary/50 text-primary hover:bg-primary/15 hover:border-primary transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-primary/50 flex items-center gap-1"
        >
          <span aria-hidden="true">▴</span> up
        </button>
        <span className="text-primary">// explorer</span>
        <nav className="text-fg-muted flex items-center gap-1 truncate" aria-label="path">
          {crumbs.map((c, i) => (
            <span key={`${c.id}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span className="text-fg-subtle">›</span>}
              <span className={i === crumbs.length - 1 ? "text-primary" : "text-fg-muted"}>
                {c.name}
              </span>
            </span>
          ))}
        </nav>
        <span className="ml-auto text-fg-subtle">
          {folder.children.length} item{folder.children.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Main: grid + optional preview */}
      <div className="flex-1 flex min-h-0">
        <div
          className={`flex-1 overflow-y-auto p-4 ${
            preview ? "border-r border-primary/30" : ""
          }`}
        >
          {folder.children.length === 0 ? (
            <p className="text-fg-subtle uppercase tracking-widest text-[10px]">
              // empty folder
            </p>
          ) : (
            <ul
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
              }}
              role="listbox"
              aria-label="Files and folders"
            >
              {folder.children.map((node) => {
                const selected = selectedId === node.id;
                const locked =
                  node.type === "folder" &&
                  node.passwordProtected &&
                  !unlockedFolders.has(node.id);
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        audio.nav();
                        setSelectedId(node.id);
                      }}
                      onDoubleClick={() => open(node)}
                      className={`w-full flex flex-col items-center gap-1.5 p-2 border transition-colors text-center cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-transparent text-fg-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <div
                        className={`relative ${locked ? "text-warning" : "text-primary"}`}
                        style={{
                          filter:
                            "drop-shadow(0 2px 0 var(--color-bg)) drop-shadow(0 0 6px color-mix(in oklch, var(--color-primary) 35%, transparent))",
                        }}
                      >
                        {iconFor(node)}
                        {(locked || breakingId === node.id) && (
                          <span
                            aria-hidden="true"
                            className={`absolute -top-1 -right-1 size-4 flex items-center justify-center border border-warning bg-bg-elevated text-warning ${
                              breakingId === node.id ? "lock-breaking" : ""
                            }`}
                          >
                            <LockBadgeIcon />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider truncate w-full">
                        {node.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {preview && <PreviewPane node={preview} onClose={() => setPreview(null)} />}
      </div>

      {pendingUnlock && (
        <UnlockOverlay
          folder={pendingUnlock}
          onCancel={() => setPendingUnlock(null)}
          onSubmit={submitUnlock}
          onCrack={() => {
            const folder = pendingUnlock;
            requestCrack({
              kind: "folder",
              id: folder.id,
              name: `${folder.name}/`,
              difficulty: 2,
            });
            window.dispatchEvent(
              new CustomEvent(WINDOW_OPEN_EVENT, {
                detail: { appId: "hacking" },
              }),
            );
            setPendingUnlock(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Inline password prompt (folder-level). Mirrors the global
// PasswordPrompt's look but stays inside the explorer window.
// ─────────────────────────────────────────────────────────

function UnlockOverlay({
  folder,
  onCancel,
  onSubmit,
  onCrack,
}: {
  folder: FolderNode;
  onCancel: () => void;
  onSubmit: (value: string) => boolean;
  onCrack: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onSubmit(value);
    if (!ok) {
      setError(true);
      setValue("");
      window.setTimeout(() => setError(false), 420);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className={`${error ? "pwd-shake" : ""} w-full max-w-sm border-2 border-primary bg-bg-elevated`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-primary bg-primary/10">
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
            <LockBadgeIcon />
            // authentication required
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs uppercase tracking-wider text-primary hover:bg-primary/20 px-2 py-0.5 border border-primary/60"
          >
            [×] cancel
          </button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
              // folder
            </p>
            <p className="text-sm uppercase tracking-widest text-primary">
              {folder.name}
            </p>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-fg-muted">
              // password
            </span>
            <span className="flex items-center gap-2 border border-primary/60 bg-bg px-2 py-1.5 text-xs">
              <span className="text-primary">$</span>
              <input
                ref={inputRef}
                type="password"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={error}
                className="flex-1 bg-transparent outline-none text-fg font-mono tracking-widest"
                placeholder="••••••••"
              />
            </span>
          </label>
          <p
            className={`text-[10px] uppercase tracking-widest min-h-[1em] ${
              error ? "text-danger" : "text-fg-subtle/70"
            }`}
            aria-live="polite"
          >
            {error
              ? "// access denied · invalid credentials"
              : "// hint: admin"}
          </p>

          {/* Alternate: open Codebreaker against this folder. */}
          <div className="flex items-center gap-3 my-1">
            <span className="flex-1 h-px bg-primary/20" />
            <span className="text-[10px] uppercase tracking-widest text-fg-subtle">
              or
            </span>
            <span className="flex-1 h-px bg-primary/20" />
          </div>
          <button
            type="button"
            onClick={onCrack}
            className="w-full px-3 py-2 border border-primary text-primary hover:bg-primary/15 uppercase tracking-wider text-xs transition"
          >
            ▸ crack with codebreaker
          </button>
        </div>
        <div className="px-3 py-2 border-t-2 border-primary flex gap-2 justify-end bg-primary/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-fg-muted hover:text-primary uppercase tracking-wider text-xs transition"
          >
            cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 border border-primary text-primary hover:bg-primary/20 uppercase tracking-wider text-xs transition"
          >
            ▸ unlock
          </button>
        </div>
      </form>
    </div>
  );
}

function PreviewPane({
  node,
  onClose,
}: {
  node: TextNode | ImageNode | SoundNode;
  onClose: () => void;
}) {
  return (
    <aside className="w-72 bg-bg-elevated flex flex-col">
      <div className="px-3 py-2 border-b border-primary/30 flex items-center gap-2 text-[10px] uppercase tracking-widest">
        <span className="text-primary">// preview</span>
        <span className="text-fg-muted truncate flex-1">{node.name}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="px-2 py-0.5 border border-primary/50 text-primary hover:bg-primary/15 hover:border-primary transition"
        >
          [×]
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-primary">
        {node.type === "text" ? (
          <pre className="whitespace-pre-wrap break-words text-fg text-xs leading-relaxed font-mono">
            {node.content}
          </pre>
        ) : node.type === "image" ? (
          node.src ? (
            <img
              src={node.src}
              alt={node.name}
              className="w-full h-auto block"
              style={
                node.pixelated ? { imageRendering: "pixelated" } : undefined
              }
            />
          ) : node.svg ? (
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: node.svg }}
            />
          ) : (
            <p className="text-fg-subtle text-[10px] uppercase tracking-widest">
              // image missing
            </p>
          )
        ) : (
          <SoundPreview node={node} />
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// Sound preview — synth playback via Web Audio (no audio
// assets). Shows a stylised waveform + a play / stop button.
// ─────────────────────────────────────────────────────────

type WebkitWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function SoundPreview({ node }: { node: SoundNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  // Total duration of the sequence in seconds (for the meta line).
  const totalMs = node.tones.reduce(
    (sum, t) => sum + t.durMs + (t.gapMs ?? 0),
    0,
  );

  const stop = () => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    for (const osc of activeOscillatorsRef.current) {
      try {
        osc.stop();
      } catch {}
    }
    activeOscillatorsRef.current = [];
    setPlaying(false);
  };

  // Stop playback when the previewed sound changes or the pane unmounts.
  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  const play = () => {
    if (playing) {
      stop();
      return;
    }
    let ctx = ctxRef.current;
    if (!ctx) {
      const Ctx =
        window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctx) return;
      try {
        ctx = new Ctx();
        ctxRef.current = ctx;
      } catch {
        return;
      }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    let when = ctx.currentTime + 0.02;
    const oscs: OscillatorNode[] = [];
    for (const t of node.tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type ?? "triangle";
      osc.frequency.setValueAtTime(t.freq, when);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(0.12, when + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + t.durMs / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(when);
      osc.stop(when + t.durMs / 1000 + 0.02);
      oscs.push(osc);
      when += (t.durMs + (t.gapMs ?? 0)) / 1000;
    }
    activeOscillatorsRef.current = oscs;
    setPlaying(true);
    // Auto-stop state when the sequence ends.
    const totalSec = when - ctx.currentTime;
    stopTimerRef.current = window.setTimeout(() => {
      activeOscillatorsRef.current = [];
      stopTimerRef.current = null;
      setPlaying(false);
    }, totalSec * 1000);
  };

  // Build a tiny waveform — one vertical bar per tone, height ~ relative pitch.
  const maxFreq = Math.max(...node.tones.map((t) => t.freq), 1);
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-0.5 h-16 border border-primary/40 p-2 bg-bg">
        {node.tones.map((t, i) => {
          const h = Math.max(10, Math.round((t.freq / maxFreq) * 100));
          return (
            <div
              key={i}
              className={`flex-1 bg-primary ${playing ? "boot-caret" : ""}`}
              style={{
                height: `${h}%`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={play}
        className="w-full px-3 py-2 border border-primary text-primary hover:bg-primary/15 uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition"
      >
        {playing ? "■ stop" : "▸ play"}
      </button>

      <dl className="grid grid-cols-[64px_1fr] gap-y-1 text-[10px] uppercase tracking-widest">
        <dt className="text-fg-subtle">duration</dt>
        <dd className="text-fg-muted tabular-nums">
          {(totalMs / 1000).toFixed(2)}s
        </dd>
        <dt className="text-fg-subtle">tones</dt>
        <dd className="text-fg-muted tabular-nums">{node.tones.length}</dd>
        <dt className="text-fg-subtle">format</dt>
        <dd className="text-fg-muted">synth · mono</dd>
      </dl>
    </div>
  );
}
