import { useEffect, useRef } from "react";

/**
 * Web-audio "TV static" engine. White-noise buffer (2s, looped) fed
 * through a highpass + lowpass filter pair, with a per-play gain
 * envelope (fade-in / sustain / fade-out). Listener mounts once and
 * fires on `scifyos:fx:audio-static`.
 *
 * Browser autoplay policy: AudioContext is created lazily on the first
 * play() — that call always originates from a user click (FX button or
 * command palette), which satisfies the user-gesture requirement.
 */

const STATIC_EVENT = "scifyos:fx:audio-static";

type WebkitWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

type StaticDetail = { duration?: number; peak?: number };

class StaticEngine {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private active: AudioBufferSourceNode[] = [];

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctx =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return null;
    try {
      this.ctx = new Ctx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private getBuffer(ctx: AudioContext): AudioBuffer {
    if (this.buffer) return this.buffer;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.buffer = buf;
    return buf;
  }

  async play(durationMs: number, peak = 0.08): Promise<void> {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    // Cancel any in-flight static so volumes don't stack.
    for (const s of this.active) {
      try {
        s.stop();
      } catch {}
    }
    this.active = [];

    const source = ctx.createBufferSource();
    const buffer = this.getBuffer(ctx);
    source.buffer = buffer;
    source.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 800;
    hp.Q.value = 0.7;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 6500;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const dur = durationMs / 1000;
    const fade = Math.min(0.08, dur * 0.2);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + fade);
    gain.gain.setValueAtTime(peak, now + Math.max(dur - fade, fade));
    gain.gain.linearRampToValueAtTime(0, now + dur);

    // Random start offset so successive plays don't sound identical.
    const offset = Math.random() * buffer.duration;
    source.start(now, offset);
    source.stop(now + dur + 0.02);

    this.active.push(source);
    source.onended = () => {
      this.active = this.active.filter((s) => s !== source);
      try {
        source.disconnect();
        hp.disconnect();
        lp.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  close(): void {
    for (const s of this.active) {
      try {
        s.stop();
      } catch {}
    }
    this.active = [];
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

export default function AudioStatic() {
  const engineRef = useRef<StaticEngine | null>(null);

  useEffect(() => {
    const engine = new StaticEngine();
    engineRef.current = engine;

    const onFire = (e: Event) => {
      const detail = (e as CustomEvent<StaticDetail | undefined>).detail;
      void engine.play(detail?.duration ?? 2200, detail?.peak ?? 0.08);
    };

    window.addEventListener(STATIC_EVENT, onFire);
    return () => {
      window.removeEventListener(STATIC_EVENT, onFire);
      engine.close();
    };
  }, []);

  return null;
}
