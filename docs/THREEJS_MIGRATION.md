# 3:17 AM — visual overhaul (experimental branch)

## Purpose

The playable v0.4 Nightfall game remains on `main`. This branch is a **visual lab**, not a drop-in gameplay replacement.

## Local setup

Use Node.js 22 (or a compatible current LTS).

```sh
npm install
npm run dev
npm run build
```

Run `npm run check` for JavaScript syntax checks. Production build output is `dist/`.

## Implemented

- Vite + Three.js, modular ES modules and a static Netlify build configuration.
- One cutaway apartment preview: material colors, trim, clutter, moonlight, lamp, shadows, fog.
- Orbit camera for environment inspection and keyboard controls for lighting / UI.
- Placeholder humanoid with basic procedural motion.
- GLTFLoader / AnimationMixer integration helpers prepared for Blender .glb assets.

## Milestone 2: first GLB asset

- The frying pan is now a real external glTF 2.0 binary: `assets/models/frying_pan.glb`.
- The first model is **procedurally authored**, not a finished Blender art asset. Its source lives in `scripts/generate-pan.mjs`. Replace the GLB with Blender-authored art when ready.
- `src/props/loadFryingPan.js` imports the GLB as a Vite asset URL so production builds include it.
- In the visual sandbox press **E** to inspect the pan, **Escape** to return; orbit with mouse to evaluate material response.
- `npm run check:assets` verifies the GLB structure without any dependencies.
- Real skeletal animation import is still a separate milestone; the intruder is animated procedurally.

## Milestone 3: skinned intruder and animation state machine

- Imported `assets/models/intruder_rig.glb`: a procedurally authored **skinned** glTF 2.0 character (12 joints, six PBR materials).
- Four embedded rig animations: `idle`, `walk`, `attack`, `stagger`. Press **1–4** to preview them. Press **R** for an intruder close-up, **R** again to return.
- `IntruderController` blends animations with `THREE.AnimationMixer`; attack and stagger return to idle when finished.
- The original procedural figure remains as a fallback when the GLB fails.
- Rebuild: `npm run assets:intruder`. Validate: `npm run check:intruder`.
- The rig is a pipeline proof of concept, not a hand-polished Blender model. It does not yet contain navigation or actual combat logic.

## Not yet implemented

- The old first-person controller, combat, scavenging, enemy AI, phone, barricade, first aid, or win/loss state.
- Final Blender-authored character art, mocap-quality animations, or multiplayer. The demonstration GLB contains four skeletal clips.
- Automated visual-performance benchmark across target hardware.

## Next milestone

1. Import an optimized Blender frying pan as .glb and confirm scale, pivot and materials.
2. Test imported humanoid animation clips (idle/walk/attack/stagger).
3. Restore the Nightfall gameplay loop behind the new renderer, one system at a time.
4. Verify real-hardware performance and parity before considering merge to main.

## Guidance

Do **not** deploy this lab to the existing public Netlify site in place of the v0.4 game. To preview it, use `npm run dev` or Netlify's branch preview.
