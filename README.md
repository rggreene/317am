# 3:17 AM — Vertical Slice Alpha

**Private development branch:** `feature/vertical-slice-alpha`

A browser-based survival horror game experiment, now built with **Three.js + Vite**, imported GLB assets, skeletal animation, and a compact playable night. The original self-contained Nightfall v0.4 remains safely available on `main`. **Do not merge or publish this branch until reviewed.**

## Art revision production package

The current art workstream is **a coordinated furniture + character art replacement**. Its design and engineering gates are documented in:

- [Art Revision Plan](docs/ART_REVISION_PLAN.md) — style guide, current scene placement, per-asset budgets, Blender/GLB contract and milestone gates.
- [Art Acceptance Checklist](docs/ART_ACCEPTANCE_CHECKLIST.md) — review criteria for sofa, bed, entry, intruder and first-person hands.
- [Asset Manifest](assets/asset-manifest.json) — the planned replacement GLBs, source locations and status for each asset.
- [Blender/Three.js Pipeline](docs/ASSET_PIPELINE.md) — export conventions and safe fallback policy.

**Current status:** six reproducibly generated furniture GLBs now load into the actual game, with scale validation and automatic procedural fallback. The intruder and player hands also have improved procedural art, but **no Blender-authored final models have shipped**. All six imported furniture assets remain `in_review`. Run `npm run check:assets` for the geometry tests or `npm run assets:hero-furniture` to regenerate the files.

## The Uninvited v2 — complete character production package

We have an **approved technical direction**, not yet a finished replacement model. The existing 12-bone intruder remains the active, playable fallback. The private repo contains a full production package:

- [Intruder v2 Art Bible](docs/INTRUDER_V2_ART_BIBLE.md) — human silhouette, face, clothing, materials, character behavior and required reference views.
- [Intruder v2 Production Checklist](docs/INTRUDER_V2_PRODUCTION_CHECKLIST.md) — eight measurable gates from design through Blender rigging, animation, export, gameplay integration and QA.
- [Exact Blender/GLB Spec](docs/INTRUDER_V2_BLENDER_GLB_SPEC.md) — 37 named rig joints, bounds, 25K triangle cap, texture layouts, timing and adapter requirements.
- [Machine-readable v2 contract](assets/characters/intruder-v2.contract.json) — the canonical names, durations and asset budgets.
- [Blender source preflight](scripts/blender/validate_intruder_v2.py) — run from Blender once an actual source file is authored.
- Run `npm run test:intruder-v2-contract` to validate specs now and a candidate GLB after it exists.

**Design decision:** an ordinary, lean adult human intruder; worn charcoal work jacket and soft hood, visible human face, no supernatural eyes or theatrical armor.

**Update:** the model now exists as a **procedurally authored, four-material skinned GLB** (`char_intruder_v02.glb`) with 37 joints, 12 named animations and 23,254 triangles. GitHub Actions builds and validates it. It remains **in_review** because the face and clothing are still unmistakably stylized/procedural, not professional sculpted hero art. The **attack damage is now evaluated 0.18 seconds after the animation begins**, and can be dodged or interrupted. Blender source does not yet exist; run the supplied Blender importer to convert the GLB into an editable `.blend` for further authoring.

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

Six hero pieces now ship as **actual glTF 2.0 binary models** rather than only geometry created in the browser. Source: `scripts/generate-hero-furniture.mjs`. Rebuild with `npm run assets:hero-furniture` and validate with `npm run test:hero-glb`.

These are **procedurally authored/exported meshes**, not Blender sculpted/PBR-textured final furniture. The manifest lists them as **in_review**. On startup the alpha loads the six GLBs, checks their dimensions and swaps them into the existing art slots. If an import fails, the previous procedural model remains visible, keeping the survival game playable. Final artist-authored models are still the long-term target.

## Imported furniture PBR microdetail

The reviewed glTF furniture receives subtle deterministic procedural normal and roughness maps in `src/assets/ArtMaterialFinish.js` (128×128 per material family), cached and shared across instances. These are interim fabric weave / wood-grain surface details, **not scanned or professionally textured materials**. Texture assignment occurs after scale validation and before an asset replaces its fallback.

## Bedroom GLBs

The bed and four-drawer phone dresser now also export as independent runtime glTF assets, generated through the same reproducible Node script. Both are `in_review` pending on-device visual review and retain fallback geometry. The emergency phone itself remains at its original accessible gameplay anchor, independent of the furniture asset.

## Entertainment-wall GLBs

The media console and television are now separate compact glTF models generated from the same source script, with a visible stand, low-profile frame and cabinet drawer details. Their manifest entries remain `in_review`; like the living-room and bedroom models, they retain automatic fallback on load or dimension validation failure.

### Compare intruders and edit the model

- **Review candidate:** launch `npm run dev` and open `http://localhost:5173/?intruder=v2` (also the default on this feature branch).
- **Original fallback:** open `http://localhost:5173/?intruder=legacy` and press **R** in orbit mode to inspect.
- Both branches use the same enemy gameplay logic and attack-contact timing; only the visual model/animation source changes.
- Generate the model reproducibly with `python3 -m pip install -r requirements-art.txt` then `npm run assets:intruder-v2`.
- On a machine with Blender installed, import the GLB as editable Blender source using `blender -b --python scripts/blender/import_intruder_v2.py`.
- A full-quality hand-authored retopology, better face, and weight paint remain the next art pass. No screenshot in the concept board is proof of in-engine photorealism.
