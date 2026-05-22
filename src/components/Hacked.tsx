import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOpenTransition } from "../lib/useOpenTransition";
import { DataSlices, GlitchStrips, MatrixRain } from "./Fx";

export const HACKED_EVENT = "scifyos:hacked";
export const HACKED_MODAL_EVENT = "scifyos:hacked:modal";

type Phase = "idle" | "phase-1" | "phase-2" | "phase-3";

const GLITCH_MS = 1500;
const DISINTEGRATE_MS = 1500;
const MODAL_EXIT_MS = 320;

const SKULL_FRAMES = [
  [
    "   _____   ",
    "  /     \\  ",
    " |  O O  | ",
    " |   v   | ",
    "  \\ === /  ",
    "   \\___/   ",
  ].join("\n"),
  [
    "   _____   ",
    "  /     \\  ",
    " |  - -  | ",
    " |   v   | ",
    "  \\ === /  ",
    "   \\___/   ",
  ].join("\n"),
  [
    "   _____   ",
    "  /     \\  ",
    " |  O O  | ",
    " |   .   | ",
    "  \\ === /  ",
    "   \\___/   ",
  ].join("\n"),
  [
    "   _____   ",
    "  /     \\  ",
    " |  X X  | ",
    " |   ?   | ",
    "  \\ vvv /  ",
    "   \\___/   ",
  ].join("\n"),
];

function AnimatedSkull() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % SKULL_FRAMES.length);
    }, 240);
    return () => window.clearInterval(id);
  }, []);
  return (
    <pre
      aria-hidden="true"
      className="hacked-skull text-danger leading-tight text-center select-none text-2xl"
    >
      {SKULL_FRAMES[frame]}
    </pre>
  );
}

export default function Hacked() {
  const [phase, setPhase] = useState<Phase>("idle");
  const modalOpen = phase === "phase-3";
  const { mounted, closing } = useOpenTransition(modalOpen, MODAL_EXIT_MS);

  useEffect(() => {
    const onHack = () => {
      setPhase((p) => (p === "idle" ? "phase-1" : p));
    };
    const onModalOnly = () => {
      setPhase((p) => (p === "idle" ? "phase-3" : p));
    };
    window.addEventListener(HACKED_EVENT, onHack);
    window.addEventListener(HACKED_MODAL_EVENT, onModalOnly);
    return () => {
      window.removeEventListener(HACKED_EVENT, onHack);
      window.removeEventListener(HACKED_MODAL_EVENT, onModalOnly);
    };
  }, []);

  useEffect(() => {
    if (phase === "idle") {
      document.documentElement.removeAttribute("data-hacked");
      return;
    }
    document.documentElement.setAttribute("data-hacked", phase);
    if (phase === "phase-1") {
      const t = window.setTimeout(() => setPhase("phase-2"), GLITCH_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "phase-2") {
      // Data is being exfiltrated — show the copy modal in sync with the
      // disintegrate so it lands just before the breach reveal. autoClose
      // dismisses the modal when its progress finishes.
      window.dispatchEvent(
        new CustomEvent("scifyos:fx:copy-files", {
          detail: { duration: 1400, autoClose: true },
        }),
      );
      const t = window.setTimeout(() => setPhase("phase-3"), DISINTEGRATE_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPhase("idle");
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const close = () => setPhase("idle");

  if (typeof document === "undefined") return null;

  const showGlitch = phase === "phase-1";
  const showRain = phase === "phase-2" || phase === "phase-3";
  const renderAnything = phase !== "idle" || mounted;
  if (!renderAnything) return null;

  return createPortal(
    <>
      {showGlitch && (
        <>
          <GlitchStrips />
          <DataSlices />
        </>
      )}
      {showRain && <MatrixRain />}
      {mounted && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="System hacked"
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black"
        >
          <div
            className={`${closing ? "modal-exit" : "modal-enter"} relative w-full max-w-md border-2 border-danger bg-black text-danger shadow-[0_0_60px_-4px_color-mix(in_oklch,var(--color-danger)_70%,transparent)]`}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-danger bg-danger/15">
              <span className="text-xs uppercase tracking-widest text-danger">
                ⚠ SYSTEM COMPROMISED ⚠
              </span>
              <button
                type="button"
                onClick={close}
                className="text-xs uppercase tracking-wider text-danger hover:bg-danger/20 px-2 py-0.5 border border-danger"
              >
                [×] CLOSE
              </button>
            </div>

            <div className="px-6 py-8 text-center space-y-6">
              <AnimatedSkull />
              <h2 className="hacked-text text-3xl tracking-widest uppercase">
                YOU HAVE BEEN HACK3D
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-danger/70 leading-relaxed">
                // process: rootkit.exe<br />
                // signature: <span className="text-danger">DEADBEEF-CAFE-BABE</span><br />
                // recovery: <span className="text-danger">impossible</span>
              </p>
            </div>

            <div className="px-3 py-3 border-t-2 border-danger flex justify-end bg-danger/5">
              <button
                type="button"
                onClick={close}
                className="px-4 py-1.5 border border-danger text-danger hover:bg-danger/20 uppercase tracking-wider text-xs transition"
              >
                ▸ FORMAT DRIVE
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
