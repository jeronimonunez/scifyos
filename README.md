# scifyos

A hacker-themed design system and virtual OS template — built with Astro + React + Tailwind v4.

The aesthetic is fluorescent green on black, sharp corners, monospace, CRT vibes. Originally a one-page theme reference, it grew into a full Linux/macOS-style desktop you can drop new "apps" into. It's a template — clone it, swap the lore, ship your own game or portfolio on top.

## Stack

- **Astro 6** — static site framework
- **React 19** — interactive islands
- **Tailwind v4** — `@theme` token block in `src/styles/global.css`, OKLCH colors, `radius: 0`
- **JetBrains Mono** — typeface

## Pages

| Route          | What's there                                                           |
| -------------- | ---------------------------------------------------------------------- |
| `/`            | Landing page                                                           |
| `/colors`      | Theme color tokens                                                     |
| `/typography`  | Type scale + the icon set used across the project                      |
| `/components`  | Buttons, cards, badges, modal, drawer, toast, command palette, etc.    |
| `/playground`  | Live FX sandbox: glitch overlays, matrix rain, audio static, breach    |
| `/terminal`    | Fake terminal with a command parser                                    |
| `/os`          | Full virtual OS — boot screen, dock, start menu, windows, apps         |

## /os

Open `/os` and you get:

- **Boot screen** with streaming kernel logs (skip with any key)
- **Window manager** — drag, focus, minimize, maximize, position persistence
- **Dock** with running indicators + start menu + draggable desktop icons
- **Top bar** with menus, wifi/battery, clock, notifications, command palette
- **Apps**:
  - `terminal` — full terminal with history
  - `files` — file tree
  - `logs` — keyboard-navigable log entries with synth audio
  - `shipcraft` — top-down ship deck plan with doors + animated reactor
  - `hacking` — multi-tool dashboard (scanner, cracker, decrypt, exploit, botnet) — password-gated (`admin`)
  - `components` / `playground` / `about` / `settings`
- **Effects**: CRT scanlines, custom cursor, audio static, glitch FX, breach alerts, "hacked" overlay
- **Shut down** in the start menu returns to `/`

## Getting started

Requires Node ≥ 22.12.

```sh
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # static output to ./dist
pnpm preview  # serve the build
```

## Project structure

```
src/
├── pages/          # Astro routes
├── layouts/        # Layout.astro (chrome: full | minimal | bare)
├── components/     # React islands + helpers
│   ├── WindowManager.tsx
│   ├── OsDock.tsx
│   ├── DesktopIcons.tsx
│   ├── StartMenu.tsx
│   ├── BootScreen.tsx
│   ├── PasswordPrompt.tsx
│   └── <app>App.tsx       # one file per app
├── lib/
│   ├── apps.tsx           # app registry (AppId, defaults, password flags)
│   ├── preferences.ts     # theme / CRT / cursor toggles
│   ├── useFocusTrap.ts
│   └── useOpenTransition.ts
└── styles/
    └── global.css         # @theme tokens + all keyframes
```

## Adding an app

1. Create `src/components/MyApp.tsx` exporting a default React component.
2. Register it in [`src/lib/apps.tsx`](src/lib/apps.tsx):

   ```ts
   myapp: {
     id: "myapp",
     title: "My App",
     defaultWidth: 640,
     defaultHeight: 460,
     Component: MyApp,
     passwordProtected: true,  // optional
   }
   ```

3. Add to the `AppId` union, then surface it where it should appear: `StartMenu.tsx` (`MENU_APPS`), `OsDock.tsx` (`DOCK_APPS`), and/or `DesktopIcons.tsx` (`ICONS`).

The window manager handles everything else — open events, focus, minimize, password gating, position persistence.

## Conventions

- **Cross-component messaging** happens via `window.dispatchEvent(new CustomEvent("scifyos:*"))`. See `WINDOW_OPEN_EVENT`, `PASSWORD_PROMPT_EVENT`, `WINDOWS_CHANGED_EVENT` for the canonical examples.
- **State that survives reloads** lives in `localStorage` under keys prefixed `scifyos-` (window positions, desktop icon positions, terminal history, preferences). The boot animation uses `sessionStorage`.
- **Modals** portal to `document.body`, use `useOpenTransition` for enter/exit and `useFocusTrap` for Tab containment.

## License

MIT — see [LICENSE](LICENSE).
