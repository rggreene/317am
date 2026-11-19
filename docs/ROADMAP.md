# Development roadmap

## Baseline: v0.4 Nightfall

Keep the existing single-file WebGL 2 game playable on `main`. Before refactoring, record a smoke-test checklist: load game, pointer lock, movement, phone call, barricade, power reset, healing, enemy combat, win/loss, and restart.

## Milestone 1 — Project structure

- Split gameplay, entities, AI, input, audio, and rendering into modules
- Add a lightweight local dev server (e.g. Vite) and test/build commands
- Preserve existing mechanics and publish a playable preview
- Pin dependency versions and document upgrade policy

## Milestone 2 — Asset pipeline

- Prototype GLB loading in an isolated branch
- Evaluate Three.js rendering migration against current performance
- Import one Blender-authored household item (frying pan)
- Add a basic animation controller for an intruder
- Keep a fixed gameplay update step and measure FPS / frame timing

## Milestone 3 — Horror polish

- Improve room lighting, sound occlusion, contact and reaction animations
- Refine item pickup, throwing, physical feedback and enemy state transitions
- Introduce replayable scenario variations without expanding apartment footprint

## Later, only if the core loop earns it

- Co-op with server-authoritative game state
- More apartment layouts, enemy types and scenarios
- Tools for level editing and reusable interactions

## Acceptance criteria for every release

A build must run in desktop Chrome/Edge, preserve win and lose paths, and avoid critical browser console/WebGL errors. Test both graphics modes before merging.


## Art revision workstream — in progress (vertical-slice branch)

See [Art Revision Plan](ART_REVISION_PLAN.md), [Art Acceptance Checklist](ART_ACCEPTANCE_CHECKLIST.md) and the [asset manifest](../assets/asset-manifest.json). The next gates are reusable GLB import/fallback, hero living-room furniture, bedroom/entry, intruder rig and first-person hands, then integrated art/performance review. **In progress:** six furniture GLBs and their guarded import path are implemented and under visual review; authored character and first-person hand GLBs are still pending.
