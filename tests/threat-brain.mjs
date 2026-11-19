import assert from 'node:assert/strict';
import {createThreatBrain,tickThreat,interruptThreat,WINDUP_SECONDS,RECOVERY_SECONDS,STRIKE_RANGE} from '../src/game/ThreatBrain.js';
const enemy={x:0,z:0},player={x:.5,z:0};
const brain=createThreatBrain();
let output=tickThreat(brain,{dt:.05,enemy,player});
assert.equal(output.mode,'windup','close player must get a warning, not instant damage');
assert.equal(output.telegraph,true);
assert.equal(output.strike,false,'proximity should not directly cause damage');
for(let i=0;i<Math.floor(WINDUP_SECONDS/.05)-1;i++){
  output=tickThreat(brain,{dt:.05,enemy,player});
  assert.equal(output.strike,false,'damage must wait for windup');
}
output=tickThreat(brain,{dt:.1,enemy,player});
assert.equal(output.strike,true,'windup should produce a single actual strike');
for(let i=0;i<Math.floor(RECOVERY_SECONDS/.05);i++){
  output=tickThreat(brain,{dt:.05,enemy,player});
  assert.equal(output.strike,false,'must recover before the next attempt');
}
const dodger=createThreatBrain();
tickThreat(dodger,{dt:.05,enemy,player});
for(let i=0;i<14;i++)tickThreat(dodger,{dt:.05,enemy,player:{x:5,z:0}});
output=tickThreat(dodger,{dt:.2,enemy,player:{x:5,z:0}});
assert.equal(output.strike,false,'a player who retreats can evade the swing');
const stunned=createThreatBrain();
tickThreat(stunned,{dt:.02,enemy,player});
interruptThreat(stunned);
output=tickThreat(stunned,{dt:.05,enemy,player});
assert.equal(output.strike,false);
assert.equal(output.mode,'staggered','a pan hit cancels an attack windup');
const stalk=createThreatBrain();
output=tickThreat(stalk,{dt:.05,enemy:{x:2.6,z:2},player:{x:-2,z:-2}});
assert.equal(output.mode,'search');
output=tickThreat(stalk,{dt:.05,enemy:{x:2.6,z:2},player:{x:-1,z:2},moving:true,running:true});
assert.equal(output.mode,'pursue','running can be heard farther away');
const last={...output.goal};
output=tickThreat(stalk,{dt:.05,enemy:{x:2.6,z:2},player:{x:-2.5,z:-2.5}});
assert.deepEqual(output.goal,last,'investigate last detected position, not omniscient target');
const powered=createThreatBrain();
const dark=createThreatBrain();
const farEnemy={x:0,z:0},stationary={x:2.8,z:0};
assert.equal(tickThreat(powered,{dt:.05,enemy:farEnemy,player:stationary,
  moving:false,flashlight:false,housePower:true}).mode,'pursue',
  'house lights expose nearby stationary players');
assert.equal(tickThreat(dark,{dt:.05,enemy:farEnemy,player:stationary,
  moving:false,flashlight:false,housePower:false}).mode,'search',
  'cutting the lights provides a small concealment advantage');
assert.ok(STRIKE_RANGE<1.3);
console.log('Telegraphed attack, dodge, stagger and pursuit tests passed');
