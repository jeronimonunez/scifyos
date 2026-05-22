import { useEffect, useState } from "react";
import { applyCRT, CRT_EVENT, type CRTState } from "../lib/preferences";

function getInitialCRT(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.crt === "on";
}

export default function CRTToggle() {
  const [on, setOn] = useState<boolean>(getInitialCRT);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CRTState>).detail;
      setOn(detail === "on");
    };
    window.addEventListener(CRT_EVENT, onChange);
    return () => window.removeEventListener(CRT_EVENT, onChange);
  }, []);

  const toggle = () => {
    applyCRT(on ? "off" : "on");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Turn CRT effect ${on ? "off" : "on"}`}
      title={`Turn CRT effect ${on ? "off" : "on"}`}
      className="px-3 py-1.5 text-xs uppercase tracking-wider text-fg-muted hover:text-primary border border-primary/40 hover:border-primary transition-colors"
    >
      {on ? "■ CRT" : "□ CRT"}
    </button>
  );
}
