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

## Not yet implemented

- The old first-person controller, combat, scavenging, enemy AI, phone, barricade, first aid, or win/loss state.
- Authored Blender models, skeletal animation clips, or multiplayer.
- Automated visual-performance benchmark across target hardware.

## Next milestone

1. Import an optimized Blender frying pan as .glb and confirm scale, pivot and materials.
2. Test imported humanoid animation clips (idle/walk/attack/stagger).
3. Restore the Nightfall gameplay loop behind the new renderer, one system at a time.
4. Verify real-hardware performance and parity before considering merge to main.

## Guidance

Do **not** deploy this lab to the existing public Netlify site in place of the v0.4 game. To preview it, use `npm run dev` or Netlify's branch preview.
