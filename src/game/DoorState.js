// A prototype interior door across the open bedroom-divider passage.
// The exterior entry remains a scripted breach, not a traversable portal.
export const BEDROOM_DOOR={id:'bedroom-door',x:-.12,z:-.78,
  blocker:{minX:-.27,maxX:.04,minZ:-1.12,maxZ:-.43}};
export function createDoorState(){return {open:false,forced:false};}
export function doorBlockers(door){return door.open?[]:[BEDROOM_DOOR.blocker];}
export function doorNear(position,range=.8){
  return Math.hypot(position.x-BEDROOM_DOOR.x,position.z-BEDROOM_DOOR.z)<range;
}
export function openDoor(door,forced=false){
  if(door.open)return false;
  door.open=true;door.forced=forced;
  return true;
}

// Stand on the same side of the door as the actor before forcing it.
// Keeping the approach clear of the closed leaf avoids A* selecting an
// unreachable target inside the collision volume.
export function doorApproach(position){
  return {x:position.x<BEDROOM_DOOR.x?-.57:.43,z:BEDROOM_DOOR.z};
}
export function doorBlocksRoute(from,to,door){
  if(door.open)return false;
  const box=BEDROOM_DOOR.blocker;
  const dx=to.x-from.x,dz=to.z-from.z;
  let near=0,far=1;
  for(const [start,delta,min,max] of [
    [from.x,dx,box.minX,box.maxX],
    [from.z,dz,box.minZ,box.maxZ]
  ]){
    if(Math.abs(delta)<1e-9){if(start<min||start>max)return false;continue;}
    const t1=(min-start)/delta,t2=(max-start)/delta;
    near=Math.max(near,Math.min(t1,t2));
    far=Math.min(far,Math.max(t1,t2));
    if(near>far)return false;
  }
  return true;
}
