import type { BotScript } from "../lib/bot";

/**
 * Default bot script. A future game replaces this — either by
 * editing this file or by dispatching BOT_SET_SCRIPT_EVENT at runtime.
 *
 * Each option declares a free-form `action` string that's emitted on
 * BOT_CHOICE_EVENT.detail.action so game code can branch on it without
 * caring about labels.
 */
export const DEFAULT_SCRIPT: BotScript = {
  name: "IO",
  greeting: "Enter your directive.",
  options: [
    {
      id: "hint-cargo",
      label: "▸ where do i start?",
      response:
        "the cargo manifest is wrong. check H-04 in your inbox, then talk to morrigan. don't tell vesper yet.",
      action: "hint.cargo",
    },
    {
      id: "hint-controls",
      label: "▸ how do i navigate?",
      response:
        "double-click any icon to open. dock at the bottom shows running apps. type 'help' in terminal for shell commands.",
      action: "hint.controls",
    },
    {
      id: "status",
      label: "▸ status report",
      response:
        "ship: nightingale · t-04d to sigmund station · 1 unread security alert · 1 anonymous tip in your inbox · 0 active threats (visible).",
      action: "status.report",
    },
    {
      id: "dismiss",
      label: "▸ nothing for now",
      response: "standing by.",
      action: "dismiss",
    },
  ],
};
