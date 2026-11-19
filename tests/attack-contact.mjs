import assert from 'node:assert/strict';
import {INTRUDER_CONTACT_SECONDS,beginIntruderStrike,advanceIntruderStrike}
  from '../src/game/AttackContact.js';
import {STRIKE_RANGE} from '../src/game/ThreatBrain.js';

assert.equal(INTRUDER_CONTACT_SECONDS,.18);
let pending=beginIntruderStrike();
let result=advanceIntruderStrike(pending,.05,{distance:.5});
assert.equal(result.event,null);
assert.ok(result.pending.remaining>.1);
result=advanceIntruderStrike(result.pending,.05,{distance:.5});
assert.equal(result.event,null);
result=advanceIntruderStrike(result.pending,.08,{distance:.9});
assert.equal(result.event,'hit','contact must land after exactly 180ms');
assert.equal(result.pending,null,'contact can only apply once');
assert.equal(advanceIntruderStrike(result.pending,1,{distance:0}).event,null);

pending=beginIntruderStrike();
result=advanceIntruderStrike(pending,.1,{distance:1.0});
result=advanceIntruderStrike(result.pending,.08,{distance:STRIKE_RANGE+.30});
assert.equal(result.event,'miss','stepping away before contact must evade damage');

pending=beginIntruderStrike();
result=advanceIntruderStrike(pending,.09,{distance:.5});
result=advanceIntruderStrike(result.pending,.09,{distance:.1,stunned:true});
assert.equal(result.event,'cancelled','pan stagger cancels a queued hit');
assert.equal(result.pending,null);
assert.equal(advanceIntruderStrike(beginIntruderStrike(),.18,{playing:false}).event,'cancelled');

pending=beginIntruderStrike();
for(let i=0;i<17;i++){
  result=advanceIntruderStrike(pending,.01,{distance:STRIKE_RANGE+.01});
  assert.equal(result.event,null);
  pending=result.pending;
}
assert.equal(advanceIntruderStrike(pending,.01,{distance:.7}).event,'hit',
  'ten millisecond updates must give the same contact time');
console.log('Single-hit contact timing, dodge and stagger cancellation passed');
