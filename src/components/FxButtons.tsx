type Tone = "primary" | "warning" | "danger";

type FxTrigger = {
  label: string;
  event: string;
  tone: Tone;
  hint: string;
};

const fx: FxTrigger[] = [
  {
    label: "MATRIX RAIN",
    event: "scifyos:fx:matrix-rain",
    tone: "primary",
    hint: "3s · falling characters overlay",
  },
  {
    label: "GLITCH",
    event: "scifyos:fx:glitch",
    tone: "warning",
    hint: "1.5s · strips + slices + page jitter",
  },
  {
    label: "DATA SLICES",
    event: "scifyos:fx:data-slices",
    tone: "warning",
    hint: "1.5s · black signal-loss bars",
  },
  {
    label: "RED PULSE",
    event: "scifyos:fx:red-pulse",
    tone: "danger",
    hint: "2.2s · pulsing red overlay",
  },
  {
    label: "COPYING FILES",
    event: "scifyos:fx:copy-files",
    tone: "primary",
    hint: "win95 file-copy modal · 8s",
  },
  {
    label: "AUDIO STATIC",
    event: "scifyos:fx:audio-static",
    tone: "primary",
    hint: "2.2s · TV static (web audio)",
  },
  {
    label: "HACKED MODAL",
    event: "scifyos:hacked:modal",
    tone: "danger",
    hint: "skull modal alone, no lead-up",
  },
  {
    label: "SECURITY BREACH",
    event: "scifyos:breach",
    tone: "danger",
    hint: "pulse + breach modal",
  },
  {
    label: "HACKED SEQUENCE",
    event: "scifyos:hacked",
    tone: "danger",
    hint: "full 3-phase sequence",
  },
];

const toneClasses: Record<Tone, string> = {
  primary: "border-primary text-primary hover:bg-primary/10",
  warning: "border-warning text-warning hover:bg-warning/10",
  danger: "border-danger text-danger hover:bg-danger/10",
};

export default function FxButtons() {
  const fire = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {fx.map((f) => (
        <button
          key={f.event}
          type="button"
          onClick={() => fire(f.event)}
          className={`group flex flex-col items-start gap-1 px-3 py-2 border text-left transition ${toneClasses[f.tone]}`}
        >
          <span className="text-xs uppercase tracking-wider">▸ {f.label}</span>
          <span className="text-[10px] uppercase tracking-widest text-fg-subtle group-hover:text-fg-muted transition-colors">
            {f.hint}
          </span>
        </button>
      ))}
    </div>
  );
}
