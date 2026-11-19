import assert from 'node:assert/strict';
import {intruderPose} from '../src/actors/IntruderPose.js';
const idle=intruderPose('idle',0,0);
const search=intruderPose('search',0,1.0);
const pursue=intruderPose('pursue',0,.2);
const early=intruderPose('windup',0,.4);
const late=intruderPose('windup',1,.4);
assert.ok(Object.keys(idle).length>=5);
assert.ok(Math.abs(search.Head[1])>Math.abs(idle.Head[1]),'head scan should grow while searching');
assert.ok(pursue.Spine[0]<idle.Spine[0],'pursuit should have forward lean');
assert.ok(late.Shoulder_R[0]<early.Shoulder_R[0]-.8,'late windup must raise shoulder dramatically');
assert.deepEqual(intruderPose('stagger',.8,1),{},'one-shot stagger owns its animation');
assert.deepEqual(intruderPose('attack',1,1),{},'native attack clip owns its pose');
for(const t of [-1,0,.5,1,3]){
  for(const offsets of Object.values(intruderPose('windup',t,2))){
    assert.ok(offsets.every(Number.isFinite),'pose offsets cannot contain NaN');
    assert.ok(offsets.every(x=>Math.abs(x)<Math.PI),'pose offsets too large');
  }
}
console.log('Intruder intent poses and readable windup direction passed');
