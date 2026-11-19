# The Uninvited v2 — Exact Blender → GLB Technical Specification
**Companion:** [Art Bible](INTRUDER_V2_ART_BIBLE.md) · [Checklist](INTRUDER_V2_PRODUCTION_CHECKLIST.md)
**Canonical numerical contract:** [`assets/characters/intruder-v2.contract.json`](../assets/characters/intruder-v2.contract.json)
**Status:** Preproduction specification; **no `char_intruder_v02.glb` has been authored or shipped**.

## 0. How this relates to our actual game

Current runtime: Three.js **0.179.1**; `src/actors/IntruderController.js` loads `assets/models/intruder_rig.glb`, validates `idle`, `walk`, `attack`, `stagger`, then applies `IntruderSculpt.js` and `IntruderArtPass.js` to its **12-bone legacy skeleton**.

Our target is a **new, truly skinned production character GLB** replacing the prototype shell and runtime bone-following helper geometry, **not** an additional sculpt layered over them. The new candidate should be opt-in with the old rig as a robust fallback. See §9.

| Item | Required |
| --- | --- |
| Editable master | `assets/source/blender/characters/char_intruder_v02.blend` |
| Runtime candidate | `assets/models/characters/char_intruder_v02.glb` |
| Machine contract | `assets/characters/intruder-v2.contract.json` |
| Source scale | 1 Blender unit = 1 meter |
| Blender axes | +Z up, model visually facing **−Y** |
| Exported glTF / Three.js axes | +Y up, character forward **+Z**, right +X |
| Origin | Ground-level center between boots, local `(0,0,0)` in glTF |
| Source target size | **0.73 × 1.90 × 0.52 m** (runtime X width, Y height, Z depth) |
| Target bounds tolerance | Width ±12%, height ±4%, depth ±15% (includes clothing), require floor contact |
| Max triangles (entire character) | **25,000**; preferred 18,000–22,000 |
| Deform joints | **36 + one nondeforming `Root`** (37 named rig bones total) |
| Max weighted influences | **4** per vertex; normalized after export |
| Max glTF material primitives | **5** preferred; no unexpected material proliferation |
| Texture resolution | 2K jacket, 1K face, 1K gloves/boots, 512 trim; none above 2048 |
| Preferred binary size | under **8 MB** as an initial art budget, revise after profiling |
| Export | glTF 2.0 **binary .glb**, skinned meshes + named animation clips |

Dimensions are a v2 **planned candidate target**; the existing 12-bone asset remains untouched. Because this is a character, neither furniture `ArtReplacements.js` nor its slot loader may be used directly.

## 1. Blender scene topology and file structure

One `.blend` source with intentionally named collections:

```text
CHAR_INTRUDER_V2
├── EXPORT
│   ├── ARM_IntruderV2                (one Armature)
│   ├── Body                          (skinned face/neck/ears/underlayer)
│   ├── Coat                          (skinned cloth / hood)
│   ├── Hood                          (can be merged with Coat after approval)
│   ├── Trousers                      (skinned)
│   ├── Gloves                        (skinned)
│   └── Boots                         (skinned)
├── RIG_CONTROLS                     (IK/FK and custom shapes; DO NOT export)
├── COLLISION_REFERENCE              (visualized gameplay hit area; DO NOT export)
├── BAKE                             (high poly models, sculpt stages; DO NOT export)
└── LOOKDEV                          (studio lights, floor, cameras; DO NOT export)
```

Only `EXPORT` objects go into the final GLB. All visible meshes have UVs, normals, exactly one intended armature target and valid vertex weights. Triangulate as a preview/QA action or export deterministically; don't destroy editable quad topology in the `.blend` master. Apply **mesh object** transforms consistently, not the animated armature's rest pose. Never export an accidental second armature.

**No embedded camera, studio lights, environment meshes, collision boxes, control bones, physics constraints or high-poly sculpt layers** in the runtime GLB. Keep Blender source, baked textures and exports traceable.

## 2. Skeleton contract and hierarchy

The 12 existing named joints must survive **exactly** for compatibility with legacy clip and retarget adapters:

`Pelvis`, `Spine`, `Neck`, `Head`, `Shoulder_L`, `Shoulder_R`, `Elbow_L`, `Elbow_R`, `Thigh_L`, `Thigh_R`, `Knee_L`, `Knee_R`.

Add helper and deform joints to reach the canonical **37-bone rig**:

```text
Root (ground contact, nondeforming, 0,0,0)
└── Pelvis
    ├── Spine_Lower
    │   └── Spine
    │       └── Spine_Upper
    │           ├── Neck
    │           │   └── Head
    │           ├── Clavicle_L
    │           │   └── Shoulder_L → Elbow_L → Wrist_L → Hand_L
    │           │        ├── Thumb_01_L → Thumb_02_L
    │           │        ├── Index_01_L → Index_02_L
    │           │        └── FingerCurl_L  (middle/ring/pinky simplified)
    │           └── Clavicle_R
    │               └── Shoulder_R → Elbow_R → Wrist_R → Hand_R
    │                    ├── Thumb_01_R → Thumb_02_R
    │                    ├── Index_01_R → Index_02_R
    │                    └── FingerCurl_R
    ├── Thigh_L → Knee_L → Ankle_L → Foot_L → Toe_L
    └── Thigh_R → Knee_R → Ankle_R → Foot_R → Toe_R
```

`_L` and `_R` denote the **character's anatomical left/right**. Preserve capitalization. No Blender default names like `Bone.003` in the export skeleton. Armature object is named `ARM_IntruderV2` and isn't itself a required deform bone.

**Bind/rest pose:** relaxed **A-pose**, not a hard T-pose. Maintain symmetrical joint centers with intentionally asymmetric *clothing*, not asymmetric arm lengths. All bones use consistent roll; elbows bend anatomically, knees forward. `Root` may carry local motion during authoring but the exported in-game clips should be **in place** (root planar translation locked, except future intentionally supported transitions). The current game translates the actor with pathfinding.

**Weighting checks:** shoulders deform without detached jacket sleeve gaps, elbows remain circular enough at 90° bend, knees do not collapse into cones, palms/fingers curl without penetrating the glove, neck/hood follows rotation without a hole, boots remain a single continuous foot form. Max four nonzero joint weights per vertex, weights normalized to ≈1.0.

**Root-motion rule:** locomotion is controlled by `NightDirector` and `NavGrid`; exporting significant root translation would double-move the character. Stationary turns are allowed in pose, but the current controller handles facing toward waypoints.

## 3. Mesh construction / topology

Recommended triangle allocations, **all components included in the 25K cap**:

| Component | Working budget |
| --- | ---: |
| Head, ears, neck, face and facial details | 3,500–4,800 |
| Body / torso underlayers | 1,000–1,600 |
| Coat and hood | 5,000–6,800 |
| Trousers | 2,000–3,000 |
| Gloves and hands | 1,700–2,400 |
| Boots | 1,700–2,500 |
| Seams, zipper, pocket/hardware details | 1,000–1,900 |
| **Target total** | **18K–22K**, hard cap 25K |

Create supporting edge loops at elbow, shoulder, knee, fingers and hood opening. Model buttons/teeth economically; use normal details for tiny stitch texture instead of hundreds of separate meshes. Avoid hard UV seams across face and elbows. Limit small accessory meshes that add draw calls without being noticeable at 720p.

**LOD:** if creating `v02_lod1.glb`, target ≤11K triangles with unchanged silhouette and bone names. Do **not** introduce the LOD to the game until an explicit distance-based switch/compatible loader exists. A low-poly alternative isn't automatically activated by including a second file.

## 4. Material and texture atlas specification

Maximum **five** glTF materials. Recommended four:

| Slot | Name | Maximum | Channels |
| --- | --- | --- | --- |
| A | `M_JacketCloth` | 2048² | Basecolor, normal, ORM |
| B | `M_FaceSkin` | 1024² | Basecolor, normal, ORM |
| C | `M_GlovesBoots` | 1024² | Basecolor, normal, ORM |
| D | `M_MinorTrim` | 512² | Basecolor, ORM; normal optional |

Texture naming:

```text
char_intruder_v02_cloth_basecolor.png
char_intruder_v02_cloth_normal.png
char_intruder_v02_cloth_orm.png
char_intruder_v02_face_basecolor.png
char_intruder_v02_face_normal.png
char_intruder_v02_face_orm.png
char_intruder_v02_leather_basecolor.png
char_intruder_v02_leather_normal.png
char_intruder_v02_leather_orm.png
char_intruder_v02_trim_basecolor.png
char_intruder_v02_trim_orm.png
```

- **Basecolor** sRGB, physically plausible and free of baked strong directional lighting.
- **Normal map** linear/non-color (OpenGL tangent-space +Y convention, match Blender/glTF export). Check handedness and seams inside Three.js before baking all maps.
- **ORM**: **R** ambient occlusion, **G** perceptual roughness, **B** metallic; each channel is linear data. Metallic should be zero for most cloth and skin; >0 only on credible hardware.
- **Roughness** should not flatten everything to 1.0; jacket .85–.98, leather ~.75–.92, face ~.65–.90, aged metal ~.45–.75 depending on illumination.
- Eyes: physically visible irises, **no emissive materials**. Alpha-cutout hair or fabric fringes only if necessary; prefer geometry to alpha-blended planes for this small hero character.
- Keep texture sources and licensing records. If baked textures are authored in external tools, retain editable project files where licensing permits.

A 2K RGBA texture consumes significant GPU memory despite a small compressed file. Use actual GPU profiling and texture atlases rather than assuming file size equals runtime cost.

## 5. Named animation delivery

**Legacy integration gate** requires exactly these spellings: `idle`, `walk`, `attack`, `stagger`. The character production package asks for the following **12 named clips** (the first 10 required for final v2 artistic acceptance; turning clips recommended):

| Clip | Duration | Behavior | Loop |
| --- | ---: | --- | --- |
| `idle` | 3.60 s | subtle breath, asym stance | yes |
| `walk` | 1.10 s | slow natural gait, foot contacts | yes |
| `attack` | 0.52 s | committed attack after anticipation | no |
| `stagger` | 0.80 s | one-step balance recovery | no |
| `idle_listen` | 3.00 s | motionless listening, tiny head shift | yes |
| `search` | 3.20 s | deliberate look and slow weight shift | yes |
| `notice` | 0.65 s | subtle recognition, shoulders tense | no |
| `windup` | **0.82 s** | shoulder/torso anticipation | no |
| `recover` | **1.25 s** | settle after strike | no |
| `pursue` | 0.85 s | faster controlled gait | yes |
| `turn_left` | 0.70 s | on-spot 45° turn | no (optional) |
| `turn_right` | 0.70 s | on-spot 45° turn | no (optional) |

Time tolerances for exported actions: ±0.05 s for loops and one-shots, but **windup and contact timing must be retimed in code together** if durations shift. Use **30 FPS** scene timeline; action start on frame 0 or equivalent; no overlong hold frames. For loops, match first and last pose to avoid snapping. Use separate Action/NLA tracks with exact clip names, no unnamed defaults. For every action, keep feet close to local origin; translate the actor only in the gameplay scene.

### Attack timing is a two-part event

**Current prototype:** `ThreatBrain.WINDUP_SECONDS = 0.82` and `RECOVERY_SECONDS = 1.25`. When the windup ends, `NightDirector.enemyTick` *currently* calls `nightEvent('hit')` at the same moment it switches the animation to `attack`. Damage therefore occurs **before** the rendered swing visibly makes contact. This is a **known bug/limitation** to repair in the future v2 integration.

**Required v2 event timeline (milliseconds since windup start):**

```text
   0     Detect player within attack range; play windup + anticipation audio
 120     First readable shoulder tension (still fully dodgeable)
 350     Right shoulder travels back; torso counter-rotation becomes unmistakable
 650     Hand is visibly lifted; full-body silhouette clearly threatening
 820     Windup completes; begin attack animation
1000     Visual hand/pan-contact frame (180 ms into attack); evaluate ONE hit
1340     Attack animation finishes; recover for ~1.25 s
2590     May start another windup if still eligible
```

Do not treat glTF animation extras as guaranteed engine events. The game should use a **sidecar timing constant from `intruder-v2.contract.json`** (or a validated JS export) to queue and resolve damage on the contact frame. Right before that frame, re-evaluate distance/facing, player evasion, and whether the intruder was staggered; then apply damage at most once for that swing. Recovery must not accidentally apply damage twice. Add deterministic `ThreatBrain` and browser tests for dodging, staggering, exact contact timing and repeatability.

**Blend hints:** ~150–250 ms blends for idle/search/walk, shorter (~80–120 ms) into a high-priority windup, zero or minimal smearing on the contact frame. Attack/stagger action ownership should supersede additive procedural poses; do not stack two windups. Align visible feet to existing procedural footsteps until dedicated authored Foley is ready.

## 6. Export settings and checks

In Blender glTF 2.0 exporter:

1. Select only the `EXPORT` collection (armature and intended skinned meshes).
2. Export format **glTF Binary (.glb)**.
3. Include mesh normals, UVs, tangents where needed, PBR material assignments and images.
4. Enable skins and animation export. Export named Actions / NLA tracks as separate clips (verify names after export; exporter options differ across Blender versions).
5. Use **+Y Up** / glTF coordinate conversion and verify the resulting character looks toward local **+Z** in Three.js. Blender source should face **−Y** to match, but **test rather than assume**.
6. Avoid forced uniform scale adjustments; mesh dimensions should be in meters. Do not put a hidden 100× transform on the rig.
7. Exclude extra cameras/lights, bind control geometry, collision proxy and look-development assets. No missing external textures.
8. Validate GLB with the repo's test gate and **real Three.js rendering**, checking actual skinned geometry and clip playback.
9. Do not enable Draco/meshopt/KTX2 until the decoder is installed and tested in our Vite build.

**Recommended preflight:**

```bash
blender -b assets/source/blender/characters/char_intruder_v02.blend \
  --python scripts/blender/validate_intruder_v2.py
npm run test:intruder-v2-contract
npm run check
npm run check:assets
npm run build
```

The Blender validator is a *source-file* preflight and cannot stand in for **exported GLB validation**. An export may still have broken animation names, bindings, or normals.

## 7. Blender rig/export QA details

- Armature object named `ARM_IntruderV2`, one skin hierarchy, no external animation controls exported.
- No zero-length essential bones; no parent cycles; bone names unique and case-exact.
- Mesh weighted to bones on that armature; no stray vertex groups with zero/unintended weights.
- 4 or fewer non-negligible influences per vertex; weight sums 1.0 ±0.02 in source.
- Normal and UV maps survive texture baking and export.
- Visibly separate palms/fingers; no hard shoulder or hip dislocations under sample animations.
- Verify bounding box when pose is reset to rest/A-pose. Source Blender Z is runtime Three.js Y.
- Test 1.64 m camera-height view in the actual hero apartment. Head and eyes must not vanish into the hood.
- Test `idle`, `walk`, `attack`, `stagger` after GLTFLoader import, plus the v2 extended clip list.
- Test different frame-rate samples and aggressive transition from search → windup → stagger → search.

## 8. Integration adapter design

**Important:** `ArtReplacements.js` replaces static furniture groups; it is **not** a character skin/animation loader. Build a separate character candidate path:

1. In `assets/asset-manifest.json`, update `char_intruder_v02` **only after the file exists** from `planned` to `exported` then `in_review`. Keep the legacy GLB in place.
2. Add an explicit Vite URL import for the candidate or an audited `import.meta.glob`, and a guarded `loadGLB` call. If the candidate is missing or invalid, fall back to `assets/models/intruder_rig.glb`.
3. Validate skinned mesh(s), expected bounds, named joints and mandatory clip names/durations. Load failures must not prevent the game from starting.
4. For **new** v2 model, **skip `IntruderSculpt.js` and `IntruderArtPass.js`**; those decorate the 12-bone prototype and would distort/duplicate the authored mesh.
5. Keep `createRiggedIntruder()`'s public API: `group`, `update`, `setClip`, `setIntent`, `reactToImpact`, `getTarget`, `setBasePosition`. Maintain floor position and existing nav/collision footprint.
6. Implement a clip-intent mapping: search → `search`, pursue → `pursue`, warn/windup → `windup`, attack → `attack`, recover → `recover`, stagger → `stagger`. Stay compatible with legacy four clips when falling back.
7. Replace the current immediate-hit event with a one-shot queued contact evaluation timed to the v2 clip. **Do not double-apply current `IntruderPose` shoulder windup on top of a new authored `windup` animation.**
8. Reset mixer state, pending contact events and cached pose/rig state on restart and orbit → first-person transitions.
9. Test Moonlight, lamplight, flashlight, power-off, Performance preset and screenshot captures.

**No gameplay-rule rewrite** is authorized by the art package alone. Retiming hit contact is an explicit future implementation step, not a feature that has already shipped.

## 9. Acceptance gates before marking `active`

- All required GLB metadata, bones, deformations and clip names pass automated tests.
- Front/side/back turnarounds match art bible; face is human and visible.
- Textures are legal, properly encoded and cohesive.
- Performance budgets are met in Balanced quality on a representative non-flagship GPU.
- Enemy navigate/strike/recoil mechanics are unchanged except for separately reviewed timing correction.
- Player can see and dodge an attack; contact is synchronized and applied once.
- Source `.blend`, export `.glb`, textures and license information are preserved in the private repo where appropriate.
- Reviewed screenshots at 720p and 1080p with/without HUD; quality average ≥4/5, no category under 3.
- Full 75-second game, restart and orbit-inspection flows pass with no missing model or skinning errors.
- Never merge into `main` or deploy publicly without approval.

**The v2 candidate remains a specification until actual exported Blender/GLB files exist, are integrated, tested and reviewed.**
