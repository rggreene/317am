# The Uninvited v2 — Production & Acceptance Checklist
**3:17 AM** · **Production status: FIRST GLB CANDIDATE IN REVIEW — FINAL SCULPT PENDING** · **Candidate:** `char_intruder_v02.glb`

Use this as the single tracking document for the character. The exact specifications live in the [Art Bible](INTRUDER_V2_ART_BIBLE.md), [Blender/GLB Spec](INTRUDER_V2_BLENDER_GLB_SPEC.md), and [machine contract](../assets/characters/intruder-v2.contract.json). Nothing here marks the model as finished; each checkbox requires a produced artifact or verified test.

## Gate C0 — References and design lock
- [ ] One page of neutral design sketches showing the **same adult human** from front, profile and back.
- [ ] Head closeup demonstrates visible human nose, lips and eyes in a soft draped hood, never a spherical helmet.
- [ ] 1.90 m proportion guide; natural shoulder, elbow, wrist, hip, knee and ankle positions.
- [ ] Jacket shape and hem, repaired left elbow, pockets, glove fit and boot wear are consistent across views.
- [ ] Approve palette against existing warm lamplight and blue moonlight in 3:17 AM.
- [ ] Three pose keys: listening, shoulder-leading windup, asymmetric stagger.
- [ ] Save approved images with stable filenames under a private authorized source folder; record provenance.
- [ ] Reject any concept with supernatural eyes, slasher mask, armor, military loadout or exaggerated zombie anatomy.

**Deliverable:** approved character sheet, material swatches, pose keys; no mesh yet.
**Gate owner:** Art direction / user review.

## Gate C1 — Blender blockout and proportion
- [ ] Create `assets/source/blender/characters/char_intruder_v02.blend`.
- [ ] Use meters, +Z up in Blender; front faces −Y so runtime faces +Z after conversion.
- [ ] Create `EXPORT`, `RIG_CONTROLS`, `BAKE`, `LOOKDEV`, `COLLISION_REFERENCE` collections.
- [ ] Keep origin at floor center between boots; feet planted at z=0 in Blender.
- [ ] Block body to runtime envelope ~0.73 × 1.90 × 0.52 m; height ±4% under spec.
- [ ] Confirm body reads as an ordinary man at 4 m from 1.64 m camera height.
- [ ] Confirm hood allows an actual face rather than becoming a mask.
- [ ] Inspect front, 3/4, side and back in neutral clay lighting.
- [ ] Review at a gameplay field-of-view, not only in a flattering closeup.

**Deliverable:** approved mesh blockout and clay turnaround.
**Reject if:** silhouette still resembles the procedural mannequin, boot size implausible, hood obscures facial identity entirely.

## Gate C2 — Mesh sculpt, retopology and surface construction
- [ ] Establish head planes, ears, nose bridge, mouth and naturally imperfect eyes.
- [ ] Build distinct jacket, hood, underlayer, trousers, gloves and boots using real construction thickness.
- [ ] Maintain garment separation while preventing clipping at hip, neck, wrists and elbows.
- [ ] Add believable shoulders, seat/waist folds, knee shaping and relaxed garment drape.
- [ ] Add one small repaired **left** elbow patch; avoid generic distressed noise everywhere.
- [ ] Concentrate polygons on visible face, shoulders and hands; avoid invisible backfaces/hidden geometry.
- [ ] Total **18K–22K** target, **≤25K triangles** absolute pre-review budget.
- [ ] Keep at most five render material slots; avoid per-stitch meshes.
- [ ] UV unwrap all final meshes, no severe stretching or mirrored face features.
- [ ] Check normal orientation, smoothing groups, mesh tangent consistency and silhouette.
- [ ] Keep high-poly sculpt and bake sources outside EXPORT.

**Deliverable:** clean editable game-ready mesh set with UVs and polygon report.
**Reject if:** tattered/noisy clothing dominates the eye or surface shading is excessively glossy.

## Gate C3 — Rigging, weighting and deform tests
- [ ] Build one armature object named `ARM_IntruderV2`.
- [ ] Include all **37 canonical bone names**, 36 deform + nondeform Root; legacy 12 names case-exact.
- [ ] Match hierarchy in `intruder-v2.contract.json`.
- [ ] Use relaxed A-pose, anatomical elbow/knee bends and consistent bone roll.
- [ ] No duplicate deform joints, unnamed Blender bones, negative scales or hidden second armatures.
- [ ] Every exported mesh has a working armature modifier pointing to `ARM_IntruderV2`.
- [ ] All weighted vertices normalize to ~1; **maximum four significant influences** per vertex.
- [ ] Stress-pose shoulders, elbows, hip flexion, knees and glove fingers; inspect jacket sleeve and hood intersection.
- [ ] Deformation holds at 90° elbow bend and large shoulder/windup movement.
- [ ] Check boot contact, left/right symmetry of bone lengths and bone-name spelling.
- [ ] Run `blender -b ... --python scripts/blender/validate_intruder_v2.py` on source.

**Deliverable:** game skin and source-rig QA report.
**Reject if:** creased cuff floats, shoulder cuts through jacket, head separates from collar, feet slide in stance.

## Gate C4 — PBR material pass
- [ ] Use `M_JacketCloth`, `M_FaceSkin`, `M_GlovesBoots`, `M_MinorTrim` (optional fifth only with reason).
- [ ] Texture resolution 2048² maximum; face/leather 1024², trim 512².
- [ ] Export base color in sRGB; normals and ORM (R=AO,G=roughness,B=metallic) as linear.
- [ ] Test cloth at grazing warm light for broad roughness and restrained weave.
- [ ] Keep human face visible in realistic low light; eye material has no emission.
- [ ] Gloves, boots and metal have distinguishable roughness and scale.
- [ ] Record provenance/licenses for any non-original scan/texture and copy permissible sources.
- [ ] Do a clear closeup test **and** actual 720p gameplay screenshot; details must survive at practical distance.

**Deliverable:** final material swatches, atlases, look-development renders and texture inventory.
**Reject if:** plastic cloth, glossy full-body sheen, glowing eyes, burned-in light/shadow gradients.

## Gate C5 — Animation authoring (12 names; first 10 mandatory v2)
- [ ] `idle` 3.60 s loop: restrained breath and plausible asymmetry.
- [ ] `walk` 1.10 s loop: readable grounded footfalls.
- [ ] `attack` 0.52 s one-shot: a committed but human swing; contact at **0.18 s**.
- [ ] `stagger` 0.80 s one-shot: weight catch and asymmetric recoil.
- [ ] `idle_listen` 3.00 s loop: near-still attention.
- [ ] `search` 3.20 s loop: slow head-leading scan, meaningful pauses.
- [ ] `notice` 0.65 s one-shot: restrained recognition.
- [ ] `windup` **0.82 s** one-shot: shoulder/torso tension, fully telegraphed.
- [ ] `recover` **1.25 s** one-shot: release and return to balance.
- [ ] `pursue` 0.85 s loop: controlled urgency.
- [ ] Optional `turn_left` 0.70 s and `turn_right` 0.70 s in-place turns.
- [ ] Each loop has compatible first/last poses; all names export individually from Actions/NLA.
- [ ] Feet and pelvis stay in place for game-driven pathfinding (no unaccounted root motion).
- [ ] Snapshots from 2–4 m show clear search and windup silhouettes without HUD indicators.
- [ ] Stagger transitions cancel an ongoing attack without orphaned animation states.

**Deliverable:** named action/NLA library, exported animation list and timing report.
**Reject if:** attack registers damage before visible contact, animation blends collapse the windup, clip names are lost.

## Gate C6 — Export and independent validation
- [ ] Export one skinned glTF 2.0 binary model to `assets/models/characters/char_intruder_v02.glb`.
- [ ] Export mesh normals/UVs, material atlases, 37 required bones and named animation clips.
- [ ] Verify +Y-up and +Z-forward after export; no unexpected 100× scale.
- [ ] Verify local ground origin and dimensions against the JSON contract.
- [ ] Verify ≤25K triangles, ≤5 materials, ≤2048 texture edges, four max skin influences.
- [ ] Verify `idle`, `walk`, `attack`, `stagger` first; then all v2 required clips.
- [ ] Test with Three.js `GLTFLoader` and `AnimationMixer`, not just raw GLB structure.
- [ ] Test each clip's first, middle and final pose for non-NaN transforms and clipped meshes.
- [ ] Keep `intruder_rig.glb` unchanged as fallback; **do not** remove sculpt/dress code until fallback works.
- [ ] Mark asset manifest entry `exported` then `in_review` **only after actual GLB exists**.
- [ ] Pass `npm run test:intruder-v2-contract` with candidate present.

**Deliverable:** real checked-in source and GLB plus automated asset report.
**Reject if:** glTF scene is empty, animation clips missing, weights invalid or candidate cannot be parsed.

## Gate C7 — Gameplay integration and combat synchronization
- [ ] Add a separate character-loader fallback path; do not reuse the static furniture slot loader.
- [ ] Preserve `createRiggedIntruder` API and existing `NightDirector` state semantics.
- [ ] Skip `IntruderSculpt.js`/`IntruderArtPass.js` for the authored v2; still call on legacy fallback.
- [ ] Map intent states to new clips while supporting four legacy clips if fallback loads.
- [ ] Maintain old actor group origin, walkability and navigation behavior.
- [ ] **Fix contact mismatch:** after 0.82 s anticipation, play attack; apply damage at **0.18 s into attack**, not at clip start.
- [ ] Recheck distance, player evasion and active stagger **at contact**, not just at the start of the swing.
- [ ] Ensure **only one** hit event per attack, regardless of frame rate or animation transitions.
- [ ] Verify a pan stagger before contact cancels queued damage.
- [ ] Stop additive procedural windup from double-deforming the new authored windup clip.
- [ ] Restart and orbit transitions clear pending hit/contact state and mixer playback.
- [ ] Recheck spatial footsteps and character foot plants against sound timing.
- [ ] Verify pan reach, detection and pathfinding are still fair and remain data-driven.

**Deliverable:** safe GLB integration PR, deterministic attack timing tests and screenshot comparisons.
**Reject if:** any previously passing survival action regresses, hit occurs before contact or model becomes invisible.

## Gate C8 — Visual approval and final QA
- [ ] Character reviewed at 720p and 1080p under warm, cool and power-off/flashlight lighting.
- [ ] Front/side/back turnarounds approved; human face remains readable close up.
- [ ] HUD-free in-game still captures: neutral, moonlit search, lamplit windup, stagger and pursuit.
- [ ] Compare to same-frame prototype shots under identical camera/exposure.
- [ ] Verify skinning under Performance, Balanced and Cinematic graphics.
- [ ] Run a complete **75-second** game; call phone, barricade, encounter enemy, survive/restart.
- [ ] Verify failure when player doesn't call; verify first aid/power still work.
- [ ] `npm run check`, `npm run check:assets`, `npm run build`, Chrome/WebGL smoke tests all green.
- [ ] Measure frame time, triangles, draw calls and texture memory on representative non-flagship hardware.
- [ ] Rate character at least **4/5 average** on believability, silhouette, lighting, animation, material quality and performance; no below 3/5.
- [ ] Mark manifest entry **active** only after reviewer approval and completed QA; don't merge `main` without permission.

**Deliverable:** approved in-game visual replacement and complete source assets.
**Reject if:** silhouette quality is only evident in Blender renders, not in gameplay.

## Stop and rollback rules

On any failed export, unreadable face, broken animation, invalid GLB, significant FPS regression, unreachable enemy state or mistimed damage, keep the *existing* legacy intruder active and revert candidate changes without touching `main`.

**Current status:** the parametric skinned v2 GLB, 37 bones, 12 actions, embedded PBR maps and guarded game integration exist. A Blender artist-quality sculpt and actual `.blend` source do not; the provided Blender import script is not yet executed. Visual acceptance gates remain open. The original is still accessible via `?intruder=legacy`.
