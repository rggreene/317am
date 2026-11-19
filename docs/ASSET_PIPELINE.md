# Blender → Three.js Art Asset Pipeline

This document covers the current **Three.js/Vite vertical-slice alpha**. The old single-file WebGL2 game is preserved on `main`.

## Files and ownership

```text
assets/
  asset-manifest.json
  source/blender/{furniture,characters,architecture,props}/
  models/{furniture,characters,architecture,props}/
  textures/shared/
```

The folders for future sources/GLBs are a naming convention; their files will only exist after export. Do not confuse planned manifest paths with committed assets. Existing prototype assets `assets/models/frying_pan.glb` and `assets/models/intruder_rig.glb` remain usable until replaced.

- Native editable: `.blend`
- Runtime delivery: optimized glTF binary `.glb`
- Source textures: exported originals and license metadata
- Planned asset registry: `assets/asset-manifest.json`
- Styling and visual standard: `docs/ART_REVISION_PLAN.md`
- Acceptance: `docs/ART_ACCEPTANCE_CHECKLIST.md`

## Export contract

1. **Metric**: one Blender unit equals one meter. Blender Z-up converts to glTF Y-up. Confirm character facing in Three.js rather than assuming export orientation.
2. Apply mesh object transforms as appropriate. No arbitrary negative scales or stray cameras/lights.
3. Furniture pivot at floor center; wall fixtures at their mounting pivot; actor root at floor-level with hips driven by rig; pan at hand grip.
4. Keep the visual mesh separate from collision/navigation volumes. If footprint changes, deliberately revise `CombatMath.js` and nav tests.
5. Build mostly glTF-compatible metallic/roughness PBR materials. Base color = sRGB; normal/ORM = non-color data. Pack occlusion/roughness/metallic when useful.
6. Standard map names: `_basecolor`, `_normal`, `_orm`, `_emissive`. Use texture atlases only if they improve browser performance.
7. Required intruder animation names: `idle`, `walk`, `attack`, `stagger`. Keep windup and stagger timing aligned with the threat state machine.
8. Import via an explicit build-time Vite asset path / manifest mapping. Test missing-file fallback before retiring an old procedural mesh.
9. Measure file size, triangle count, texture dimensions and material count. Do not assume a model is cheap because its download is small.
10. Test under actual scene lights in the target browser, screenshot from gameplay vantage and compare to baseline.

## Recommended review commands

```sh
npm run test:art-manifest
npm run check
npm run check:assets
npm run build
npm run dev
```

After introducing a new GLB, add a GLTFLoader parsing test for it and extend the browser smoke test to assert its presence. Visual review is required even if automated checks pass.

## Preserve provenance and project privacy

Use original authored models or properly licensed purchased/community assets. Record licensing for any externally sourced textures and models. Don't copy proprietary 3D meshes from other games. Do not publish the private repo, branch, or deployment without explicit approval. Avoid committing Blender backups, caches, huge source renders, or generated previews unnecessarily.

Compression (KTX2 / meshopt / Draco) is **optional** until the corresponding browser loaders and CI tests are installed. Do not export compressed assets into a runtime that cannot decode them.
