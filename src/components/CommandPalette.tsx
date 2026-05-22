import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { applyCRT, applyTheme } from "../lib/preferences";
import { useOpenTransition } from "../lib/useOpenTransition";
import { useFocusTrap } from "../lib/useFocusTrap";

const PALETTE_EXIT_MS = 320;

export const PALETTE_OPEN_EVENT = "scifyos:palette:open";

type CommandPaletteProps = {
  /** Hide the inline ⌘K button; only the keyboard shortcut + portal mount. */
  hideTrigger?: boolean;
};

type Group = "NAVIGATE" | "THEME" | "SYSTEM";

type Command = {
  id: string;
  label: string;
  group: Group;
  shortcut?: string;
  action: () => void | Promise<void>;
};

export default function CommandPalette({
  hideTrigger = false,
}: CommandPaletteProps = {}) {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = useOpenTransition(open, PALETTE_EXIT_MS);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useFocusTrap(dialogRef, open && mounted);

  const commands = useMemo<Command[]>(
    () => [
      { id: "nav-home", group: "NAVIGATE", label: "Go to Overview", action: () => { window.location.href = "/"; } },
      { id: "nav-colors", group: "NAVIGATE", label: "Go to Colors", action: () => { window.location.href = "/colors"; } },
      { id: "nav-typo", group: "NAVIGATE", label: "Go to Typography", action: () => { window.location.href = "/typography"; } },
      { id: "nav-comp", group: "NAVIGATE", label: "Go to Components", action: () => { window.location.href = "/components"; } },
      { id: "nav-play", group: "NAVIGATE", label: "Go to Playground", action: () => { window.location.href = "/playground"; } },
      { id: "nav-term", group: "NAVIGATE", label: "Go to Terminal", action: () => { window.location.href = "/terminal"; } },
      { id: "nav-os", group: "NAVIGATE", label: "Go to OS", action: () => { window.location.href = "/os"; } },
      { id: "th-dark", group: "THEME", label: "Switch to Dark Theme", action: () => applyTheme("dark") },
      { id: "th-light", group: "THEME", label: "Switch to Light Theme", action: () => applyTheme("light") },
      { id: "th-crt-on", group: "THEME", label: "Enable CRT Effect", action: () => applyCRT("on") },
      { id: "th-crt-off", group: "THEME", label: "Disable CRT Effect", action: () => applyCRT("off") },
      { id: "sys-reload", group: "SYSTEM", label: "Reload Page", shortcut: "⌘R", action: () => { window.location.reload(); } },
      {
        id: "sys-copy",
        group: "SYSTEM",
        label: "Copy Current URL",
        action: async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
          } catch {}
        },
      },
      {
        id: "sys-breach",
        group: "SYSTEM",
        label: "Trigger Security Breach",
        shortcut: "DEMO",
        action: () => {
          window.dispatchEvent(new CustomEvent("scifyos:breach"));
        },
      },
      {
        id: "sys-hacked",
        group: "SYSTEM",
        label: "Trigger Hacked Sequence",
        shortcut: "DEMO",
        action: () => {
          window.dispatchEvent(new CustomEvent("scifyos:hacked"));
        },
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [query, commands]);

  const grouped = useMemo(() => {
    const map = new Map<Group, Command[]>();
    filtered.forEach((c) => {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    // Other components (e.g. the OS top bar) can open the palette by
    // dispatching this event — useful when the inline ⌘K trigger is hidden.
    const onOpenRequested = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpenRequested);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpenRequested);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    const cmd = filtered[selected];
    if (!cmd) return;
    itemRefs.current[cmd.id]?.scrollIntoView({ block: "nearest" });
  }, [selected, filtered]);

  const handleSelect = (cmd: Command) => {
    setOpen(false);
    void cmd.action();
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[selected];
      if (cmd) handleSelect(cmd);
    }
  };

  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open command palette"
          title="Open command palette"
          className="px-3 py-1.5 text-xs uppercase tracking-wider text-fg-muted hover:text-primary border border-primary/40 hover:border-primary transition-colors"
        >
          {modKey} K
        </button>
      )}

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed inset-0 z-[120] flex items-start justify-center pt-[15vh] p-4"
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close palette"
              onClick={() => setOpen(false)}
              className={`${closing ? "modal-backdrop-exit" : "modal-backdrop-enter"} absolute inset-0 bg-bg/80 backdrop-blur-sm`}
            />
            <div className={`${closing ? "modal-exit" : "modal-enter"} relative w-full max-w-xl border border-primary bg-bg-elevated text-fg shadow-[var(--shadow-glow)]`}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-primary/40 bg-primary/10">
                <span className="text-xs uppercase tracking-widest text-primary">
                  COMMAND PALETTE
                </span>
                <span className="text-xs uppercase tracking-wider text-fg-muted flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-primary/40">
                    ESC
                  </kbd>
                  CLOSE
                </span>
              </div>

              <div className="flex items-center border-b border-primary/30">
                <span className="px-3 text-primary select-none">$</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="type a command…"
                  className="flex-1 py-3 pr-3 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none"
                />
              </div>

              <div className="max-h-80 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-fg-subtle">
                    no commands match "{query}"
                  </div>
                ) : (
                  grouped.map(([group, items]) => (
                    <div key={group}>
                      <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-fg-subtle">
                        // {group}
                      </div>
                      {items.map((cmd) => {
                        const flatIndex = filtered.findIndex(
                          (c) => c.id === cmd.id,
                        );
                        const isActive = flatIndex === selected;
                        return (
                          <button
                            key={cmd.id}
                            ref={(el) => {
                              itemRefs.current[cmd.id] = el;
                            }}
                            type="button"
                            onMouseEnter={() => setSelected(flatIndex)}
                            onClick={() => handleSelect(cmd)}
                            className={
                              "w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left transition-colors " +
                              (isActive
                                ? "bg-primary/15 text-primary"
                                : "text-fg-muted hover:text-primary")
                            }
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-3 inline-block">
                                {isActive ? "▸" : ""}
                              </span>
                              <span>{cmd.label}</span>
                            </span>
                            {cmd.shortcut && (
                              <kbd className="text-xs uppercase tracking-wider text-fg-subtle">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 py-1.5 border-t border-primary/30 bg-bg flex items-center justify-between text-[10px] uppercase tracking-widest text-fg-subtle">
                <span className="flex items-center gap-3">
                  <span>
                    <kbd className="text-primary">↑↓</kbd> NAV
                  </span>
                  <span>
                    <kbd className="text-primary">⏎</kbd> SELECT
                  </span>
                  <span>
                    <kbd className="text-primary">ESC</kbd> CLOSE
                  </span>
                </span>
                <span>
                  {filtered.length} cmd{filtered.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
