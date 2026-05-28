import { BRANDING } from "../lib/branding";

/**
 * Schema + sample content for the Explorer app's fake filesystem.
 *
 * Replace this whole file (or just the `FS_ROOT` export) in a fork
 * to drop in different content. The renderer (ExplorerApp.tsx) only
 * cares about the shape, not the strings.
 */

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type TextNode = {
  type: "text";
  id: string;
  name: string;
  content: string;
};

export type ImageNode = {
  type: "image";
  id: string;
  name: string;
  /** Path to a real image asset, served from public/.
   *  Use this for PNG / JPG / WEBP. */
  src?: string;
  /** Inline SVG markup (alternative to `src`). currentColor inside
   *  the SVG inherits the active skin's primary. */
  svg?: string;
  /** When true, render with image-rendering: pixelated so scaled
   *  pixel art stays crisp. */
  pixelated?: boolean;
};

export type Tone = {
  freq: number;
  durMs: number;
  type?: OscillatorType;
  /** Silence in ms after this tone. */
  gapMs?: number;
};

export type SoundNode = {
  type: "sound";
  id: string;
  name: string;
  /** Synth-generated tone sequence — no audio assets. */
  tones: Tone[];
};

export type FolderNode = {
  type: "folder";
  id: string;
  name: string;
  children: FileNode[];
  /** When true, opening this folder prompts for a password. */
  passwordProtected?: boolean;
};

export type FileNode = FolderNode | TextNode | ImageNode | SoundNode;

/** Password used by every protected folder in this sample tree.
 *  A real game would either store per-folder passwords on the node
 *  itself or check against external state. */
export const FOLDER_PASSWORD = "admin";

// ─────────────────────────────────────────────────────────
// Inline SVG sources for the demo "image" files.
// All use currentColor so they shift with the active skin.
// ─────────────────────────────────────────────────────────

const STARMAP_SVG = `
<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="160" fill="black"/>
  <g fill="currentColor">
    <circle cx="20"  cy="30"  r="1"/>
    <circle cx="40"  cy="55"  r="0.6"/>
    <circle cx="62"  cy="22"  r="1.4"/>
    <circle cx="80"  cy="80"  r="0.8"/>
    <circle cx="105" cy="40"  r="1"/>
    <circle cx="120" cy="64"  r="1.6"/>
    <circle cx="142" cy="32"  r="0.7"/>
    <circle cx="160" cy="90"  r="1.2"/>
    <circle cx="180" cy="50"  r="0.9"/>
    <circle cx="200" cy="110" r="1.4"/>
    <circle cx="218" cy="70"  r="0.8"/>
    <circle cx="30"  cy="120" r="1"/>
    <circle cx="55"  cy="135" r="0.7"/>
    <circle cx="90"  cy="118" r="0.9"/>
    <circle cx="135" cy="120" r="1"/>
    <circle cx="172" cy="130" r="0.6"/>
    <circle cx="210" cy="22"  r="1"/>
  </g>
  <polyline points="62,22 105,40 120,64 160,90 200,110"
    stroke="currentColor" stroke-width="0.6" fill="none" opacity="0.55"/>
  <text x="10" y="152" fill="currentColor" font-family="monospace" font-size="6" letter-spacing="1">
    SECTOR 4-K · 2026-04-12
  </text>
</svg>`;

const SHIP_SVG = `
<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="120" fill="black"/>
  <g stroke="currentColor" fill="none" stroke-width="1.2" stroke-linejoin="miter">
    <path d="M 30 60 L 60 50 L 200 50 L 220 60 L 200 70 L 60 70 Z"/>
    <line x1="60" y1="50" x2="60" y2="70"/>
    <line x1="100" y1="50" x2="100" y2="70"/>
    <line x1="140" y1="50" x2="140" y2="70"/>
    <line x1="180" y1="50" x2="180" y2="70"/>
    <path d="M 200 50 L 215 35 L 220 50"/>
    <path d="M 200 70 L 215 85 L 220 70"/>
    <circle cx="50" cy="60" r="3"/>
    <line x1="30" y1="60" x2="22" y2="60"/>
    <line x1="22" y1="55" x2="22" y2="65"/>
  </g>
  <text x="10" y="110" fill="currentColor" font-family="monospace" font-size="6" letter-spacing="1">
    SSV-7 NIGHTINGALE · DECKPLAN
  </text>
</svg>`;

const NEBULA_SVG = `
<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="neb" cx="50%" cy="50%" r="55%">
      <stop offset="0%"   stop-color="currentColor" stop-opacity="0.9"/>
      <stop offset="55%"  stop-color="currentColor" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="black"/>
    </radialGradient>
  </defs>
  <rect width="240" height="160" fill="black"/>
  <rect width="240" height="160" fill="url(#neb)"/>
  <g fill="currentColor">
    <circle cx="40" cy="30" r="0.8"/>
    <circle cx="80" cy="20" r="1.1"/>
    <circle cx="120" cy="50" r="0.6"/>
    <circle cx="170" cy="35" r="0.9"/>
    <circle cx="200" cy="110" r="1.2"/>
    <circle cx="50" cy="130" r="0.7"/>
    <circle cx="100" cy="140" r="1"/>
    <circle cx="220" cy="60" r="0.8"/>
  </g>
  <text x="10" y="152" fill="currentColor" font-family="monospace" font-size="6" letter-spacing="1">
    HORSEHEAD · LONG EXPOSURE 47S
  </text>
</svg>`;

const SCAN_SVG = `
<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="160" fill="black"/>
  <g stroke="currentColor" fill="none" stroke-width="0.8">
    <circle cx="120" cy="80" r="50"/>
    <circle cx="120" cy="80" r="35" opacity="0.6"/>
    <circle cx="120" cy="80" r="20" opacity="0.35"/>
    <line x1="120" y1="20" x2="120" y2="140"/>
    <line x1="50" y1="80" x2="190" y2="80"/>
    <line x1="120" y1="80" x2="160" y2="60" stroke-width="1.4"/>
  </g>
  <g fill="currentColor">
    <circle cx="160" cy="60" r="2.4"/>
    <circle cx="95" cy="100" r="1.2"/>
    <circle cx="140" cy="110" r="1.4"/>
  </g>
  <text x="10" y="152" fill="currentColor" font-family="monospace" font-size="6" letter-spacing="1">
    SENSOR PASSIVE · 3 CONTACTS
  </text>
</svg>`;

// ─────────────────────────────────────────────────────────
// Filesystem tree
// ─────────────────────────────────────────────────────────

export const FS_ROOT: FolderNode = {
  type: "folder",
  id: "root",
  name: "home",
  children: [
    {
      type: "folder",
      id: "pictures",
      name: "pictures",
      children: [
        { type: "image", id: "img-starmap", name: "starmap-4k.img", svg: STARMAP_SVG },
        { type: "image", id: "img-ship", name: "nightingale.img", svg: SHIP_SVG },
        { type: "image", id: "img-nebula", name: "horsehead.img", svg: NEBULA_SVG },
        { type: "image", id: "img-scan", name: "passive-scan.img", svg: SCAN_SVG },
        {
          type: "image",
          id: "img-portrait",
          name: "morrigan.png",
          src: "/avatars/morrigan.png",
          pixelated: true,
        },
      ],
    },
    {
      type: "folder",
      id: "sounds",
      name: "sounds",
      children: [
        {
          type: "sound",
          id: "snd-alarm",
          name: "alarm.snd",
          tones: [
            { freq: 880, durMs: 200, type: "square", gapMs: 80 },
            { freq: 660, durMs: 200, type: "square", gapMs: 80 },
            { freq: 880, durMs: 200, type: "square", gapMs: 80 },
            { freq: 660, durMs: 300, type: "square" },
          ],
        },
        {
          type: "sound",
          id: "snd-ringtone",
          name: "ringtone.snd",
          tones: [
            { freq: 523, durMs: 140, type: "triangle", gapMs: 40 },
            { freq: 659, durMs: 140, type: "triangle", gapMs: 40 },
            { freq: 784, durMs: 140, type: "triangle", gapMs: 40 },
            { freq: 1046, durMs: 220, type: "triangle", gapMs: 60 },
            { freq: 784, durMs: 220, type: "triangle" },
          ],
        },
        {
          type: "sound",
          id: "snd-voicemail",
          name: "voicemail-fragment.snd",
          tones: [
            { freq: 220, durMs: 90, type: "sawtooth", gapMs: 30 },
            { freq: 280, durMs: 120, type: "sawtooth", gapMs: 30 },
            { freq: 200, durMs: 70, type: "sawtooth", gapMs: 60 },
            { freq: 260, durMs: 140, type: "sawtooth", gapMs: 30 },
            { freq: 180, durMs: 90, type: "sawtooth", gapMs: 200 },
            { freq: 240, durMs: 160, type: "sawtooth" },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "docs",
      name: "docs",
      children: [
        {
          type: "text",
          id: "txt-briefing",
          name: "briefing.txt",
          content: `// MISSION BRIEFING · CLEARANCE ALPHA-3

Destination:    Sigmund Station, outer belt
Window:         T-04d 09h
Cargo:          medical / surgical (sealed)
Crew:           4 + 1 (you)

Vesper has the bridge. Morrigan signs for cargo. Talk to no one
about the second envelope.

— ops`,
        },
        {
          type: "text",
          id: "txt-crew",
          name: "crew-roster.txt",
          content: `# CREW · SSV-7 NIGHTINGALE

cmdr.    vesper, j      bridge      14y
quart.   morrigan, m    hold        9y
eng.     halvorsen, t   eng         11y
ops.     yusra, n       comms       3y
guest.   <you>          quarters    —

note: dock log lists "j. tarn" — no such crewmember.`,
        },
        {
          type: "text",
          id: "txt-checklist",
          name: "shopping.txt",
          content: `coffee filters
voltage regulator (4)
duct tape (the GOOD kind)
cat treats — DO NOT FORGET, biscuit will not forgive again
spare tape drive
something nicer for sunday call`,
        },
      ],
    },
    {
      type: "folder",
      id: "classified",
      name: "classified",
      passwordProtected: true,
      children: [
        {
          type: "text",
          id: "txt-alert",
          name: "ALERT.txt",
          content: `// AUTO-GENERATED ALERT

Anomalous signature detected in cargo hold H-04.
Mass delta: +1.4t (expected 0)
Seal integrity: BREACHED (resealed; signature mismatch)
Owner of record: j. tarn
Roster match: NONE

Recommend: physical inspection.
Recommend: do not rely on dock cameras (gap 02:31-02:43).`,
        },
        {
          type: "text",
          id: "txt-keys",
          name: "keys.txt",
          content: `# /home/${BRANDING.user}/.ssh/known_hosts (extract)

185.220.101.4    ssh-ed25519 AAAAC3...nightingale-build02
*.${BRANDING.domain}        ssh-ed25519 AAAAC3...VAULT
sigmund-station  ssh-rsa     AAAAB3...legacy

(see also: keys revoked 2026-05-15)`,
        },
      ],
    },
    {
      type: "text",
      id: "txt-readme",
      name: "README.txt",
      content: `welcome to your private storage.

contents:
  pictures/    scans, portraits, navigation snaps
  sounds/      alerts, ringtones
  docs/        ship paperwork
  classified/  do not open in public

— ops`,
    },
    {
      type: "text",
      id: "txt-notes",
      name: "notes.txt",
      content: `things to remember:

- H-04 is bait, check H-19 (anon)
- vesper does not yet know about j. tarn
- 2026-05-15 03:09 — login from .nl tor exit. not me.
- mom owes me 100 cr. she owes me 100 cr.`,
    },
  ],
};
