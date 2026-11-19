# 3:17 AM — Vertical Slice Alpha

**Private development branch:** `feature/vertical-slice-alpha`

A browser-based survival horror game experiment, now built with **Three.js + Vite**, imported GLB assets, skeletal animation, and a compact playable night. The original self-contained Nightfall v0.4 remains safely available on `main`. **Do not merge or publish this branch until reviewed.**

## Play locally

Requires Node.js 22 or a compatible recent LTS and a browser with WebGL 2.

```sh
git fetch origin
git switch feature/vertical-slice-alpha
git pull
npm install
npm run dev
```

Open the local address provided by Vite, typically `http://localhost:5173`.

Press **V** or the top-right button to enter first-person mode. Click inside the scene to capture the mouse. The night begins when you enter first person; returning to orbit pauses it.

## Survival loop

You have **75 seconds**.

- Find the emergency phone on the left-side dresser and press **E** to call dispatch. You **must call** to win.
- Find the front door along the right wall and press **E** to reinforce it before the intruder enters. This delays entry.
- The breaker on the right wall toggles interior power; your flashlight remains available.
- The first-aid kit on the small hall console can restore health **once**, after you have taken damage.
- Defend yourself with the frying pan. Hit the approaching intruder at close range to stagger and briefly stun it.
- Survive until the countdown ends after calling dispatch to win. Failing to call or losing all health ends the run.
- After a win or loss, press **N** or click **Restart the Night**.

This is a compact playable **vertical-slice prototype**, **not** full gameplay parity with the original Nightfall v0.4.

## Controls

| Key | Purpose |
| --- | --- |
| V | First-person survival / orbit lab |
| WASD / Mouse | Walk / look (click canvas first to capture mouse) |
| Shift | Move faster |
| Left click | Swing frying pan |
| E | Interact in survival; inspect frying pan in orbit |
| R | Inspect intruder in orbit |
| 1–4 | Preview idle, walk, attack, stagger animations in orbit |
| F | Toggle flashlight |
| G | Toggle lighting balance |
| P | Cycle Balanced / Cinematic / Performance graphics |
| O | Toggle FPS meter |
| M | Mute or unmute synthesized ambience |
| N | Restart after ending |
| Esc | Release pointer lock; close orbit inspection |
| H | Hide the interface |

## Project layout

- `src/game/Game.js` — top-level renderer, animation and input orchestration
- `src/game/NightDirector.js` — session state, enemy movement and interactables
- `src/game/SurvivalRules.js` — deterministic win/loss and timed mechanics
- `src/game/NavGrid.js` — grid-based enemy navigation
- `src/game/CombatLab.js` / `WeaponRig.js` — first-person melee presentation
- `src/world/` — hero apartment, reusable geometry and procedural material maps
- `src/actors/` — rigged intruder and animation controller
- `assets/models/` — reproducible GLB frying pan and intruder prototypes
- `src/rendering/QualityManager.js` — graphics profiles
- `src/audio/` — synthesized ambient and impact sound

## Checks and browser captures

```sh
npm run check
npm run check:assets
npm run build
npm run test:survival
npm run test:integration
npm run test:rendering
```

GitHub Actions also launches headless Chrome using software WebGL 2, validates both GLB loads and key mode transitions, and uploads two PNG screenshots. See [playtest checklist](docs/PLAYTEST_CHECKLIST.md).

## Limitations

The environment is more detailed than the original lab but still consists mostly of **procedural placeholder geometry**. It does not yet contain premium Blender-authored environment meshes, high-resolution scanned materials, mocap-quality human animation, full physics collision, the complete v0.4 inventory/scavenging loop, or polished enemy AI. The visual test is automated with software rendering; **human GPU-backed gameplay testing is still required**.

The original project is private, but any JavaScript or GLB assets delivered through a public deployment would be visible to clients. Keep this branch private until ready to share.

For migration details and milestones, see [Three.js migration notes](docs/THREEJS_MIGRATION.md).
