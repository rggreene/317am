// Lightweight XZ occlusion shared by stealth and sound; renderer-independent.
import {APARTMENT_BLOCKERS} from '../game/CombatMath.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function segmentIntersectsBox(a,b,box,padding=0){
  const dx=b.x-a.x,dz=b.z-a.z;
  let near=0,far=1;
  for(const [start,delta,min,max] of [
    [a.x,dx,box.minX-padding,box.maxX+padding],
    [a.z,dz,box.minZ-padding,box.maxZ+padding]
  ]){
    if(Math.abs(delta)<1e-9){if(start<min||start>max)return false;continue;}
    const t1=(min-start)/delta,t2=(max-start)/delta;
    near=Math.max(near,Math.min(t1,t2));
    far=Math.min(far,Math.max(t1,t2));
    if(near>far)return false;
  }
  return true;
}
export function obstructionCount(a,b,blockers=APARTMENT_BLOCKERS){
  return blockers.reduce((n,box)=>n+(segmentIntersectsBox(a,b,box)?1:0),0);
}
export function sightClear(a,b,blockers=APARTMENT_BLOCKERS){
  return obstructionCount(a,b,blockers)===0;
}
export function audibleRange(baseRange,a,b,blockers=APARTMENT_BLOCKERS){
  const count=obstructionCount(a,b,blockers);
  return clamp(baseRange*Math.pow(.65,count),0,baseRange);
}
