# 3:17 AM — Vertical Slice Alpha

**Private development branch:** `feature/vertical-slice-alpha`

A browser-based survival horror game experiment, now built with **Three.js + Vite**, imported GLB assets, skeletal animation, and a compact playable night. The original self-contained Nightfall v0.4 remains safely available on `main`. **Do not merge or publish this branch until reviewed.**

## Art revision production package

The next workstream is **a coordinated furniture + character art replacement**. Its design and engineering gates are documented in:

- [Art Revision Plan](docs/ART_REVISION_PLAN.md) — style guide, current scene placement, per-asset budgets, Blender/GLB contract and milestone gates.
- [Art Acceptance Checklist](docs/ART_ACCEPTANCE_CHECKLIST.md) — review criteria for sofa, bed, entry, intruder and first-person hands.
- [Asset Manifest](assets/asset-manifest.json) — the planned replacement GLBs, source locations and status for each asset.
- [Blender/Three.js Pipeline](docs/ASSET_PIPELINE.md) — export conventions and safe fallback policy.

**Planning status:** no replacement GLBs or Blender sources have been created merely by adding these documents. The existing procedural meshes remain active, and the playable build is unchanged. Run `npm run test:art-manifest` to validate the planning registry.

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

## Atmosphere pass

The intruder's footsteps are stereo-positioned relative to the player, with quiet procedural room-settling sounds and subtle curtain movement. Audio is synthesized locally and begins after entering first person; press **M** to mute. These sounds are prototypes, not professionally recorded Foley assets.

### Stealth tradeoff

The breaker now affects detection: a lit room exposes a stationary player at a somewhat longer distance, while switching off house power makes hiding easier. **Flashlight use and loud sprinting can still give you away.** Sprint footsteps are faster and slightly louder. This is an early deterministic perception model, not a complete line-of-sight or noise-propagation simulation.

## Authored procedural GLB art pass (first two assets)

The sofa and coffee table now ship as **actual glTF 2.0 binary models** rather than only geometry created in the browser. Source: `scripts/generate-hero-furniture.mjs`. Rebuild with `npm run assets:hero-furniture` and validate with `npm run test:hero-glb`.

These are **procedurally authored/exported meshes**, not Blender sculpted/PBR-textured final furniture. The manifest lists them as **in_review**. On startup the alpha loads the two GLBs, checks their dimensions and swaps them into the existing art slots. If an import fails, the previous procedural model remains visible, keeping the survival game playable. Final artist-authored models are still the long-term target.

## Imported furniture PBR microdetail

The reviewed glTF furniture receives subtle deterministic procedural normal and roughness maps in `src/assets/ArtMaterialFinish.js` (128×128 per material family), cached and shared across instances. These are interim fabric weave / wood-grain surface details, **not scanned or professionally textured materials**. Texture assignment occurs after scale validation and before an asset replaces its fallback.

## Bedroom GLBs

The bed and four-drawer phone dresser now also export as independent runtime glTF assets, generated through the same reproducible Node script. Both are `in_review` pending on-device visual review and retain fallback geometry. The emergency phone itself remains at its original accessible gameplay anchor, independent of the furniture asset.

## Entertainment-wall GLBs

The media console and television are now separate compact glTF models generated from the same source script, with a visible stand, low-profile frame and cabinet drawer details. Their manifest entries remain `in_review`; like the living-room and bedroom models, they retain automatic fallback on load or dimension validation failure.
