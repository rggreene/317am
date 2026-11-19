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
output=tickThreat(stalk,{dt:.05,enemy:{x:2.6,z:2},player:{x:-1,z:2},moving:true,running:true,blockers:[]});
assert.equal(output.mode,'pursue','running can be heard farther away');
const last={...output.goal};
output=tickThreat(stalk,{dt:.05,enemy:{x:2.6,z:2},player:{x:-2.5,z:-2.5}});
assert.deepEqual(output.goal,last,'investigate last detected position, not omniscient target');
const powered=createThreatBrain();
const dark=createThreatBrain();
const farEnemy={x:0,z:0},stationary={x:2.8,z:0};
assert.equal(tickThreat(powered,{dt:.05,enemy:farEnemy,player:stationary,
  moving:false,flashlight:false,housePower:true,blockers:[]}).mode,'pursue',
  'house lights expose nearby stationary players');
assert.equal(tickThreat(dark,{dt:.05,enemy:farEnemy,player:stationary,
  moving:false,flashlight:false,housePower:false,blockers:[]}).mode,'search',
  'cutting the lights provides a small concealment advantage');
assert.ok(STRIKE_RANGE<1.3);
console.log('Telegraphed attack, dodge, stagger and pursuit tests passed');

const shadowedLow=createThreatBrain(),shadowedFast=createThreatBrain();
const movementTest={dt:.05,blockers:[],enemy:{x:0,z:0},player:{x:2.55,z:0},
  moving:true,flashlight:false,housePower:false};
assert.equal(tickThreat(shadowedLow,{...movementTest,movementSpeed:.40,stance:0}).mode,'search',
  'deep crouch + low pace should not make noise audible from across the room');
assert.equal(tickThreat(shadowedFast,{...movementTest,movementSpeed:2.65,stance:1}).mode,'pursue',
  'fast upright movement should alert the intruder');
const lowSil=createThreatBrain(),highSil=createThreatBrain();
const cover={dt:.05,blockers:[],enemy:{x:0,z:0},player:{x:2.9,z:0},
  moving:false,housePower:true,flashlight:false};
assert.equal(tickThreat(lowSil,{...cover,stance:0}).mode,'search',
  'lowered posture should reduce ambient-light silhouette');
assert.equal(tickThreat(highSil,{...cover,stance:1}).mode,'pursue',
  'upright posture remains visible under the same light');

// Losing sight should cause an investigation at the last known location,
// not an immediate return to patrol or an omniscient chase.
const investigator=createThreatBrain();
const farAway={x:9,z:9};
tickThreat(investigator,{dt:.05,enemy:{x:0,z:0},player:{x:2,z:0},blockers:[]});
for(let i=0;i<45;i++){
  tickThreat(investigator,{dt:.1,enemy:{x:0,z:0},player:farAway,housePower:false});
}
let investigate=tickThreat(investigator,{dt:.1,enemy:{x:0,z:0},player:farAway,housePower:false});
assert.equal(investigate.mode,'investigate');
assert.deepEqual(investigate.goal,{x:2,z:0});
for(let i=0;i<13;i++){
  investigate=tickThreat(investigator,{dt:.1,enemy:{x:2,z:0},player:farAway,housePower:false});
}
assert.equal(investigate.mode,'search','intruder resumes patrol after investigating');

// Occlusion must matter independently of raw range.
const blocker=[{minX:.8,maxX:1.2,minZ:-.5,maxZ:.5}];
const perception={dt:.05,enemy:{x:0,z:0},player:{x:2,z:0},housePower:true};
assert.equal(tickThreat(createThreatBrain(),{...perception,blockers:[]}).mode,'pursue');
assert.equal(tickThreat(createThreatBrain(),{...perception,blockers:blocker}).mode,'search');
assert.equal(tickThreat(createThreatBrain(),{...perception,blockers:blocker,moving:true,movementSpeed:2.8}).mode,'pursue',
  'loud movement can still be heard through an obstacle');

// A discrete noise should draw the intruder to its source, not the player's
// current location; obstacles attenuate the noise.
const soundEnemy={x:0,z:0},soundPlayer={x:8,z:8};
const noise={x:2,z:0,range:4};
const listener=createThreatBrain();
let soundStep=tickThreat(listener,{dt:.05,enemy:soundEnemy,player:soundPlayer,
  housePower:false,soundEvent:noise,blockers:[]});
assert.equal(soundStep.mode,'investigate');
assert.deepEqual(soundStep.goal,{x:2,z:0});
soundStep=tickThreat(listener,{dt:.05,enemy:soundEnemy,player:soundPlayer,
  housePower:false,blockers:[]});
assert.deepEqual(soundStep.goal,{x:2,z:0},'one-shot sound remains a remembered target');
const muffled=createThreatBrain();
assert.equal(tickThreat(muffled,{dt:.05,enemy:soundEnemy,player:soundPlayer,
  housePower:false,soundEvent:{...noise,range:2.5},blockers:blocker}).mode,'search',
  'a quiet sound beyond occluded hearing range must not alert the intruder');

// Search points are deliberate: pause and listen before moving to the next.
const patrol=createThreatBrain();
const patrolGoal={...patrol.goal};
const absent={x:20,z:20};
let patrolStep=tickThreat(patrol,{dt:.1,enemy:patrolGoal,player:absent});
assert.equal(patrolStep.mode,'search');
assert.equal(patrolStep.goal,null,'intruder should stop at a search point');
for(let i=0;i<8;i++)patrolStep=tickThreat(patrol,{dt:.1,enemy:patrolGoal,player:absent});
assert.notDeepEqual(patrolStep.goal,patrolGoal,'intruder should move on after listening');
