> **Experimental branch: feature/visual-overhaul** — This branch is a Three.js visual sandbox, not the playable Nightfall v0.4. The complete playable game remains on `main`. To try this preview: `npm install`, `npm run dev`, then press **V** for the first-person impact lab, **E** to inspect the frying pan in orbit mode, or **R** to inspect the intruder. To rebuild the procedural source: `npm run assets:pan`. See [migration notes](docs/THREEJS_MIGRATION.md).

# 3:17 AM — Nightfall (v0.4)

A browser-based, first-person survival horror roguelite prototype. You're awakened by a break-in. Improvise with household items, call for help, and survive the night.

## Run locally

Open `index.html` in a recent desktop browser that supports WebGL 2 (Chrome or Edge recommended). This baseline is a self-contained HTML file with no runtime dependencies.

## Controls

| Input | Action |
| --- | --- |
| WASD / Mouse | Move / Look |
| Shift | Sprint |
| C | Crouch |
| E | Interact or pick up/drop an item |
| G | Drop held item |
| Left click | Strike |
| Right click | Throw or use extinguisher |
| F | Flashlight |
| M | Minimap |
| P | Cinematic / Performance graphics |
| O | FPS overlay |
| Esc | Pause / release mouse |

## Objectives

Find the phone on the bedroom dresser, call for help, and stay alive until rescue. Interact with the breaker, barricade, and available first-aid and household items.

## What this version contains

- Compact apartment and custom WebGL 2 renderer
- Procedural material atlas, flashlight shadows, moonlit windows and environmental detail
- Enemy navigation and awareness, damage, improvised weapons, item interaction
- Phone objective, barricade, breaker, first aid, and restartable runs
- Rendering quality toggle and FPS meter

## Team workflow

- `main` holds a playable baseline
- Develop new systems in `feature/*` branches and open pull requests before merging
- Avoid unrelated changes to the current monolithic `index.html` while planning the module split
- Prefer GLB/glTF for future Blender assets; see [asset pipeline](docs/ASSET_PIPELINE.md)
- Priorities and milestones: [roadmap](docs/ROADMAP.md)

## Netlify

Deploy as a static site: **publish directory `.`**, **no build command** for this version. A private source repository does not hide JavaScript shipped to players.

## Known limitations

- Single-player only; no shared networking or persistent server
- Stylized procedural geometry and limited animations
- Frame rate depends on browser and GPU
- Renderer migration and project modularization are future work, not part of v0.4
