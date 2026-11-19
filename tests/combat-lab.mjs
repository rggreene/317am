import assert from 'node:assert/strict';
import {swingPose,SWING_DURATION,IMPACT_PHASE,isMeleeHit,canOccupy,moveWithCollision} from '../src/game/CombatMath.js';

for(const t of [0,.2,.41,.44,.63,1]){
  const p=swingPose(t);
  assert.ok(Object.values(p).every(Number.isFinite));
}
assert.deepEqual(swingPose(0),swingPose(1),'swing must recover to neutral pose');
assert.ok(swingPose(.44).roll<-0.8,'impact requires forceful follow-through');
assert.ok(SWING_DURATION>.5&&SWING_DURATION<1.2);
assert.ok(IMPACT_PHASE>.2&&IMPACT_PHASE<.7);
const position={x:.05,y:1.64,z:1.70};
const target={x:.28,y:1.43,z:-.38};
assert.equal(isMeleeHit(position,{x:0,y:-.08,z:-1},target),true,'target should be hittable from start');
assert.equal(isMeleeHit(position,{x:0,y:0,z:1},target),false,'hit behind player');
assert.equal(isMeleeHit({...position,z:2.3},{x:0,y:0,z:-1},target),false,'target out of range');
assert.equal(canOccupy(.05,1.70),true,'first person spawn must be valid');
assert.equal(canOccupy(1.3,1.2),false,'sofa must block player');
const slide=moveWithCollision(.05,1.70,.50,0);
assert.equal(slide.x,.05,'player cannot enter sofa');
const allowed=moveWithCollision(.05,1.70,0,-.20);
assert.ok(allowed.z<1.70,'free walking must work');
console.log('First-person melee math and movement checks passed');
