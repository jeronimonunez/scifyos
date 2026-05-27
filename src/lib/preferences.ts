/**
 * Shared write-channel for user preferences that live on
 * <html>'s data-attributes (theme + CRT).
 *
 * Components call `applyTheme` / `applyCRT` from any handler and
 * listen for THEME_EVENT / CRT_EVENT to mirror the new value into
 * their local React state. Single source of truth, no setState loops.
 */

export type Theme = "dark" | "light";
export type CRTState = "on" | "off";
export type CursorState = "on" | "off";
/** Visual skin = palette + font choice. Independent of dark/light Theme. */
export type Skin = "hacker" | "amber";

export const THEME_EVENT = "scifyos:theme-change";
export const CRT_EVENT = "scifyos:crt-change";
export const CURSOR_EVENT = "scifyos:cursor-change";
export const SKIN_EVENT = "scifyos:skin-change";

const THEME_KEY = "scifyos-theme";
const CRT_KEY = "scifyos-crt";
const CURSOR_KEY = "scifyos-cursor";
const SKIN_KEY = "scifyos-skin";

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

export function applyCRT(state: CRTState): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.crt = state;
  try {
    localStorage.setItem(CRT_KEY, state);
  } catch {}
  window.dispatchEvent(
    new CustomEvent<CRTState>(CRT_EVENT, { detail: state }),
  );
}

export function applyCursor(state: CursorState): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.cursor = state;
  try {
    localStorage.setItem(CURSOR_KEY, state);
  } catch {}
  window.dispatchEvent(
    new CustomEvent<CursorState>(CURSOR_EVENT, { detail: state }),
  );
}

export function applySkin(skin: Skin): void {
  if (typeof document === "undefined") return;
  const prev = document.documentElement.dataset.skin;
  const changing = prev !== undefined && prev !== "" && prev !== skin;

  document.documentElement.dataset.skin = skin;
  try {
    localStorage.setItem(SKIN_KEY, skin);
  } catch {}
  window.dispatchEvent(new CustomEvent<Skin>(SKIN_EVENT, { detail: skin }));

  // Different skins ship with different default window sizes (e.g. amber's
  // larger metrics) and might want fresh icon layouts. Clear the persisted
  // positions and reload so the new defaults take effect.
  if (changing) {
    try {
      localStorage.removeItem("scifyos-os-window-positions");
      localStorage.removeItem("scifyos-desktop-icons");
    } catch {}
    if (typeof location !== "undefined") {
      location.reload();
    }
  }
}
