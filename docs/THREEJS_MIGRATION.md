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

## Milestone 4: first-person melee presentation lab

- Press **V** (or the top-right button) to enter first-person practice; press **V** again to return to orbit. Existing GLB pan and intruder inspection shortcuts remain in orbit mode.
- Click the game canvas once to request pointer lock; then move the mouse to aim, **WASD** to move, **Shift** to move faster, and left click to swing the imported frying pan.
- A camera-attached viewmodel draws **proxy sleeves and gloved hands**, plus a second instance of our existing GLB frying pan. These are not skinned, motion-captured human hands.
- The weapon swing uses animation phases (anticipation, impact, follow-through, recovery), simulated look sway and walking bob, plus subtle synthetic audio.
- Strikes use **distance and view-angle checks**. If within range, the intruder GLB plays its **stagger** clip; otherwise the UI displays a miss. This is **one hit-feedback mechanic**, not the old combat system or damage/health simulation.
- Prototype collision bounds prevent walking through most large furniture. They are approximations, not full collision meshes.
- Math behavior is covered by `npm run test:combat`; syntax and production build by GitHub Actions.
- The original playable v0.4 Nightfall remains on `main` and is not replaced by this lab.

## Milestone 5: impact quality pass

- **Direction-aware recoil:** the actor slides briefly away from the player and leans about a hip pivot; response is spring-damped back toward the base position. The stagger GLB clip still plays.
- **Handle-attached grip:** two glove proxies now stay attached to the pan handle and the sleeves connect to their wrists (still not authored/skinned hand art).
- **Hitstop and camera response:** a 45 ms pause affects only the weapon animation; the rest of the game and render loop continue. A small impulse and contact marker add punctuation.
- **Less forgiving hit checks:** the pan needs to connect within approximately 1.55 m and a narrower facing cone. There is no health, damage, injury, or combat AI yet.
- **Layered synthetic sound:** quieter air movement on swing, soft thud and a short metallic resonance on contact. Audio starts only after browser input.
- Pure impact quality tests: `npm run test:quality`; all checks run in GitHub Actions.
- Presentation polish, **not** a finished melee system. GPU/browser visual playtesting is still needed.

## Milestone 6: environment hero-area overhaul

- Living room and visible hallway receive new modular furnishings: rounded upholstered sofa, separated cushions, blanket, layered rug, coffee table with legs, entertainment console, realistic framed windows and trim.
- Shared material library adds deterministic browser-generated tile textures for laminate wood, fabric and wall paint. These are **procedural albedo texture details**, not photographed high-resolution PBR maps or full normal/roughness maps.
- Details include mug, papers, remote, books, footwear, picture frames, houseplant, switches and vents. They remain decorative in this visual lab.
- Lighting now includes a visible warm living-room floor lamp, cool moonlit/window spill and subdued TV glow; G still toggles the lighting balance.
- The existing first-person spawn, frying-pan asset, intruder demo and major collision envelopes are preserved. Collision remains approximate rather than matching every new decorative mesh.
- `tests/environment-smoke.mjs` imports the room with a tiny fake canvas, verifies the hero-area geometry/materials and checks scene assembly under Node (no actual WebGL rendering).
- The environment is a **higher-quality procedural prototype**, not yet a fully authored photorealistic Blender environment. Visual validation on the user's GPU remains necessary.

## Not yet implemented

- The original full gameplay loop (scavenging, enemy AI, phone, barricade, first aid, health/damage, win/loss state). First-person movement and a limited melee feedback test are in this visual sandbox.
- Final Blender-authored character art, mocap-quality animations, or multiplayer. The demonstration GLB contains four skeletal clips.
- Automated visual-performance benchmark across target hardware.

## Next milestone

1. Playtest the new hero-area geometry, window light, upholstery and first-person sightlines on a GPU-backed desktop browser.
2. Introduce authored Blender character and hands, with adjusted first-person grip and skeletal animation.
3. Connect original enemy navigation, item interactions, phone and survival loop to the Three.js renderer.
4. Run real-device performance and gameplay-parity checks before merging into `main`.

## Guidance

Do **not** deploy this lab to the existing public Netlify site in place of the v0.4 game. To preview it, use `npm run dev` or Netlify's branch preview.

## Vertical Slice Alpha (branch `feature/vertical-slice-alpha`)

- New timed 75-second playable session: **E** to call dispatch, barricade, switch breaker, and use a single first-aid kit.
- Dynamic intruder entry and A* grid navigation. A reinforced door delays entry.
- Hostile actor can hurt the player at close range; successful pan hits stun the intruder. Death and survival screens are included.
- Synthetic atmosphere: room hum, footsteps, phone, barricade and impact feedback (no autoplay audio).
- This is a compact survival demonstration, **not full parity** with Nightfall v0.4 on `main`. The visual lab remains available.
- Controls: **V** first-person/orbit; **WASD**, Shift, left click pan, **E** interact, **N** restart after game over, **M** mute, Esc release mouse.
- Performance, physical collision details, visuals and enemy pacing require a real-browser playtest.

## Quality profiles and subtle surface relief

- Press **P** to cycle **Balanced**, **Cinematic**, and **Performance** quality profiles.
- Profiles adjust internal resolution and shadow-map cost; **Performance** disables cast shadows for a lower GPU workload.
- Three.js procedural fabric, laminate and paint now include subtle generated surface-height bump maps. These are not substitutes for artist-authored scanned PBR textures.
- `npm run test:rendering` checks quality profiles without creating a WebGL context.
- Cinematic is optional and can be noticeably more expensive, particularly on high-resolution screens.

## Browser screenshot review refinements

- Right wall and its attached door/breaker fixtures are hidden in orbit but restored for first-person navigation.
- Viewmodel pan and sleeves are slightly smaller, positioned lower/right, and locally lit with less intensity to keep the reticle visible.
- Practical lights and ambient exposure have been reduced modestly in the moody lighting preset.
- Survival HUD was separated vertically from the header to prevent overlap; FPS meter now stays hidden unless requested.
- FPS telemetry uses actual wall-frame duration, not capped physics delta.
