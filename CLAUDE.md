# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript compile + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npm run preview` — Preview production build locally

## Architecture

This is a **personal portfolio site styled as a Windows 95 desktop environment**. Built with React 19 + TypeScript + Vite.

### Boot Sequence Flow

1. `AsciiScene` (class, not React component) initializes Three.js with a 3D head model (`lewis-head.glb`) rendered through `AsciiEffect`
2. Camera animates through keyframes from `src/data/keyframes.json` as user scrolls (or presses Space / taps "[Press Here]" on mobile)
3. At 90% scroll, auto-completes to 100%. Progress bar: `Scroll: [  X%] [###---]`
4. On completion, triggers text decryption animation: dashes → random symbols → "LEWIS POLANSKY OS INITIALIZED"
5. After decryption, `displayProjects` state enables the desktop with all windows

### Window System

`ProjectWindow` is the core wrapper component — provides draggable (titlebar), resizable (corner handle), focusable (z-index 999) windows with Win95 chrome. Uses mouse event listeners directly (not a drag library). Icons come from `@react95/icons`.

Windows rendered in `Profile.tsx`:
- **LewOS Terminal** — simulated shell with IndexedDB-backed virtual filesystem, built-in editor (LEW), and process management. Commands: `ls`, `cat`, `lew`, `rm`, `download`, `run`, `ps`, `kill`, `clear`, `help`
- **Constellation Browser** — iframe-based browser with URL bar, history, domain whitelist. Shows Starbox on load errors
- **Race** — typing speed challenge using samples from `src/data/typing-samples.json`
- **Starbox** — 10x10 lights-out puzzle
- **Dropola** — Matter.js physics ball-drop/merge game
- **CaptainAI.exe, AiCodeChecker.exe, CyberSpace.exe** — project showcase windows
- **README.html** — bio/resume window

Process management: Terminal tracks active processes (browsers, races, starboxes, dropola instances) via state lifted to `Profile.tsx`. `run <program>.exe` spawns instances, `kill` removes them.

### Key Patterns

- **CSS Modules** everywhere — each component has a `.module.css` file
- **Win95 styling** via box-shadows (`inset 1px 1px #ffffff, inset -1px -1px #404040`), `#c0c0c0` backgrounds, and beveled borders
- **IndexedDB** for persistence (terminal filesystem, game scores)
- **Spherical coordinate interpolation** in `AsciiScene` for smooth camera animation between keyframes
- **Multiple instances** — Browser, Race, Starbox, Dropola can each have multiple simultaneous windows

### Routes

- `/` — Profile (main desktop experience)
- `/animator` — Keyframe editor tool for creating camera animation sequences

## Roadmap

### 1. Mobile Responsiveness
- Make ProjectWindows work on mobile (dragging is broken on touch devices — `mousedown`/`mousemove` events need touch equivalents)
- Fix the loading/boot animation on mobile (scroll-based progression doesn't work well on touch; the "[Press Here]" button exists but the AsciiScene scroll handler only listens for `wheel` events)
- Consider stacking windows vertically or providing a window-switcher on small screens rather than free-position dragging
- ASCII effect resolution may need adjustment for smaller viewports

### 2. Update Captain Branding
- Replace ship logo (`src/assets/captainlogo.png`) with the Captain wordmark logo from `C:\Users\techt\Documents\_Captain\_Captain-Code\runcaptain\public\captain-wordmark.png` (copy into `src/assets/`)
- Update the CaptainAI.exe window in `Profile.tsx` (~line 393-406):
  - Replace title "AI for Big Data" with appropriate new heading
  - Replace blurb with: "Captain provides a straightforward API for AI agents to accurately search through files (Avg: 78% → 95% + citations). We'll index unstructured data from the sources you already use like S3, SharePoint, and Google Drive, and easily scale to multi-modal, petabyte-size datasets. We're the Snowflake for Unstructured Data."
