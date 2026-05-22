import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AudioStatic from "./AudioStatic";

/* ──────────────────────────────────────────────────────────────
   Raw effect components — render the visual, no listeners.
   Shared by both <Hacked> (composed phases) and <FxHost> (atomic).
   ────────────────────────────────────────────────────────────── */

const RAIN_CHARS = "01アイウエオカキクケコサシスセソタチツ#$%@!?ABCDEF<>/\\|";
const RAIN_COLUMN_COUNT = 48;

export function MatrixRain() {
  const columns = useMemo(
    () =>
      Array.from({ length: RAIN_COLUMN_COUNT }, (_, col) => ({
        key: col,
        left: (col / RAIN_COLUMN_COUNT) * 100 + Math.random() * 1.6,
        chars: Array.from(
          { length: 6 + Math.floor(Math.random() * 10) },
          () => RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)],
        ),
        duration: 0.9 + Math.random() * 0.9,
        delay: -Math.random() * 1.4,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 z-[190] pointer-events-none overflow-hidden text-primary leading-tight text-sm">
      {columns.map((col) => (
        <div
          key={col.key}
          className="hacked-rain-column absolute top-0"
          style={{
            left: `${col.left}%`,
            animationDuration: `${col.duration}s`,
            animationDelay: `${col.delay}s`,
          }}
        >
          {col.chars.map((c, i) => {
            const isLead = i === col.chars.length - 1;
            return (
              <div
                key={i}
                style={{
                  opacity: isLead ? 1 : 0.25 + (i / col.chars.length) * 0.5,
                  color: isLead ? "var(--color-fg)" : undefined,
                  textShadow: isLead
                    ? "0 0 6px color-mix(in oklch, var(--color-primary) 60%, transparent)"
                    : undefined,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const STRIP_COLORS = ["danger", "primary", "accent", "warning"] as const;
const STRIP_BLENDS = ["screen", "difference", "overlay"] as const;
const STRIP_COUNT = 18;

export function GlitchStrips() {
  const strips = useMemo(
    () =>
      Array.from({ length: STRIP_COUNT }, (_, i) => {
        const isThick = Math.random() > 0.65;
        const isSlide = Math.random() > 0.35;
        const isReverse = Math.random() > 0.5;
        return {
          key: i,
          top: Math.random() * 100,
          height: isThick ? 18 + Math.random() * 36 : 1 + Math.random() * 6,
          color: STRIP_COLORS[Math.floor(Math.random() * STRIP_COLORS.length)],
          blend: STRIP_BLENDS[Math.floor(Math.random() * STRIP_BLENDS.length)],
          animation: isSlide
            ? isReverse
              ? "glitch-strip-slide-reverse"
              : "glitch-strip-slide"
            : "glitch-strip-blink",
          duration: 0.12 + Math.random() * 0.35,
          delay: Math.random() * 0.6,
          alpha: isThick ? 55 : 85,
        };
      }),
    [],
  );

  return (
    <div className="fixed inset-0 z-[196] pointer-events-none overflow-hidden">
      {strips.map((s) => (
        <div
          key={s.key}
          className="absolute left-0 right-0"
          style={{
            top: `${s.top}%`,
            height: `${s.height}px`,
            background: `color-mix(in oklch, var(--color-${s.color}) ${s.alpha}%, transparent)`,
            mixBlendMode: s.blend,
            animation: `${s.animation} ${s.duration}s linear ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

const SLICE_COUNT = 8;

export function DataSlices() {
  const slices = useMemo(
    () =>
      Array.from({ length: SLICE_COUNT }, (_, i) => ({
        key: i,
        top: 8 + Math.random() * 84,
        height: 6 + Math.random() * 38,
        duration: 0.35 + Math.random() * 0.55,
        delay: Math.random() * 0.8,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 z-[197] pointer-events-none overflow-hidden">
      {slices.map((s) => (
        <div
          key={s.key}
          className="absolute left-0 right-0 bg-black"
          style={{
            top: `${s.top}%`,
            height: `${s.height}px`,
            animation: `data-slice-flash ${s.duration}s steps(4) ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Standalone Fx wrappers — listen for a custom event, mount the
   effect for a fixed duration, then unmount. Independently
   triggerable: `window.dispatchEvent(new CustomEvent('scifyos:fx:...'))`.
   ────────────────────────────────────────────────────────────── */

const MATRIX_DURATION = 3000;
const GLITCH_DURATION = 1500;
const RED_PULSE_DURATION = 2200;
const SLICES_DURATION = 1500;

function useEventFire(event: string, duration: number): boolean {
  const [on, setOn] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const fire = () => {
      setOn(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setOn(false);
        timerRef.current = null;
      }, duration);
    };
    window.addEventListener(event, fire);
    return () => {
      window.removeEventListener(event, fire);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [event, duration]);

  return on;
}

function MatrixRainFx() {
  const on = useEventFire("scifyos:fx:matrix-rain", MATRIX_DURATION);
  return on ? <MatrixRain /> : null;
}

function RedPulseFx() {
  const on = useEventFire("scifyos:fx:red-pulse", RED_PULSE_DURATION);
  return on ? <div className="breach-pulse" aria-hidden="true" /> : null;
}

function DataSlicesFx() {
  const on = useEventFire("scifyos:fx:data-slices", SLICES_DURATION);
  return on ? <DataSlices /> : null;
}

/* GlitchFx is special — it also temporarily sets data-hacked="phase-1"
   on <html> so the page-content CSS jitter + chromatic aberration kicks
   in alongside the strips & slices. */
function GlitchFx() {
  const [on, setOn] = useState(false);
  const timerRef = useRef<number | null>(null);
  const ownsAttr = useRef(false);

  useEffect(() => {
    const fire = () => {
      if (document.documentElement.dataset.hacked) return; // sequence already running — don't interfere
      setOn(true);
      document.documentElement.dataset.hacked = "phase-1";
      ownsAttr.current = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setOn(false);
        if (ownsAttr.current) {
          document.documentElement.removeAttribute("data-hacked");
          ownsAttr.current = false;
        }
        timerRef.current = null;
      }, GLITCH_DURATION);
    };
    window.addEventListener("scifyos:fx:glitch", fire);
    return () => {
      window.removeEventListener("scifyos:fx:glitch", fire);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (ownsAttr.current) {
        document.documentElement.removeAttribute("data-hacked");
      }
    };
  }, []);

  return on ? (
    <>
      <GlitchStrips />
      <DataSlices />
    </>
  ) : null;
}

/* ──────────────────────────────────────────────────────────────
   FxHost — mount once per page (next to <BreachAlert>/<Hacked>).
   Portals all listener wrappers to <body> so they're free of any
   ancestor transforms / filters.
   ────────────────────────────────────────────────────────────── */

export default function FxHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <>
      <MatrixRainFx />
      <GlitchFx />
      <RedPulseFx />
      <DataSlicesFx />
      <AudioStatic />
    </>,
    document.body,
  );
}
