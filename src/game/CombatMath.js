// All calculations are deliberately renderer-agnostic for fast Node tests.
const SWING_FRAMES = [
  { t: 0,    x: 0,     y: 0,    z: 0,     pitch: 0,    yaw: 0,    roll: 0 },
  { t: 0.20, x: 0.10,  y: -0.05,z: 0.09,  pitch:-0.23,yaw: 0.27,roll: 0.46 },
  { t: 0.44, x:-0.30,  y: 0.18, z: 0.22,  pitch: 0.39,yaw:-0.54,roll:-1.18 },
  { t: 0.63, x:-0.24,  y: 0.08, z: 0.13,  pitch: 0.30,yaw:-0.40,roll:-0.98 },
  { t: 1,    x: 0,     y: 0,    z: 0,     pitch: 0,    yaw: 0,    roll: 0 }
];

export const SWING_DURATION = 0.76;
export const IMPACT_PHASE = 0.41;
export const PLAYER_RADIUS = 0.18;
export const PLAYER_BOUNDS = Object.freeze({ minX:-2.96, maxX:2.96, minZ:-2.34, maxZ:2.36 });

// Coarse gameplay-prototype blockers, not the production physics system.
// Coordinates are world XZ AABBs; the floor mesh remains rendered separately.
export const APARTMENT_BLOCKERS = Object.freeze([
  { minX:-2.88, maxX:-0.98, minZ:-2.44, maxZ:-0.22 }, // bed
  { minX:-3.15, maxX:-2.42, minZ:1.18, maxZ:1.80 }, // dresser
  { minX:-0.30, maxX:0.06, minZ:-2.64, maxZ:-1.20 }, // divider
  { minX:0.39, maxX:2.65, minZ:0.73, maxZ:1.82 }, // sofa
  { minX:0.78, maxX:2.12, minZ:-0.23, maxZ:0.56 }, // coffee table
  { minX:1.64, maxX:3.26, minZ:-2.54, maxZ:-0.36 } // counters / fridge
]);

const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function swingPose(phase){
  const t=clamp(phase,0,1);
  let i=0;
  while(i<SWING_FRAMES.length-2 && t>SWING_FRAMES[i+1].t)i++;
  const a=SWING_FRAMES[i], b=SWING_FRAMES[i+1];
  const alpha=smooth((t-a.t)/(b.t-a.t));
  return {
    x:lerp(a.x,b.x,alpha),y:lerp(a.y,b.y,alpha),z:lerp(a.z,b.z,alpha),
    pitch:lerp(a.pitch,b.pitch,alpha),yaw:lerp(a.yaw,b.yaw,alpha),roll:lerp(a.roll,b.roll,alpha)
  };
}

export function canOccupy(x,z,radius=PLAYER_RADIUS,blockers=APARTMENT_BLOCKERS){
  if(x<PLAYER_BOUNDS.minX+radius||x>PLAYER_BOUNDS.maxX-radius||
     z<PLAYER_BOUNDS.minZ+radius||z>PLAYER_BOUNDS.maxZ-radius)return false;
  for(const box of blockers){
    if(x>box.minX-radius&&x<box.maxX+radius&&
       z>box.minZ-radius&&z<box.maxZ+radius)return false;
  }
  return true;
}

// Separate axes permit smooth sliding along furniture and walls.
export function moveWithCollision(x,z,dx,dz,radius=PLAYER_RADIUS,blockers=APARTMENT_BLOCKERS){
  const nx=x+dx;
  if(canOccupy(nx,z,radius,blockers))x=nx;
  const nz=z+dz;
  if(canOccupy(x,nz,radius,blockers))z=nz;
  return {x,z};
}

export function isMeleeHit(position,direction,target,maxDistance=2.65,minFacingDot=0.77){
  const dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z;
  const distance=Math.hypot(dx,dy,dz);
  if(distance<0.01 || distance>maxDistance)return false;
  const dlength=Math.hypot(direction.x,direction.y,direction.z)||1;
  const facing=(dx*direction.x+dy*direction.y+dz*direction.z)/(distance*dlength);
  return facing>=minFacingDot;
}
