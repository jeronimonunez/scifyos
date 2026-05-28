import { useRef } from "react";

/**
 * Small synth blips for list-style apps (Logs, Mail). Three sounds:
 *   - nav    short tick when selection moves
 *   - select rising chirp when an item is opened
 *   - back   falling chirp when returning to the list
 *
 * Lazy AudioContext — created on first user gesture inside the app, so
 * browsers' autoplay policy is satisfied. Safe to call any method
 * before the user has interacted; it'll just do nothing.
 */

type WebkitWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

export type NavAudio = {
  nav: () => void;
  select: () => void;
  back: () => void;
  /** Two descending square buzzes — for wrong password / access denied. */
  denied: () => void;
};

export function useNavAudio(): NavAudio {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = () => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
        : undefined;
    if (!Ctx) return null;
    try {
      ctxRef.current = new Ctx();
    } catch {
      return null;
    }
    return ctxRef.current;
  };

  const blip = (
    freq: number,
    durMs: number,
    type: OscillatorType,
    peak: number,
  ) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.02);
  };

  const sweep = (
    fromHz: number,
    toHz: number,
    durMs: number,
    peak: number,
  ) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const sec = durMs / 1000;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(fromHz, now);
    osc.frequency.linearRampToValueAtTime(toHz, now + sec * 0.66);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sec);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + sec + 0.02);
  };

  const denied = () => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    // Two short square buzzes — the second slightly lower.
    const note = (start: number, freq: number, durMs: number, peak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const sec = durMs / 1000;
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + sec);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + sec + 0.02);
    };
    note(now,        185, 110, 0.07);
    note(now + 0.13, 140, 160, 0.07);
  };

  return {
    nav: () => blip(880, 50, "square", 0.04),
    select: () => sweep(660, 1320, 180, 0.07),
    back: () => sweep(880, 440, 140, 0.05),
    denied,
  };
}
