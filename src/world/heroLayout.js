// Source-of-truth coordinates for the hero area and its inspection viewpoints.
// The obstacle envelopes correspond to current CombatMath approximate blockers;
// keep these dimensions compatible until production collision meshes are built.
export const HERO_LAYOUT=Object.freeze({
  room:{width:6.55,depth:5.48,wallHeight:2.85},
  sofa:{x:1.50,z:1.26,width:2.00,depth:.91},
  coffeeTable:{x:1.49,z:.17,width:1.15,depth:.64},
  tv:{x:1.60,z:-2.17,width:1.30},
  kitchenCounter:{x:2.18,z:-.75,width:.95},
  fridge:{x:2.78,z:-1.65,width:.76},
  intruder:{x:.28,z:-.38},
  spawn:{x:.05,z:1.70}
});
export const HERO_QUALITY=Object.freeze({
  "furniture":"rounded seats and upholstered cushions, legged tables, framed TV",
  "architecture":"openings, mullions, trim, baseboards, doorway, wall fixtures",
  "materials":"shared deterministic procedural wood, fabric and wall albedo",
  "storytelling":"mug, mail, shoes, photographs, throw, cables, book and plant",
  "lighting":"warm living lamp, cool window moonlight and low television spill"
});
