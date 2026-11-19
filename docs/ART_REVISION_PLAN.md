# 3:17 AM — Art Revision Plan
**Status:** Approved direction / production plan, NOT implemented art
**Target branch:** `feature/vertical-slice-alpha`
**Source baseline:** `7238d778` (the playable 75-second survival alpha)
**Owner:** Art and engineering, using the existing private repository
**Guiding principle:** Improve visual believability first; preserve the working game.

## 1. Creative north star

**"A normal, lived-in home becomes uncomfortable at 3:17 AM."**

The horror comes from familiarity, silence, lighting, and the way a human intruder occupies ordinary space—not from grotesque monsters, excessive darkness, or shiny showroom furniture.

- **Style:** grounded stylized realism. Real-world construction and material responses, slightly simplified secondary shapes; no exaggerated game-cartoon proportions.
- **Story:** a modest inhabited apartment. Everyday use: slightly flattened cushions, worn armrest, charger cable, a forgotten cup, papers and shoes. Not filthy, dilapidated, or abandoned.
- **Palette:** restrained slate-blue/gray upholstery, warm worn walnut/laminate, muted off-white paint, aged brushed metal; warm lamps contrasted with cool moonlight.
- **Value hierarchy:** readable silhouettes at gameplay distance. Floor and walls are visually quiet; hero furniture has believable mass and close-up detail. Keep the intruder readable against the hallway but not perfectly exposed.
- **Lighting:** preserve existing warm practical lights and bluish window spill. Tune the material response *inside the actual renderer*, not only in Blender studio HDRI.
- **Horror direction:** human and plausible, asymmetric and deliberate, tense rather than gory. A sleeve rustle, slow head turn, and pause before striking should carry the fear.

### Visual acceptance views

Use consistent review captures at **1280×720 and 1920×1080**, Balanced preset, same lighting toggles, and the following player compositions:

1. Bedroom threshold toward living-room opening.
2. First-person near sofa, facing TV and window.
3. Living room toward entry door and breaker.
4. Intruder near the sofa, half lit by the warm practical light.
5. Intruder in cool ambient light at hallway distance.
6. First-person hands/pan at idle, windup, contact and recovery.
7. Orbit cutaway with doors/fixtures correctly hidden and restored.

**Important:** software-WebGL screenshot tests ensure code/assets load. Only actual browser/GPU playtests determine whether the visual result feels convincing.

## 2. Current project constraints

Based on `src/world/buildRoom.js`, `src/game/buildInteractionProps.js`, `src/game/CombatMath.js`, `src/actors/IntruderController.js` and `src/game/WeaponRig.js`:

- World units are **meters**; room is roughly **6.55 m × 5.48 m**, wall height **2.85 m**.
- Living sofa is centered at `(1.50, z 1.26)`, coffee table at `(1.49, z .17)`, TV/console at `(1.60, z -2.17)`. The intruder's base position is `(.28, z -.38)`.
- Player starts at `(.05, y 1.64, z 1.70)`. Keep the playable route and nearby-interaction anchors usable.
- Entry door and breaker use the **right exterior wall** and are intentionally hidden during orbit cutaway. Do not leave standalone floating fixture geometry in orbit mode.
- Navigation still uses coarse axis-aligned blockers from `src/game/CombatMath.js`. Any visually changed footprint must either stay inside those envelopes or update movement + A* navigation, tests and interactable ranges in the same change.
- The emergency phone, entry, breaker and first-aid kit are used by the gameplay loop; preserve IDs, transforms, and an intelligible **E** prompt.
- An imported `frying_pan.glb` and a skinned `intruder_rig.glb` already load through Three.js. The current intruder contains `idle`, `walk`, `attack`, `stagger`. Keep animation-state compatibility during replacement.
- Current first-person hands are **proxy meshes**, parented near the pan; the attack is driven by `SWING_DURATION=0.76` and `IMPACT_PHASE=.41`. Don't silently break strike timing while improving grip.
- Preserve `main` (Nightfall v0.4) and the earlier `feature/visual-overhaul`. Work only on the vertical-slice branch or a reviewable child art branch.

## 3. Deliverable waves

### Wave 0 — Asset integration foundation (engine)
**Deliverable:** a reusable manifest-driven art-import layer with safe fallback; do not replace all procedural objects at once.

- Consolidate asset paths and dimensions in `assets/asset-manifest.json`; identify *art* vs. *gameplay anchor* for each object.
- Add reusable loader/cache and per-asset fallback with readable load errors. Honor Vite asset URLs; avoid dynamic import paths that prevent bundling.
- Support GLB material adjustments without hacking a shared material used elsewhere.
- Measure triangle count, materials, draw calls, texture/GPU memory and request times. Establish actual baseline before enforcing caps.
- Implement replacement in scene groups, e.g. `sofaHero`, `bedHero`, while retaining current collision envelopes until validated.
- Add **asset-only mode** or test scene: turntable, scale reference, neutral/warm/cool lighting, no survival timer.
- Record origin, orientation and expected dimensions in the manifest. Warn on unexpected scale or missing expected animation names.

**Acceptance:** original gameplay loads even if an optional new GLB is missing; no duplicate furniture occupies the same spot; viewmodel and enemy still load.

### Wave 1 — Hero furniture and domestic kit (highest visual ROI)

**Batch A (required):** sofa, coffee table, rug, media console, TV, low side table/entry console. Evaluate immediately from first-person.
**Batch B:** bed + bedding, nightstand, dresser/phone location, entry door and hardware, breaker frame.
**Batch C:** refrigerator, kitchenette cabinet/counter, floor lamp, window framing/blinds, decor kit.

**Specific modeling goals**

- **Sofa:** authentic two-seat frame, 2 individually compressed cushions, visible seams/piping, slight fabric wrinkles, believable leg attachments; *not* rounded boxes disguised as cushions. Backrest height and seating plane must match character scale.
- **Coffee table:** solid thickness, bevel highlights, joinery, physically plausible feet and a lower shelf; grain follows the length of individual parts.
- **Bed:** visibly separate frame, mattress, two pillows and relaxed bedding with gravity folds; silhouette still reads from the doorway.
- **Dresser/phone:** drawer fronts and handles, realistic proportions, phone visually obvious as a survival objective. Preserve reachable world-space position.
- **Door:** frame, real panel inset/reveal, hinges, handle, strike plate, barricade-friendly silhouette; preserve playable barricade and entry timing.
- **TV/media:** credible screen thickness, bezel, cable management and glow; avoid a giant uniformly emissive rectangle.
- **Refrigerator/counter:** satin finish, seals, realistic handles, cabinet seams; avoid overbright chrome.

**Furniture rule:** each prop must look credible from 1–2 meters under scene lighting and remain visually readable at 720p. Imperfections should be subtle enough to disappear at normal gameplay distance.

### Wave 2 — Intruder redesign (main character)

**Design:** *The Uninvited*. Ordinary adult human proportions, lean frame, worn jacket/hood or rain layer, dark pants, practical boots, gloved hands. Face mostly in shadow or partially occluded. No glowing supernatural eyes as the primary design, no skull mask or monster claws.

- **Silhouette:** slender asymmetrical shoulder line, one sleeve slightly bulkier, head carried lower than expected, slight forward stoop. Human and unsettling without impossible anatomy.
- **Readability:** long enough forearms and distinct shoulder articulation for windup, enough head/neck clearance to slowly notice the player.
- **Materials:** faded fabric jacket with stitch seams and roughness variation, worn leather/rubber boots, natural skin only where visible. No perfectly glossy fabric, pure-black body void, or toy-like plastic.
- **Rig:** aim 24–40 useful deform joints plus twist/support where necessary, not arbitrary bone inflation. Root hips, spine, neck/head, clavicles, elbows, wrists, knees, ankles are required. Hands need readable contact/pose even if fingers are simplified.
- **Animation states:** `idle`, `walk`, `attack`, `stagger` remain mandatory export names. Introduce `notice`, `search`, `windup`, `recover` only once state mappings and transition tests are updated. Windup must genuinely precede damage; make anticipation legible in side silhouette.
- **Motion style:** modest body movement at idle, slow head/torso scan, weight shift into pursuit, planted feet during strike, believable stagger direction. Avoid sliding and exaggerated cartoon anticipation.
- **Technical separation:** character GLB is visual-only. Keep detection, pathfinding, world position, attack range and damage in their existing gameplay systems. Use normalized animation timing to sync with `ThreatBrain.js`.

**Required review:** straight-on, side and back orthographic turnarounds; posed windup, stagger and walk silhouette at hallway distance; real in-game warm- and moonlit screenshots. The character should look convincing before adding expensive face shaders.

### Wave 3 — First-person viewmodel and pan

- Replace sphere/cylinder gloves with authored first-person forearms, sleeves, wrists, palm geometry and recognizable fingers gripping the existing pan.
- Keep the idle viewmodel slightly below/right of crosshair. Verify no frame-edge clipping at supported FOV and aspect ratios.
- Rig forearms/hands for anticipation, swing, hit-stop, contact, follow-through, recovery and an interact/reach pose.
- Preserve gameplay collision/hit windows as gameplay logic. Don't use visual pan position as a hidden new damage rule.
- Align palms/finger curvature to the pan grip in all action frames. Add a subtle sleeve pull at the elbow; avoid hand penetration of the handle.
- First-person texture budget may exceed world prop budget because hands are near the camera, but assess actual on-screen pixels before allocating 2K.
- Keep weapon/arms independent from the world actor for low-cost iteration; use stable `Grip_R`/`Grip_L` attachment points.

### Wave 4 — Cohesion / integration

- Update environmental material responses under moon and practical lights; lower excessive exposure if the new roughness/normal detail blooms.
- Update blockers and navgrid if a silhouette extends into walking paths. Re-run enemy route tests and one complete 75-second night.
- Add one more intentional domestic composition: cup/remote/cable, mail and shoes. No random prop scattering.
- Compare before/after screenshots under identical camera/exposure. Reject expensive assets that are visually indistinguishable at gameplay distance.
- Add physically meaningful audio cues only after animation timing is settled (sleeve, shoe/footstep, pan contact).
- If design shifts, update this plan and the manifest **in the same commit**.

## 4. Initial browser art budgets

These are *working limits*, not measured baselines or guaranteed performance:

| Category | Typical triangles per asset | Materials | Textures |
| --- | ---: | ---: | --- |
| Tiny decor / switches / keys | 100–1,000 | 1 | shared 256–512 |
| Medium props (lamp, side table, TV) | 1,000–4,000 | 1–3 | mostly 512–1K |
| Main furniture (table, bed, dresser) | 3,000–9,000 | 2–4 | mostly 1K |
| Hero sofa / visible upholstery | 7,000–14,000 | 2–4 | 1K; optional targeted 2K |
| Intruder skinned model | 12,000–25,000 | 3–5 | 1–2K atlased |
| Player viewmodel arms and hands | 8,000–16,000 | 2–3 | 1–2K |
| Frying pan | 1,500–4,000 | 2–3 | mostly 1K |

**Scene-level starting targets:** work toward fewer than ~200 draw calls in Balanced mode and keep texture allocations modest; measure the existing alpha first and revise caps based on actual FPS on a non-flagship desktop. The user's high-end GPU is a useful test system but must not be the only benchmark. Use asset reuse and mesh instancing for repeated decor where sensible. Don't degrade readability just to meet an arbitrary triangle count.

**Materials:** glTF metallic/roughness workflow; base color/emissive maps in sRGB; normal, roughness, metallic, AO maps in linear/non-color space. Prefer one ORM packed texture when it makes sense. Avoid assigning the same flat normal/roughness values to everything. Keep surface noise subtle.

**Compression:** GLB delivery first. Consider meshopt/Draco or KTX2/BasisU **only after** installing and testing the matching decoder/loader in Three.js and CI. Never commit textures that the browser cannot decode.

## 5. Blender → GLB contract

- **Units:** metric, 1 Blender unit = 1 meter.
- **Axis:** author with Blender Z-up; glTF export to Y-up. Test forward in Three.js (+Z convention for an actor only if the controller mapping matches it; choose and document one).
- **Meshes:** apply non-armature object transforms, avoid negative scale, triangulate intentionally or validate exported triangulation, delete hidden/internal production geometry.
- **Origins:** furniture at floor-contact center by default; wall fixtures at mounting anchor; pan origin at grip/pivot; humanoid root at ground-center with hips/spine as skeletal children. Record exceptions.
- **Collections:** `ART`, `COLLISION_REFERENCE`, `RIG`, `EXPORT`. Keep playable collisions out of glTF unless intentionally supported.
- **Naming:** `room_sofa_2seat_v01.glb`, `prop_coffee_table_v01.glb`, `char_intruder_v02.glb`, `vm_player_arms_v01.glb`; Blender sources use the same stem + `.blend`.
- **Textures:** suffix `_basecolor`, `_normal`, `_orm`, `_emissive`. Store source textures separately from baked/export textures. Keep a record of texture licenses and source provenance.
- **Topology:** no hidden intersections, no self-intersecting large folds, reasonable normals, weighted normals where appropriate, seam placement that doesn't call attention to itself.
- **Export:** glTF 2.0 binary (.glb); PBR metallic/roughness; correct pivot, normals, material assignments and named animations; no environment camera/lights embedded in prop assets.
- **Smoke test:** parse GLB in Three.js without errors; verify bounding box against expected measurements; compare against player at 1.64 m camera height; verify acceptable draw calls/texture size.

## 6. Repo structure and replacement policy

```text
assets/
  asset-manifest.json         # planned/produced/reviewed/active asset registry
  source/
    blender/
      furniture/
      characters/
      props/
  models/
    furniture/
    characters/
    props/
  textures/
    shared/
docs/
  ART_REVISION_PLAN.md
  ART_ACCEPTANCE_CHECKLIST.md
```

Only the manifest/document files are created in the planning pass. Unmade GLB and Blender files are **not** represented as shipped. Do not delete the existing `assets/models/frying_pan.glb` or `intruder_rig.glb` until a runtime replacement passes tests and visual review.

Integration contract:

1. Add a newly exported GLB alongside the procedural asset.
2. Load it behind a configuration flag or a per-asset replacement function; keep the fallback.
3. Apply placement/scale from the manifest; adjust gameplay blockers only as a separate explicit change.
4. Smoke-test GLB parse, object presence and important clip names.
5. Capture orbit / first-person screenshot comparisons and validate an entire survival run.
6. Mark manifest entry `in_review` then `active` **only after** review. Never mark an asset complete because a placeholder generated successfully.

## 7. Production sequencing / review gates

| Gate | Implementation | Release criterion |
| --- | --- | --- |
| A0 — foundation | Manifest, Blender convention, GLB loader + fallback, asset turntable | Existing night still passes, no missing runtime GLBs |
| A1 — main room | Sofa, coffee table, rug, media console, TV | Better first-person silhouette/readability, no navigation regression |
| A2 — bedroom / entry | Bed, nightstand, dresser/phone, entry door, breaker | Objective interactions reachable; no floating fixtures in orbit |
| A3 — utility & dressing | Counter/fridge/lamp/windows/curated clutter | Lighting holds up without material blowout |
| A4 — intruder | Authored rigged human and improved clips | Notice/windup/contact readable; no skinned mesh errors |
| A5 — player hands | Rigged arms, stable grip/pan alignment | Crosshair clear, swing timing and hit tests unchanged |
| A6 — cohesion | Materials, exposure, collision/nav, QA | Full 75-second night, screenshots, acceptable FPS and artifact sizes |

**Review cadence:** review at A1, A4 and A6—not every individual cushion or glove. Maintain clean, revertible commits and a working build at each gate.

## 8. Definition of done for the art revision

- The apartment looks like a believable **occupied** home from the main first-person path.
- The sofa, bed and entry area no longer read as boxes with bevels.
- The intruder has a readable human silhouette at 720p and real pose-based windup, pursuit and stagger.
- Gloved hands grip the pan without visible floating fingers or severe clipping.
- Prop dimensions and their interaction points line up.
- All existing survival controls/conditions still function.
- `npm run check`, GLB validation, production build and real browser smoke test pass.
- No material rendering errors, missing GLB assets or accidental changes to `main`.
- Browser performance is measured in the intended Balanced preset, not assumed.
- Screenshots are compared at identical viewpoints; the delta is obvious without an explanation.

**Out of scope for this art revision:** new playable rooms, multiplayer, gore, full v0.4 inventory parity, cutscenes, cinematic mocap production or public hosting.
