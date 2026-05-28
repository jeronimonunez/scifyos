/**
 * Contract for the AI helper character ("IO" by default).
 *
 * Types, event constants, and sessionStorage-backed memory helpers
 * — exported separately from the visual component so a future game
 * can import the contract without dragging React.
 */

// ─────────────────────────────────────────────────────────
// Script types
// ─────────────────────────────────────────────────────────

export type BotOption = {
  id: string;
  /** Short text shown on the option button. */
  label: string;
  /** Optional bot reply rendered into the dialog after the user picks. */
  response?: string;
  /** Free-form game-state hook fired on BOT_CHOICE_EVENT.detail.action. */
  action?: string;
};

export type BotScript = {
  /** Character name displayed in the dialog header (e.g. "IO"). */
  name: string;
  /** Static greeting shown when the dialog opens (Pass 1+). */
  greeting: string;
  /** Player-pickable options shown below the greeting (Pass 2+). */
  options: BotOption[];
};

// ─────────────────────────────────────────────────────────
// Events
//
// in  = game/app dispatches → bot listens
// out = bot dispatches      → game/app listens
// ─────────────────────────────────────────────────────────

/** (in) Game pushes a one-shot message to the bot. The bot opens,
 *  speaks the body, and (if `options` is non-null) replaces the
 *  current script options.
 *  detail: { body: string; options?: BotOption[] } */
export const BOT_SAY_EVENT = "scifyos:bot:say";

/** (in) Game replaces the entire script (name + greeting + options).
 *  detail: BotScript */
export const BOT_SET_SCRIPT_EVENT = "scifyos:bot:set-script";

/** (out) User picked an option.
 *  detail: { optionId: string; action?: string } */
export const BOT_CHOICE_EVENT = "scifyos:bot:choice";

/** (out) Dialog opened — for pause-game / analytics. */
export const BOT_OPENED_EVENT = "scifyos:bot:opened";

/** (out) Dialog closed. */
export const BOT_CLOSED_EVENT = "scifyos:bot:closed";

export type BotSayDetail = { body: string; options?: BotOption[] };
export type BotChoiceDetail = { optionId: string; action?: string };

// ─────────────────────────────────────────────────────────
// Memory
//
// sessionStorage-backed so a tab close resets it. Future games
// can override saveBotMemory / loadBotMemory with a real save layer.
// ─────────────────────────────────────────────────────────

const MEMORY_KEY = "scifyos-bot-memory";

export type BotMemory = {
  /** Ordered list of option ids the player has picked. */
  choices: string[];
  /** Last message body the bot delivered (so it persists across
   *  open/close inside a session). */
  lastBody?: string;
  /** Open arbitrary slot for the game to attach state. */
  notes?: Record<string, unknown>;
};

const EMPTY_MEMORY: BotMemory = { choices: [] };

export function loadBotMemory(): BotMemory {
  if (typeof window === "undefined") return { ...EMPTY_MEMORY };
  try {
    const raw = sessionStorage.getItem(MEMORY_KEY);
    if (!raw) return { ...EMPTY_MEMORY };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_MEMORY };
    return {
      choices: Array.isArray(parsed.choices)
        ? parsed.choices.filter((c: unknown): c is string => typeof c === "string")
        : [],
      lastBody: typeof parsed.lastBody === "string" ? parsed.lastBody : undefined,
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : undefined,
    };
  } catch {
    return { ...EMPTY_MEMORY };
  }
}

export function saveBotMemory(memory: BotMemory): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {}
}

export function clearBotMemory(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(MEMORY_KEY);
  } catch {}
}
