import { useEffect, useRef, useState } from "react";
import { DEFAULT_SCRIPT } from "../data/bot-script";
import { useNavAudio } from "../lib/useNavAudio";
import {
  BOT_CHOICE_EVENT,
  BOT_CLOSED_EVENT,
  BOT_OPENED_EVENT,
  BOT_SAY_EVENT,
  BOT_SET_SCRIPT_EVENT,
  loadBotMemory,
  saveBotMemory,
  type BotChoiceDetail,
  type BotMemory,
  type BotOption,
  type BotSayDetail,
  type BotScript,
} from "../lib/bot";

type WebkitWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

// Typewriter cadence + mouth toggle rate.
const TYPE_MS_PER_CHAR = 28;
const MOUTH_TOGGLE_MS = 110;
const BLEEP_EVERY_N_CHARS = 2;
// "Thinking" delay before the bot replies + spinner frame cadence.
const THINK_DELAY_MS = 1400;
const THINK_FRAME_MS = 130;
const THINK_FRAMES = ["/", "—", "\\", "|"];

/**
 * Pass 1 of the AI helper character.
 *
 * - Renders a small CRT-box avatar fixed bottom-right
 * - Eyes blink every ~8–12s (random jitter)
 * - Mouth is static (talking + audio land in Pass 3)
 * - Click avatar → opens a dialog panel above with the greeting
 * - Closes via [×] or by clicking the avatar again
 * - Loads BotMemory from sessionStorage on mount; future passes write to it
 */

// Min/max delay between blinks (ms).
const BLINK_MIN = 8000;
const BLINK_MAX = 12000;
const BLINK_DURATION = 160;

export default function BotAvatar() {
  const [open, setOpen] = useState(false);
  const [blinking, setBlinking] = useState(false);
  // Memory is loaded once and held; updated + persisted on each pick.
  const memoryRef = useRef<BotMemory>(loadBotMemory());

  /** Active script. Starts as DEFAULT_SCRIPT and may be replaced wholesale
   *  by BOT_SET_SCRIPT_EVENT. The back button restores this script's
   *  options. */
  const scriptRef = useRef<BotScript>(DEFAULT_SCRIPT);
  const [scriptName, setScriptName] = useState<string>(DEFAULT_SCRIPT.name);

  // Currently-displayed body text. If memory has a lastBody (the player has
  // already picked something in this session), restore it; otherwise show
  // the greeting.
  const [body, setBody] = useState<string>(
    () => memoryRef.current.lastBody ?? DEFAULT_SCRIPT.greeting,
  );
  // Options vanish after a pick (one-shot). A future BOT_SAY_EVENT (Pass 3)
  // or BOT_SET_SCRIPT_EVENT can repopulate them.
  const [options, setOptions] = useState<BotOption[]>(() =>
    memoryRef.current.lastBody ? [] : DEFAULT_SCRIPT.options,
  );

  // Talking state — drives mouth animation + bleeps + caret.
  const [talking, setTalking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  // Number of characters of `body` currently revealed by the typewriter.
  const [revealed, setRevealed] = useState<number>(body.length);
  /** The last body whose typewriter has fully played. Prevents re-typing
   *  when the dialog is just toggled open/closed. */
  const spokenRef = useRef<string>(body);
  // Lazy AudioContext for bleep playback (user-gesture-safe).
  const ctxRef = useRef<AudioContext | null>(null);
  // Shared nav audio — used for the open / close / commit sound effects.
  const audio = useNavAudio();

  // Thinking state — gates the response after the player picks a directive
  // (or a BOT_SAY event lands), giving IO a moment to "process."
  const [thinking, setThinking] = useState(false);
  const [thinkFrame, setThinkFrame] = useState(0);
  /** Cleanup handle for the pending response timer so back/close cancels it. */
  const thinkTimerRef = useRef<number | null>(null);

  // Spinner — cycles / — \ | while thinking.
  useEffect(() => {
    if (!thinking) return;
    const id = window.setInterval(() => {
      setThinkFrame((f) => (f + 1) % THINK_FRAMES.length);
    }, THINK_FRAME_MS);
    return () => window.clearInterval(id);
  }, [thinking]);

  /** Stage a new body to "speak", but wait for the thinking delay first
   *  so it feels like IO is processing. Cancels any pending think. */
  const speakWithThinking = (next: string) => {
    if (thinkTimerRef.current !== null) {
      window.clearTimeout(thinkTimerRef.current);
    }
    setThinking(true);
    thinkTimerRef.current = window.setTimeout(() => {
      thinkTimerRef.current = null;
      setThinking(false);
      // Force the typewriter to play even if the new body coincidentally
      // matches what was previously spoken.
      spokenRef.current = "";
      setBody(next);
    }, THINK_DELAY_MS);
  };

  const playBleep = () => {
    const Ctx =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        ctx = new Ctx();
        ctxRef.current = ctx;
      } catch {
        return;
      }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const freq = 540 + Math.random() * 140; // 540–680 Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  };

  // Typewriter — animates `body` when it changes (and the dialog is open).
  // If the body has already been fully spoken, just show it without animating.
  useEffect(() => {
    if (!open) return;
    if (body === spokenRef.current) {
      setRevealed(body.length);
      setTalking(false);
      return;
    }
    setRevealed(0);
    setTalking(true);
    let i = 0;
    let timer: number | undefined;
    const tick = () => {
      i += 1;
      setRevealed(i);
      const ch = body.charAt(i - 1);
      // Bleep on every Nth non-whitespace char.
      if (i % BLEEP_EVERY_N_CHARS === 0 && ch.trim() !== "") {
        playBleep();
      }
      if (i >= body.length) {
        spokenRef.current = body;
        setTalking(false);
        return;
      }
      timer = window.setTimeout(tick, TYPE_MS_PER_CHAR);
    };
    timer = window.setTimeout(tick, 80);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, open]);

  // Mouth flap while talking.
  useEffect(() => {
    if (!talking) {
      setMouthOpen(false);
      return;
    }
    let open = false;
    const id = window.setInterval(() => {
      open = !open;
      setMouthOpen(open);
    }, MOUTH_TOGGLE_MS);
    return () => {
      window.clearInterval(id);
      setMouthOpen(false);
    };
  }, [talking]);

  // (in) Game pushes a new message — open the dialog, speak the body,
  // optionally replace options.
  useEffect(() => {
    const onSay = (e: Event) => {
      const detail = (e as CustomEvent<BotSayDetail>).detail;
      if (!detail?.body) return;
      const mem = memoryRef.current;
      mem.lastBody = detail.body;
      saveBotMemory(mem);
      if (detail.options !== undefined) setOptions(detail.options);
      else setOptions([]);
      if (!open) {
        setOpen(true);
        window.dispatchEvent(new CustomEvent(BOT_OPENED_EVENT));
      }
      // Run the body through the thinking gate so a game-pushed message
      // also gets the "/ — \ |" processing beat before IO speaks.
      speakWithThinking(detail.body);
    };
    window.addEventListener(BOT_SAY_EVENT, onSay);
    return () => window.removeEventListener(BOT_SAY_EVENT, onSay);
  }, [open]);

  // (in) Game replaces the entire script — name, greeting, options.
  useEffect(() => {
    const onSetScript = (e: Event) => {
      const next = (e as CustomEvent<BotScript>).detail;
      if (!next) return;
      scriptRef.current = next;
      setScriptName(next.name);
      // Reset to greeting + new options (forget any cached lastBody since the
      // entire script changed underneath us).
      const mem = memoryRef.current;
      mem.lastBody = undefined;
      saveBotMemory(mem);
      setBody(next.greeting);
      setOptions(next.options);
    };
    window.addEventListener(BOT_SET_SCRIPT_EVENT, onSetScript);
    return () => window.removeEventListener(BOT_SET_SCRIPT_EVENT, onSetScript);
  }, []);

  // Random-interval eye blink.
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const schedule = () => {
      const delay = BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          schedule();
        }, BLINK_DURATION);
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const pick = (option: BotOption) => {
    // Audio cue for committing to a directive.
    audio.select();

    // Append to memory + persist
    const mem = memoryRef.current;
    mem.choices = [...mem.choices, option.id];
    if (option.response) mem.lastBody = option.response;
    saveBotMemory(mem);

    // Clear options immediately. If there's a response, route it through
    // the thinking gate so IO appears to process before replying.
    setOptions([]);
    if (option.response) speakWithThinking(option.response);

    // Fire the game hook
    window.dispatchEvent(
      new CustomEvent<BotChoiceDetail>(BOT_CHOICE_EVENT, {
        detail: { optionId: option.id, action: option.action },
      }),
    );
  };

  const goBack = () => {
    // Wipe the cached response and restore the active script's options.
    // The choice history (mem.choices) stays — that's the game's audit trail.
    const mem = memoryRef.current;
    mem.lastBody = undefined;
    saveBotMemory(mem);
    const script = scriptRef.current;
    // Force a typewriter replay even if the greeting matches a previously
    // spoken string by clearing the spoken cache.
    spokenRef.current = "";
    setBody(script.greeting);
    setOptions(script.options);
  };

  // Back is offered when the user has picked something and the active
  // script actually has options to return to.
  const canGoBack =
    options.length === 0 && scriptRef.current.options.length > 0;

  const toggle = () => {
    const next = !open;
    if (next) audio.select();
    else {
      audio.back();
      // Cancel any pending "thinking" reply if the user closes mid-process.
      if (thinkTimerRef.current !== null) {
        window.clearTimeout(thinkTimerRef.current);
        thinkTimerRef.current = null;
        setThinking(false);
      }
    }
    setOpen(next);
    window.dispatchEvent(
      new CustomEvent(next ? BOT_OPENED_EVENT : BOT_CLOSED_EVENT),
    );
  };

  const close = () => {
    audio.back();
    if (thinkTimerRef.current !== null) {
      window.clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
      setThinking(false);
    }
    setOpen(false);
    window.dispatchEvent(new CustomEvent(BOT_CLOSED_EVENT));
  };

  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 pointer-events-none"
      aria-live="polite"
    >
      {open && (
        <div
          role="dialog"
          aria-label={`${DEFAULT_SCRIPT.name} dialog`}
          className="bot-dialog-enter pointer-events-auto w-72 border-2 border-primary bg-bg-elevated shadow-[var(--shadow-glow)]"
        >
          <header className="flex items-center justify-between px-3 py-1.5 border-b border-primary/40 bg-primary/10">
            <span className="text-xs uppercase tracking-widest text-primary">
              // {scriptName}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              className="text-xs text-primary hover:bg-primary/20 px-2 py-0.5 border border-primary/60 transition"
            >
              [×]
            </button>
          </header>
          <div className="px-3 py-3 space-y-3 text-xs">
            {thinking ? (
              <div
                aria-live="polite"
                className="flex items-center gap-2 py-2 text-fg-muted uppercase tracking-widest"
              >
                <span
                  className="font-mono w-3 inline-block text-primary"
                  aria-hidden="true"
                >
                  {THINK_FRAMES[thinkFrame]}
                </span>
                <span className="text-[10px]">// processing</span>
              </div>
            ) : (
              <p className="text-fg leading-relaxed">
                {body.slice(0, revealed)}
                {talking && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-[0.5em] h-[1em] align-text-bottom bg-primary ml-0.5 boot-caret"
                  />
                )}
              </p>
            )}
            {!thinking && (options.length === 0 ? (
              canGoBack ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="w-full text-left px-3 py-2 border border-primary bg-primary text-primary-fg font-bold hover:bg-primary/85 transition uppercase tracking-wider text-xs"
                >
                  ◂ back to directives
                </button>
              ) : (
                <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
                  // awaiting further input
                </p>
              )
            ) : (
              <ul className="flex flex-col gap-1.5">
                {options.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => pick(opt)}
                      className="w-full text-left px-3 py-2 border border-primary bg-primary text-primary-fg font-bold hover:bg-primary/85 transition uppercase tracking-wider text-xs"
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? `Close ${DEFAULT_SCRIPT.name}` : `Open ${DEFAULT_SCRIPT.name}`}
        title={DEFAULT_SCRIPT.name}
        className="pointer-events-auto group block size-20 text-primary hover:scale-105 transition-transform"
      >
        <BotFace blinking={blinking} mouthOpen={mouthOpen} />
      </button>
    </div>
  );
}

function BotFace({
  blinking,
  mouthOpen,
}: {
  blinking: boolean;
  mouthOpen: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 110"
      className="w-full h-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {/* Antenna */}
      <line x1="50" y1="14" x2="50" y2="6" />
      <circle cx="50" cy="4" r="2" fill="currentColor" stroke="none" />

      {/* Body */}
      <rect x="8" y="14" width="84" height="88" />
      {/* Inner screen */}
      <rect
        x="16"
        y="24"
        width="68"
        height="50"
        style={{ fill: "var(--color-bg)" }}
        strokeWidth="1"
      />

      {/* Eyes — closed (line) when blinking, open (filled circles) otherwise */}
      {blinking ? (
        <>
          <line x1="32" y1="42" x2="42" y2="42" strokeWidth="2.5" />
          <line x1="58" y1="42" x2="68" y2="42" strokeWidth="2.5" />
        </>
      ) : (
        <>
          <circle cx="37" cy="42" r="3" fill="currentColor" stroke="none" />
          <circle cx="63" cy="42" r="3" fill="currentColor" stroke="none" />
        </>
      )}

      {/* Mouth — toggles open/closed every MOUTH_TOGGLE_MS while the
          parent's `talking` state is true. */}
      {mouthOpen ? (
        <ellipse cx="50" cy="60" rx="6" ry="3" fill="currentColor" stroke="none" />
      ) : (
        <path d="M 42 60 Q 50 64 58 60" />
      )}

      {/* Lower control panel */}
      <line x1="16" y1="82" x2="84" y2="82" strokeWidth="1" opacity="0.6" />
      <circle cx="26" cy="92" r="2" fill="currentColor" stroke="none" />
      <circle cx="36" cy="92" r="2" fill="currentColor" stroke="none" />
      <rect x="46" y="89" width="32" height="6" strokeWidth="1" />
    </svg>
  );
}
