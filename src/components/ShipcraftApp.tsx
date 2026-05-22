import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────
// Data model — rooms are SVG polygons; doors sit on shared
// walls between rooms (or on outer hatches). Both are
// data-driven so we can layer power / atmo / NPCs later
// without touching the renderer.
// ─────────────────────────────────────────────────────────

type RoomKind =
  | "command"
  | "crew"
  | "medical"
  | "engineering"
  | "cargo"
  | "airlock"
  | "corridor";

type Room = {
  id: string;
  name: string;
  kind: RoomKind;
  points: [number, number][];
  labelAt: [number, number];
  power?: "on" | "off" | "fault";
  atmosphere?: "ok" | "vacuum" | "toxic";
  crew?: number;
  note?: string;
};

type DoorState = "open" | "closed" | "locked" | "sealed";

type Door = {
  id: string;
  /** Display label, e.g. "bridge ↔ spine" */
  label: string;
  /** room ids on each side (use "space" for outer hatches). */
  between: [string, string];
  pos: [number, number];
  /** "v" = on a vertical wall, "h" = on a horizontal wall. */
  orient: "v" | "h";
  state: DoorState;
};

const ROOMS: Room[] = [
  // Bridge — pentagonal nose pointing right (bow).
  {
    id: "bridge",
    name: "BRIDGE",
    kind: "command",
    points: [[640, 160], [720, 175], [740, 200], [720, 225], [640, 240]],
    labelAt: [678, 204],
    power: "on",
    atmosphere: "ok",
    crew: 2,
    note: "primary command deck. nav + comms.",
  },
  // Main spine corridor — runs the length of the ship.
  {
    id: "spine",
    name: "",
    kind: "corridor",
    points: [[80, 195], [640, 195], [640, 205], [80, 205]],
    labelAt: [360, 200],
  },
  // Mess (top of mid-front).
  {
    id: "mess",
    name: "MESS",
    kind: "crew",
    points: [[440, 130], [560, 130], [560, 195], [440, 195]],
    labelAt: [500, 162],
    power: "on",
    atmosphere: "ok",
    crew: 0,
    note: "galley + dining for 12.",
  },
  // Crew quarters (bottom of mid-front).
  {
    id: "quarters",
    name: "QUARTERS",
    kind: "crew",
    points: [[440, 205], [560, 205], [560, 270], [440, 270]],
    labelAt: [500, 238],
    power: "on",
    atmosphere: "ok",
    crew: 4,
    note: "6 bunks. 4 occupied.",
  },
  // Medbay (top of mid).
  {
    id: "medbay",
    name: "MEDBAY",
    kind: "medical",
    points: [[260, 130], [360, 130], [360, 195], [260, 195]],
    labelAt: [310, 162],
    power: "on",
    atmosphere: "ok",
    crew: 1,
    note: "auto-doc + 2 surgical bays.",
  },
  // Lab (bottom of mid).
  {
    id: "lab",
    name: "LAB",
    kind: "medical",
    points: [[260, 205], [360, 205], [360, 270], [260, 270]],
    labelAt: [310, 238],
    power: "fault",
    atmosphere: "ok",
    crew: 0,
    note: "containment offline — see eng.",
  },
  // Upper hold (cargo, top of aft).
  {
    id: "hold-a",
    name: "HOLD A",
    kind: "cargo",
    points: [[140, 130], [260, 130], [260, 195], [140, 195]],
    labelAt: [200, 162],
    power: "on",
    atmosphere: "ok",
    crew: 0,
    note: "31.4 t · mag-locked.",
  },
  // Lower hold (cargo, bottom of aft) — sealed for the breach drama.
  {
    id: "hold-b",
    name: "HOLD B",
    kind: "cargo",
    points: [[140, 205], [260, 205], [260, 270], [140, 270]],
    labelAt: [200, 238],
    power: "fault",
    atmosphere: "vacuum",
    crew: 0,
    note: "hull breach detected. quarantined.",
  },
  // Engineering — full-height aft compartment.
  {
    id: "eng",
    name: "ENGINEERING",
    kind: "engineering",
    points: [[20, 130], [80, 130], [80, 270], [20, 270]],
    labelAt: [50, 158],
    power: "on",
    atmosphere: "ok",
    crew: 1,
    note: "reactor stable. 84% output.",
  },
  // Top airlock chamber + small stub corridor down to medbay.
  {
    id: "airlock-t",
    name: "AIRLOCK",
    kind: "airlock",
    points: [[300, 60], [380, 60], [380, 120], [300, 120]],
    labelAt: [340, 90],
    power: "on",
    atmosphere: "vacuum",
    crew: 0,
    note: "outer hatch sealed.",
  },
  {
    id: "corr-airlock-t",
    name: "",
    kind: "corridor",
    points: [[320, 120], [360, 120], [360, 130], [320, 130]],
    labelAt: [340, 125],
  },
  // Lower airlock / EVA bay + connector up to quarters.
  {
    id: "eva-bay",
    name: "EVA BAY",
    kind: "airlock",
    points: [[440, 290], [560, 290], [560, 340], [440, 340]],
    labelAt: [500, 315],
    power: "on",
    atmosphere: "ok",
    crew: 0,
    note: "4 EVA suits racked.",
  },
  {
    id: "corr-eva",
    name: "",
    kind: "corridor",
    points: [[490, 270], [510, 270], [510, 290], [490, 290]],
    labelAt: [500, 280],
  },
];

const KIND_LABEL: Record<RoomKind, string> = {
  command: "command",
  crew: "crew",
  medical: "medical",
  engineering: "engineering",
  cargo: "cargo",
  airlock: "airlock",
  corridor: "corridor",
};

// Doors sit on actual shared walls between the rooms above.
const INITIAL_DOORS: Door[] = [
  { id: "d-bridge", label: "bridge ↔ spine", between: ["bridge", "spine"], pos: [640, 200], orient: "v", state: "open" },
  { id: "d-mess", label: "mess ↔ spine", between: ["mess", "spine"], pos: [500, 195], orient: "h", state: "open" },
  { id: "d-quarters", label: "quarters ↔ spine", between: ["quarters", "spine"], pos: [500, 205], orient: "h", state: "closed" },
  { id: "d-medbay", label: "medbay ↔ spine", between: ["medbay", "spine"], pos: [310, 195], orient: "h", state: "open" },
  { id: "d-lab", label: "lab ↔ spine", between: ["lab", "spine"], pos: [310, 205], orient: "h", state: "locked" },
  { id: "d-hold-a", label: "hold a ↔ spine", between: ["hold-a", "spine"], pos: [200, 195], orient: "h", state: "closed" },
  { id: "d-hold-b", label: "hold b ↔ spine", between: ["hold-b", "spine"], pos: [200, 205], orient: "h", state: "sealed" },
  { id: "d-eng", label: "engineering ↔ spine", between: ["eng", "spine"], pos: [80, 200], orient: "v", state: "open" },
  { id: "d-airlock-inner", label: "airlock ↔ vestibule", between: ["airlock-t", "corr-airlock-t"], pos: [340, 120], orient: "h", state: "closed" },
  { id: "d-airlock-vest", label: "vestibule ↔ medbay", between: ["corr-airlock-t", "medbay"], pos: [340, 130], orient: "h", state: "open" },
  { id: "d-airlock-outer", label: "airlock ↔ space", between: ["airlock-t", "space"], pos: [340, 60], orient: "h", state: "sealed" },
  { id: "d-eva-inner", label: "quarters ↔ eva", between: ["quarters", "corr-eva"], pos: [500, 270], orient: "h", state: "open" },
  { id: "d-eva-conn", label: "eva ↔ bay", between: ["corr-eva", "eva-bay"], pos: [500, 290], orient: "h", state: "open" },
  { id: "d-eva-outer", label: "eva bay ↔ space", between: ["eva-bay", "space"], pos: [500, 340], orient: "h", state: "closed" },
];

function kindStrokeClass(kind: RoomKind): string {
  if (kind === "corridor") return "stroke-primary/40";
  return "stroke-primary/80";
}

function kindFillVar(kind: RoomKind, state: "idle" | "hover" | "selected"): string {
  if (state === "selected") return "color-mix(in oklch, var(--color-primary) 28%, transparent)";
  if (state === "hover") return "color-mix(in oklch, var(--color-primary) 16%, transparent)";
  if (kind === "corridor") return "color-mix(in oklch, var(--color-primary) 6%, transparent)";
  return "color-mix(in oklch, var(--color-primary) 4%, transparent)";
}

function pointsToString(points: [number, number][]): string {
  return points.map((p) => `${p[0]},${p[1]}`).join(" ");
}

function doorColors(state: DoorState): { stroke: string; fill: string } {
  switch (state) {
    case "open":
      return {
        stroke: "var(--color-primary)",
        fill: "var(--color-bg)",
      };
    case "closed":
      return {
        stroke: "var(--color-primary)",
        fill: "color-mix(in oklch, var(--color-primary) 45%, var(--color-bg))",
      };
    case "locked":
      return {
        stroke: "var(--color-warning)",
        fill: "color-mix(in oklch, var(--color-warning) 35%, var(--color-bg))",
      };
    case "sealed":
      return {
        stroke: "var(--color-danger)",
        fill: "color-mix(in oklch, var(--color-danger) 40%, var(--color-bg))",
      };
  }
}

type DoorElementProps = {
  door: Door;
  state: DoorState;
  hovered: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
};

function DoorElement({ door, state, hovered, onClick, onHover, onLeave }: DoorElementProps) {
  const [x, y] = door.pos;
  const v = door.orient === "v";
  // "Across the wall" axis is short; "along the wall" axis is long.
  const w = v ? 6 : 14;
  const h = v ? 14 : 6;
  const { stroke, fill } = doorColors(state);

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onHover();
      }}
      onPointerLeave={onLeave}
      className="cursor-pointer"
    >
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={hovered ? 1.8 : 1.2}
      />
      {state === "open" && (
        // Hairline through the middle in the "along the wall" axis,
        // suggesting the door is recessed into its frame.
        <line
          x1={v ? x : x - w / 2 + 1.5}
          y1={v ? y - h / 2 + 1.5 : y}
          x2={v ? x : x + w / 2 - 1.5}
          y2={v ? y + h / 2 - 1.5 : y}
          stroke={stroke}
          strokeWidth={0.8}
          strokeDasharray="2 2"
        />
      )}
      {state === "locked" && <circle cx={x} cy={y} r={1.1} fill={stroke} />}
      {state === "sealed" && (
        <>
          <line x1={x - w / 2 + 1.5} y1={y - h / 2 + 1.5} x2={x + w / 2 - 1.5} y2={y + h / 2 - 1.5} stroke={stroke} strokeWidth={1} />
          <line x1={x - w / 2 + 1.5} y1={y + h / 2 - 1.5} x2={x + w / 2 - 1.5} y2={y - h / 2 + 1.5} stroke={stroke} strokeWidth={1} />
        </>
      )}
    </g>
  );
}

export default function ShipcraftApp() {
  const [hoverRoomId, setHoverRoomId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>("bridge");
  const [hoverDoorId, setHoverDoorId] = useState<string | null>(null);
  const [doorStates, setDoorStates] = useState<Record<string, DoorState>>(() =>
    Object.fromEntries(INITIAL_DOORS.map((d) => [d.id, d.state])),
  );

  const activeRoomId = hoverRoomId ?? selectedRoomId;
  const activeRoom = useMemo(
    () => ROOMS.find((r) => r.id === activeRoomId) ?? null,
    [activeRoomId],
  );
  const hoveredDoor = useMemo(
    () => INITIAL_DOORS.find((d) => d.id === hoverDoorId) ?? null,
    [hoverDoorId],
  );

  // Click on a door toggles open↔closed. Locked / sealed stay put;
  // those will require unlock or repair actions later.
  const toggleDoor = (id: string) => {
    setDoorStates((prev) => {
      const s = prev[id];
      if (s === "open") return { ...prev, [id]: "closed" };
      if (s === "closed") return { ...prev, [id]: "open" };
      return prev;
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-bg text-xs">
      <div className="px-3 py-2 border-b border-primary/30 bg-bg-elevated flex items-center justify-between text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className="text-primary">// shipcraft</span>
          <span className="text-fg-subtle">ssv-7 nightingale · scout-class</span>
        </div>
        <div className="text-fg-subtle hidden sm:block">
          click sectors · click doors to toggle
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative bg-bg overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              color: "var(--color-primary)",
            }}
          />

          <svg
            viewBox="-40 30 800 350"
            preserveAspectRatio="xMidYMid meet"
            className="relative w-full h-full"
            role="img"
            aria-label="ship deck plan"
          >
            {/* Engine nozzles — decorative, sit outside the hull. */}
            <g className="text-primary/50">
              <rect x="-20" y="155" width="20" height="35" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="-20" y="210" width="20" height="50" fill="none" stroke="currentColor" strokeWidth="1" />
              <line x1="-20" y1="160" x2="-32" y2="160" stroke="currentColor" strokeWidth="1" />
              <line x1="-20" y1="180" x2="-32" y2="180" stroke="currentColor" strokeWidth="1" />
              <line x1="-20" y1="215" x2="-32" y2="215" stroke="currentColor" strokeWidth="1" />
              <line x1="-20" y1="235" x2="-32" y2="235" stroke="currentColor" strokeWidth="1" />
              <line x1="-20" y1="255" x2="-32" y2="255" stroke="currentColor" strokeWidth="1" />
            </g>

            {/* Rooms */}
            {ROOMS.map((room) => {
              const state =
                selectedRoomId === room.id
                  ? "selected"
                  : hoverRoomId === room.id
                  ? "hover"
                  : "idle";
              return (
                <g
                  key={room.id}
                  onPointerEnter={() => setHoverRoomId(room.id)}
                  onPointerLeave={() =>
                    setHoverRoomId((cur) => (cur === room.id ? null : cur))
                  }
                  onClick={() => setSelectedRoomId(room.id)}
                  className="cursor-pointer"
                >
                  <polygon
                    points={pointsToString(room.points)}
                    fill={kindFillVar(room.kind, state)}
                    stroke="currentColor"
                    strokeWidth={state === "idle" ? 1.2 : 1.6}
                    strokeLinejoin="miter"
                    className={`${kindStrokeClass(room.kind)} ${
                      state !== "idle" ? "!stroke-primary" : ""
                    }`}
                  />
                  {room.name && (
                    <text
                      x={room.labelAt[0]}
                      y={room.labelAt[1]}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      letterSpacing="0.12em"
                      className={
                        state === "selected" || state === "hover"
                          ? "fill-primary"
                          : "fill-fg-muted"
                      }
                      pointerEvents="none"
                    >
                      {room.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Reactor pulse — lives inside Engineering. Two staggered
                halos + a pulsing core + a tiny label. */}
            <g pointerEvents="none">
              <circle cx={50} cy={210} r={6} fill="none" stroke="currentColor"
                strokeWidth={1} className="text-primary reactor-halo" />
              <circle cx={50} cy={210} r={6} fill="none" stroke="currentColor"
                strokeWidth={1} className="text-primary reactor-halo reactor-halo-delay" />
              <circle cx={50} cy={210} r={3.5} fill="currentColor"
                className="text-primary reactor-core" />
              <text
                x={50}
                y={232}
                textAnchor="middle"
                fontSize="7"
                fontFamily="var(--font-mono)"
                letterSpacing="0.18em"
                className="fill-primary/80"
              >
                REACTOR
              </text>
            </g>

            {/* Doors — drawn last so they layer over walls. */}
            {INITIAL_DOORS.map((d) => (
              <DoorElement
                key={d.id}
                door={d}
                state={doorStates[d.id]}
                hovered={hoverDoorId === d.id}
                onClick={() => toggleDoor(d.id)}
                onHover={() => setHoverDoorId(d.id)}
                onLeave={() =>
                  setHoverDoorId((cur) => (cur === d.id ? null : cur))
                }
              />
            ))}

            {/* Scale bar, bottom-right. */}
            <g className="text-fg-subtle" transform="translate(680, 360)">
              <line x1="0" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="1" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="currentColor" strokeWidth="1" />
              <line x1="40" y1="-3" x2="40" y2="3" stroke="currentColor" strokeWidth="1" />
              <text x="20" y="-8" textAnchor="middle" fontSize="8" letterSpacing="0.12em" fill="currentColor">
                10 m
              </text>
            </g>
          </svg>
        </div>

        <aside className="w-56 border-l border-primary/30 bg-bg-elevated overflow-y-auto">
          {hoveredDoor ? (
            <DoorPanel door={hoveredDoor} state={doorStates[hoveredDoor.id]} />
          ) : activeRoom ? (
            <RoomPanel room={activeRoom} />
          ) : (
            <div className="p-3 text-fg-subtle text-[10px] uppercase tracking-widest">
              // select a sector
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function RoomPanel({ room }: { room: Room }) {
  return (
    <div className="p-3 space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
          // sector
        </p>
        <p className="text-sm uppercase tracking-widest text-primary">
          {room.name || "—"}
        </p>
      </div>

      <dl className="grid grid-cols-[64px_1fr] gap-y-1 text-[10px] uppercase tracking-widest">
        <dt className="text-fg-subtle">kind</dt>
        <dd className="text-fg-muted">{KIND_LABEL[room.kind]}</dd>

        {room.power && (
          <>
            <dt className="text-fg-subtle">power</dt>
            <dd
              className={
                room.power === "on"
                  ? "text-primary"
                  : room.power === "fault"
                  ? "text-danger"
                  : "text-fg-subtle"
              }
            >
              {room.power}
            </dd>
          </>
        )}

        {room.atmosphere && (
          <>
            <dt className="text-fg-subtle">atmo</dt>
            <dd
              className={
                room.atmosphere === "ok"
                  ? "text-primary"
                  : room.atmosphere === "toxic"
                  ? "text-danger"
                  : "text-warning"
              }
            >
              {room.atmosphere}
            </dd>
          </>
        )}

        {typeof room.crew === "number" && (
          <>
            <dt className="text-fg-subtle">crew</dt>
            <dd className="text-fg-muted tabular-nums">{room.crew}</dd>
          </>
        )}
      </dl>

      {room.note && (
        <div className="border-t border-primary/20 pt-2">
          <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-1">
            // note
          </p>
          <p className="text-[11px] text-fg leading-snug">{room.note}</p>
        </div>
      )}
    </div>
  );
}

function DoorPanel({ door, state }: { door: Door; state: DoorState }) {
  const toneClass =
    state === "open"
      ? "text-primary"
      : state === "closed"
      ? "text-fg-muted"
      : state === "locked"
      ? "text-warning"
      : "text-danger";
  return (
    <div className="p-3 space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
          // door
        </p>
        <p className="text-sm uppercase tracking-widest text-primary">
          {door.label}
        </p>
      </div>
      <dl className="grid grid-cols-[64px_1fr] gap-y-1 text-[10px] uppercase tracking-widest">
        <dt className="text-fg-subtle">state</dt>
        <dd className={toneClass}>{state}</dd>
        <dt className="text-fg-subtle">axis</dt>
        <dd className="text-fg-muted">{door.orient === "v" ? "vertical" : "horizontal"}</dd>
      </dl>
      <p className="text-[10px] uppercase tracking-widest text-fg-subtle">
        // {state === "locked" || state === "sealed"
          ? "cannot toggle from here"
          : "click to toggle"}
      </p>
    </div>
  );
}
