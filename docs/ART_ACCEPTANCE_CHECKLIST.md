# Art Revision — Acceptance Checklist
**Purpose:** use alongside [Art Revision Plan](ART_REVISION_PLAN.md) and `assets/asset-manifest.json`.

The new files listed in the manifest are **planned**, not already shipped. Mark progress with the manifest's `status` values: `planned` → `modeling` → `exported` → `in_review` → `active`. Use `blocked` when a specific blocker must be resolved.

## Gate A0 — export, runtime integration and fallback

- [ ] Baseline Balanced preset: record screenshot and FPS in original alpha
- [ ] GLB export has correct world scale and pivot in **meters**
- [ ] Import into Three.js; inspect silhouette and surface response, not only GLTFLoader success
- [ ] Render neutral / warm / blue light variations to inspect normals, specular and texture seams
- [ ] Missing GLB produces fallback mesh or clear warning; does not blank the room
- [ ] `main` and original procedural GLBs remain unchanged
- [ ] Note geometry tris, mesh count, material count, texture count/resolution, download size
- [ ] Ensure no license/provenance ambiguity for imported art or reference textures

## Gate A1 — living room furniture

- [ ] Sofa cushions have realistic depth, seam direction and compression, not rounded-box geometry
- [ ] Sofa legs and table supports make credible floor contact
- [ ] Coffee-table wood grain aligns with each component's long axis
- [ ] Rugs and upholstery show subtle high-frequency surface response under warm light
- [ ] TV does not bloom unnaturally; power cut still affects visible illumination
- [ ] No duplicated procedural+GLB geometry in the same position
- [ ] Orbit cutaway still shows the room without a floating door
- [ ] First-person player doesn't clip through newly modeled furniture
- [ ] Intruder A* route still works around sofa and table

## Gate A2/A3 — bedroom, utility and environmental props

- [ ] Dressed bed has natural gravity folds; pillow silhouettes read from doorway
- [ ] Dresser still supports visible phone; E interaction position preserved
- [ ] Hall first-aid kit still discoverable and reachable
- [ ] Front door/breaker are properly mounted, not floating in orbit
- [ ] Warm lamp remains convincing with power on/off
- [ ] Curtains and window frames preserve existing visibility
- [ ] Footwear/mail/mug/remote feel intentionally placed, not scattered randomly
- [ ] There are no prominent z-fighting, incorrect face normals or texture seams

## Gate A4 — intruder

- [ ] Front, side and back turnarounds match approved human silhouette
- [ ] Distinct hip, shoulder, elbow and wrist deformation; no grotesque stretch
- [ ] `idle`, `walk`, `attack`, `stagger` are exported and parse in GLTFLoader
- [ ] Body works with both warm practical and cool moonlight
- [ ] Notice/search motion and windup are readable from 2–4 m away
- [ ] Attack timing matches ThreatBrain windup; hit occurs only after anticipation
- [ ] Stagger interrupts windup; no stuck animation after recovery
- [ ] Feet do not slide severely during patrol or pursuit
- [ ] Skinned mesh bounds/visibility behave correctly in the scene

## Gate A5 — first-person hands

- [ ] Palm/finger shapes contact pan grip in rest and active swing poses
- [ ] Sleeves connect naturally to wrists, including during follow-through
- [ ] No severe viewmodel clipping, missing normals or floating gloves
- [ ] Crosshair stays clear when the weapon is idle
- [ ] Existing .76-second swing / .41 impact phase still match gameplay hit tests
- [ ] Weapon visual hit-stop does not freeze survival timer

## Gate A6 — final cohesive review

- [ ] Same camera positions and exposure for before/after
- [ ] 1280×720 and 1920×1080 Balanced screenshots
- [ ] Also inspect Performance preset to ensure important silhouettes survive reduced shadows
- [ ] Complete 75-second survival loop and restart without console errors
- [ ] `npm run check`, `npm run check:assets`, `npm run build` and Chrome/WebGL smoke pass
- [ ] Measure performance on a non-flagship GPU before declaring universal 60 FPS
- [ ] `assets/asset-manifest.json` statuses reflect what actually shipped
- [ ] Reviewer agrees the *first-person* environment looks substantially improved

## Required capture filenames

Store dated review screenshots as CI artifacts or clearly named development images, not as substitute proof of art completion:

```text
artreview_livingroom_orbit_balanced.png
artreview_livingroom_firstperson_balanced.png
artreview_entry_breaker_balanced.png
artreview_intruder_moonlit_idle.png
artreview_intruder_lamplit_windup.png
artreview_viewmodel_idle.png
artreview_viewmodel_contact.png
```

## Stop conditions

Stop or revert an art substitution if it breaks gameplay navigation, hides an objective, loses an animation clip, produces major shading artifacts, or materially degrades the Balanced preset without a corresponding visible benefit. A green automated build is necessary but not sufficient.
