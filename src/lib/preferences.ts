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

export const THEME_EVENT = "scifyos:theme-change";
export const CRT_EVENT = "scifyos:crt-change";
export const CURSOR_EVENT = "scifyos:cursor-change";

const THEME_KEY = "scifyos-theme";
const CRT_KEY = "scifyos-crt";
const CURSOR_KEY = "scifyos-cursor";

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
