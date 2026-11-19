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
