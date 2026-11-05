/**
 * OS identity strings. Swap these (and the @theme tokens in
 * src/styles/global.css) to retheme the OS — apps consume these
 * instead of hardcoding "scifyos" / "root@scifyos" / etc.
 *
 * Demo content (log entries, fake hosts, sample files, ship name)
 * lives inside each app file. Storage keys live where they're used —
 * those are internal namespacing, not user-facing strings.
 */

export const BRANDING = {
  /** Display name, shown in the UI. */
  name: "scifyos",
  /** Used in page titles ("Components · scifyos"). */
  shortName: "scifyos",
  /** One-line tagline shown on the landing page + About app. */
  tagline: "a design system for things built after midnight.",
  /** Production URL — used for canonical + Open Graph links. */
  url: "https://scifyos.vercel.app",
  /** Meta description for search + link previews. */
  description:
    "A hacker-themed design system and virtual OS in your browser: boot screen, window manager, terminal, and playable apps. Built with Astro, React and Tailwind.",
  /** Long version label — boot screen, About app. */
  version: "0.1.0-rc1",
  /** Short version label — footer chips. */
  versionShort: "0.1",
  /** Hostname for the fake terminal prompt + start menu. */
  hostname: "scifyos",
  /** Default user. Combined with hostname for the shell prompt. */
  user: "root",
  /** Domain suffix for fake networked hosts (used by demo content). */
  domain: "scifyos",
  /** Credit line shown in About. */
  credits: "jeronimo nuñez · built with claude",
  /** Stack line shown in About. */
  stack: "astro · react · tailwind",
  /** Service paths used in the boot log. */
  servicesPath: "/scifyos/services",
  /** Header chip text on non-OS pages (Layout.astro / FullTerminal). */
  pageChip: "scifyos@theme",
} as const;

/** "root@scifyos" — used by the terminal prompt and start menu. */
export const PROMPT = `${BRANDING.user}@${BRANDING.hostname}`;

/** Compose a page title: pageTitle("Colors") → "Colors · scifyos". */
export function pageTitle(page?: string): string {
  return page ? `${page} · ${BRANDING.shortName}` : BRANDING.shortName;
}
