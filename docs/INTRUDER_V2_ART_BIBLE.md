# The Uninvited v2 — Character Art Bible
**Project:** 3:17 AM · **Discipline:** Character art, costume and performance
**Version:** v2.0 direction lock · **Stage:** Design/production package, **not an exported character**
**Technical companion:** [Blender/GLB Spec](INTRUDER_V2_BLENDER_GLB_SPEC.md)
**Acceptance:** [Production Checklist](INTRUDER_V2_PRODUCTION_CHECKLIST.md)
**Machine-readable contract:** [intruder-v2.contract.json](../assets/characters/intruder-v2.contract.json)

## The creative thesis

*There is a man in your living room, and he is listening.*

The Uninvited is a plausible home intruder. He is frightening because he behaves as though the apartment is familiar to him and as though he has the patience to wait, not because he has supernatural features, special armor or a theatrical villain silhouette. His face remains recognizably human under the hood. Avoid gore or theatrical jump-scare makeup. Nothing in his design confirms whether he is desperate, practiced or simply dangerous. That ambiguity belongs to the player's imagination.

**Design target:** grounded stylized realism, physically constructed clothing, visibly human weight distribution, emotionally cold restraint. He must pass the “ordinary man at the wrong hour” test at 4 meters and reveal troubling detail at 1 meter.

### Fixed production choices

| Attribute | Approved v2 direction |
| --- | --- |
| Identity | Adult human male, no supernatural reveal in this prototype |
| Perceived age | 32–42; tired, weathered adult without elderly fragility |
| Height | **1.90 m** including boots; slightly tall and imposing in our small room |
| Overall bounding box | ~0.73 m wide × 1.90 m high × 0.52 m deep, feet on floor |
| Build | Lean, sinewy, slightly narrow waist; shoulders present but never powerlifter-broad |
| Posture | Weight on back foot; head a touch forward, shoulder line subtly uneven |
| Clothing | Charcoal work jacket with soft hood, dull dark tee, tapered work trousers, gloves, scuffed boots |
| Face | Partly shadowed forehead and eyes; visible nose, mouth, chin, ears; no mask |
| Primary readable gesture | Unhurried head turn, small breath, shoulder tension before strike |
| Primary emotional effect | “That is a real person. He is aware of me.” |

The intruder is not a zombie, masked slasher, soldier, supernatural revenant or robotic assassin. There is no neon glow, glowing iris, exaggerated jaw, gas mask, tactical harness, blood-soaked shirt, costume logo or polished high-tech gear.

## Form language and silhouette

We need three coherent silhouettes, not one shape with brighter textures:

1. **At the doorway (4–5 m):** human proportions, hood shaping the head but **not** forming a spherical helmet. Jacket hem interrupts the trouser silhouette. The shoulders sit slightly off-level. Arms hang close to the body, one hand a few centimeters forward.
2. **Searching (2–4 m):** head rotates before torso. Neck and face must be distinctly visible between collar and hood. Weight shifts onto a planted foot and pauses. Soft jacket material compresses at elbow and flank.
3. **Windup (1–2 m):** rear hand and shoulder travel backward; the torso counter-rotates; elbow breaks the silhouette. Player can read a threatening motion even if the HUD is hidden. No spinning attack or huge Hollywood windup.

**Human proportions:** boots grounded and sized for actual feet; knees near natural leg proportions; elbows around waist height; wrists approximately at upper-thigh level when arms rest. The current 12-bone prototype is not a proportion reference. Prefer an A-pose with relaxed, natural clavicle placement for authoring.

**Intentional asymmetry:** one jacket sleeve has a repaired outer elbow; the left shoulder drapes lower; a pocket closure is slightly uneven; one boot is more worn around the toe. Every asymmetry should have an ordinary explanation. Do not put all the storytelling on a dramatic scar.

## Face and head treatment

The face should remain mostly legible when the intruder crosses warm lamplight. Shape: longish but **not** skeletal, modest nose bridge, restrained brow, naturally uneven lips, slightly tired under-eye contours, believable ears. The lower face is exposed. The hood is made of draping cloth with a softened peak and separate side panels, not a rigid sphere, visor or deep black void.

For the eyes: natural sclera/iris; low reflective response from a practical light only, with **zero magical emissive glow**. Keep expression reserved. No snarling teeth or exaggerated scowl. The most frightening frame is a neutral face pausing, as if listening.

**Five facial readability checks:** front in neutral light; 3/4 in warm light; profile with hood; neutral moonlight from behind; eyes visible at 1.5 m under low light. If the face disappears completely into a black mass, lighten the adjacent fabric and rebalance the light before adding unrealistic eye illumination.

## Costume build

### Outer jacket — silhouette anchor

- Charcoal faded cotton canvas or heavyweight workwear, **low sheen**.
- Structured enough to show a real shoulder and collar, soft enough to wrinkle at elbow and abdomen.
- Hip-length with a slightly uneven jacket hem; jacket opens a little at the center front.
- Zipper tape and teeth visible up close, muted gunmetal rather than chrome.
- Worn elbow repair on **left** arm, subtle fraying on the pocket edge, slightly flattened fold at right cuff.
- Avoid perfectly symmetrical sewn panels; avoid a high-volume hood that swallows the entire skull.
- Sleeves must deform through 90° elbow flexion without hard kinks or floating cuffs.

### Base layer, trousers, gloves, boots

- Underlayer: faded graphite or navy cotton tee; glimpsed at neck and jacket opening, no graphic.
- Trousers: tapered practical dark work pants; real crotch/knee folds, knee shaping, seams aligned to garment pattern.
- Gloves: thin weathered leather or work gloves; recognizable thumb, palm and knuckles. These must remain readable in an attack pose.
- Boots: used work boots with rubber soles and modest toe scuffs, not combat exoskeletons. Sole can touch the floor without z-fighting.
- Small details: plain worn buckle and quiet stitch variation. **No knives, firearms or trophies in his costume** for this version. His immediate threat is his body/behavior.

### Color and value palette

| Surface | Base albedo target | Character |
| --- | --- | --- |
| Work jacket | `#343C40` | Cool charcoal; faded pressure points |
| Hood / liner | `#242A2E` | Dark but not a total silhouette void |
| Underlayer | `#424A4B` | A slightly warmer midtone under collar |
| Trousers | `#2B3031` | Lower contrast than the jacket |
| Gloves | `#292A29` | Leather dark brown-black |
| Boots | `#292625` | Scuffed warm charcoal |
| Face | `#67524A` | Lighting-adjustable reference, not a fixed complexion requirement |
| Frayed thread | `#666F6C` | Sparse accent, never a bright piping outline |
| Hardware | `#646762` | Aged, desaturated, rough metal |

These are **art-direction swatches**, not a mandate to paint every pixel a solid RGB value. Build micro-variation with material maps, seam wear and realistic occlusion. Texture photographs or scans must be original or properly licensed.

## Surface grammar

Every material tells a different story at grazing light:

- **Cotton jacket:** broad rough fabric weave, subtle fiber direction, pressure-polished cuff edges, soft normal intensity. No uniform noise filter over the entire character.
- **Cotton tee:** finer weave and low contrast; limited to neckline or jacket gap.
- **Leather gloves:** slightly smoother than jacket; isolated crease sheen at knuckles and cuff, not wet vinyl.
- **Boot leather/rubber:** worn matte toes, soft edge highlight, a thin dirt band around sole only.
- **Face:** much subtler micro-normal than clothing; retain cheek/nose planes at 720p.
- **Metal:** selective small metallic glints on zipper/buckle. Don't let it overpower the head.

Primary atlas: up to 2048 px for jacket/trousers; face 1024 px; gloves/boots 1024 px; trim 512 px. Prefer packed occlusion/roughness/metallic maps, basecolor sRGB and normal/ORM as linear data. No emission for eyes.

## Performance grammar: fear through restraint

**Idle:** breathing is near-invisible; a sleeve and upper torso shift before the head moves. Hold asymmetry. No idle bobbing as though dancing.

**Listen:** stop moving; head turns a few degrees, waits 0.5–1.2 sec; pelvis stays planted. This is not a looping “AI search” gesture played every second.

**Search:** the intruder scans where he believes the player was, not the player's current location when undetected. Weight change, small pauses, two-step walk. Avoid the exact same step cadence every time.

**Notice:** hesitation before commitment. A slight lift of the chin and shoulder tightening is more unsettling than instant sprinting.

**Pursue:** controlled forward lean and longer stride; gait is purposeful, not a cartoon zombie run. Feet and knees should plant correctly.

**Windup → strike:** visible, readable shoulder and torso preparation. The player's response window is **0.82 seconds** in the current game. A successful hit is adjudicated at the **actual visible contact frame**, not the first frame of the attack clip (see engineering mismatch below).

**Stagger:** one-foot catch and asymmetric recoil; hands and shoulders react, spine doesn't rubber-band. Never launch him into exaggerated ragdoll slapstick.

**Recover:** regain stance slowly, reset balance before a new swing. Silence and stillness matter.

## Animation and audio coupling

- Cloth creak only when a visible fold changes; footsteps align to planted foot frames.
- At rest: one very quiet inhale, occasional clothing movement; never a loud omnipresent “enemy theme.”
- Windup: a short sleeve pull + shift of boot pressure, not a jump-scare sting.
- Strike: restrained fast movement, controlled thump only on actual contact with player or environment.
- Stagger: boots scrape and a quiet breath, not a screech.

The existing game has synthesized audio as a prototype; this describes eventual authored Foley, not files already delivered.

## Non-negotiable technical truths

Our current runtime has a **12-bone procedural GLB** plus manually attached art. The v2 candidate calls for **37 named rig joints** (36 deform + a nondeforming Root), cleaner weighting and a distinct character GLB. The legacy controller currently assumes four clip names: `idle`, `walk`, `attack`, `stagger`.

**Known combat timing issue to fix during integration:** `ThreatBrain` ends a 0.82 s windup and signals damage as `NightDirector` starts the `attack` clip. The v2 package defines a later contact pose, **0.18 s into that attack animation**. Implement a one-shot pending-hit/contact event and resolve damage *then*, including dodge and stagger checks. Do not ship the v2 strike as “synced” until a test proves this.

The design, rig and animation contract are in [the exact technical specification](INTRUDER_V2_BLENDER_GLB_SPEC.md).

## Reference / concept-sheet deliverables

Produce **one consistent character, not four attractive variations**. All views should share jacket wear, repaired left elbow, face proportions and scuffed boots.

1. **Orthographic front, neutral A-pose:** full body, 1.90 m proportion line, face visible, jacket zipper and glove silhouettes.
2. **Orthographic left + right profile:** hood construction, forward neck angle, garment thickness and heel-to-toe boot silhouette.
3. **Orthographic back:** jacket hem, repair patch, center-back seams and trouser fit.
4. **3/4 face closeup:** neutral under-eye expression, natural nose/lips and hood framing, warm soft light.
5. **In-game key art:** still intruder at far end of a modest residential hallway at night, warm practical lamp on one side and moonlit spill on the other.
6. **Four action keys:** listen, slow search, anticipated windup and stagger.
7. **Material swatches:** jacket, liner, skin, gloves and boots with roughness notes and one UV layout example.

Concept sheet image-generation brief (for *reference only*, not a mesh deliverable):

> Full-body character concept reference of a plausible adult male home intruder for a grounded, stylized-realistic indie survival horror game. Lean, slightly tall human proportions, weathered face partly visible beneath a soft charcoal work-jacket hood, natural eyes, fitted dark work trousers, worn gloves and work boots. One repaired left elbow; no mask, no weapons. Four orthographic views of the SAME person, consistent clothing and scale, clean neutral reference lighting, accurate human construction, front and back silhouettes, restrained weathering and realistic materials.

Avoid in concept references: helmet, military tactical suit, zombie skin, skull mask, glowing eyes, exaggerated scars, over-muscular shoulders, layered sci-fi armor, bright neon piping, fantasy monster anatomy, duplicate subjects, mismatched clothing across views.

## Approval rubric

Score each 1–5 in the actual game viewport: **human believability, silhouette readability, material credibility, animation anticipation, pose/weight, low-light face readability, performance**. A model must average **≥4** with no category below **3** at first-person gameplay distance before status changes from `in_review` to `active`. Subjective review is required even if every CI test passes.

**This document is a production art bible only. No v2 GLB, Blender source, texture maps or professional animation has been created by writing it.**
