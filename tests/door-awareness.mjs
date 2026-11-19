import assert from 'node:assert/strict';
import {createDoorState,doorBlockers,doorNear,openDoor,BEDROOM_DOOR} from '../src/game/DoorState.js';
import {canOccupy,APARTMENT_BLOCKERS} from '../src/game/CombatMath.js';
import {findNavigationPath,navigateStep} from '../src/game/NavGrid.js';
const door=createDoorState();
assert.equal(doorBlockers(door).length,1);
assert.equal(doorNear({x:BEDROOM_DOOR.x,z:BEDROOM_DOOR.z}),true);
assert.equal(canOccupy(BEDROOM_DOOR.x,BEDROOM_DOOR.z,.18,
  [...APARTMENT_BLOCKERS,...doorBlockers(door)]),false);
assert.equal(openDoor(door,true),true);
assert.equal(door.forced,true);
assert.equal(doorBlockers(door).length,0);
assert.equal(openDoor(door),false);
const from={x:-.6,z:-.8},to={x:.45,z:-.8};
const path=findNavigationPath(from,to,[...APARTMENT_BLOCKERS,...doorBlockers(door)]);
assert.ok(path.length>0,'door-open route must be traversable');
const next=navigateStep(from,{x:-.5,z:-.8},1,.1,APARTMENT_BLOCKERS);
assert.ok(next.x>from.x);
console.log('Door state, open passage collision and dynamic navigation passed');
