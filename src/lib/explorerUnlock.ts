/**
 * Shared session state for password-protected folders in the Explorer
 * filesystem. The Terminal and Explorer both consume this so unlocking
 * a folder in one immediately unlocks it in the other.
 *
 * sessionStorage (not localStorage) so a tab close re-locks everything.
 * The future game can swap to its own save layer if it wants persistence.
 */

const STORAGE_KEY = "scifyos-explorer-unlocked";
export const EXPLORER_UNLOCK_EVENT = "scifyos:explorer:unlock";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function write(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

export function loadUnlocked(): Set<string> {
  return read();
}

export function addUnlocked(folderId: string): void {
  if (typeof window === "undefined") return;
  const set = read();
  if (set.has(folderId)) return;
  set.add(folderId);
  write(set);
  window.dispatchEvent(
    new CustomEvent<{ folderId: string }>(EXPLORER_UNLOCK_EVENT, {
      detail: { folderId },
    }),
  );
}

// ─────────────────────────────────────────────────────────
// Auto-unlock folders when the Codebreaker reports a crack.
// Top-level listener registered once per tab so it fires
// regardless of which app is open when the crack lands.
// ─────────────────────────────────────────────────────────

const HACKING_CRACKED_EVENT = "scifyos:hacking:cracked";

type CrackedDetail = {
  target?: { kind?: string; id?: string };
};

if (typeof window !== "undefined") {
  window.addEventListener(HACKING_CRACKED_EVENT, (e: Event) => {
    const detail = (e as CustomEvent<CrackedDetail>).detail;
    const t = detail?.target;
    if (t?.kind === "folder" && typeof t.id === "string") {
      addUnlocked(t.id);
    }
  });
}
