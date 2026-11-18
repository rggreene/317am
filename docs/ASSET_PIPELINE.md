# Blender → Browser asset pipeline

## Source and delivery

- Keep editable Blender sources in `assets/source/` when introduced
- Export optimized `.glb` runtime models into `assets/models/`
- Prefer descriptive lowercase filenames, such as `frying_pan.glb`
- Use relative paths for runtime loading; never embed personal machine paths

## Conventions

- Metric units: 1 Blender unit = 1 meter
- Consistent forward/up conventions; confirm orientation in the browser
- Apply mesh scale and rotation before export
- Put model origins at intended interaction pivots
- Separate visual meshes from simplified collision primitives
- Avoid unnecessary materials, very large textures and excessive mesh splits
- Use glTF-compatible PBR materials and test in the target WebGL renderer

## Animated actors

- Use named actions: `idle`, `walk`, `attack`, `stagger`
- Confirm skeleton weights, animation names and export before integration
- Keep collision/hit volumes independent of detailed visual geometry
- Test interpolation, animation blending and frame times

## Practical constraints

The current v0.4 WebGL renderer does not yet directly support GLB skeletal animation. Prototype loading in a feature branch; do not replace the working baseline until gameplay parity and performance tests pass.

Large binary asset collections may warrant Git LFS. Ignore Blender backup files, but **do not ignore .blend source files**.
