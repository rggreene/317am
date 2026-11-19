import assert from 'node:assert/strict';
import {createThreatBrain,tickThreat} from '../src/game/ThreatBrain.js';
const enemy={x:0,z:0}, player={x:2,z:0};
const brain=createThreatBrain();
const args={dt:.05,enemy,player,moving:true,movementSpeed:2.8,stance:1,
  flashlight:false,housePower:false,blockers:[]};
const first=tickThreat(brain,args);
assert.equal(first.mode,'investigate','Footsteps should attract investigation, not grant visual pursuit');
assert.ok(brain.soundGoal,'Footsteps must leave a last audible position');
const lost=createThreatBrain();
lost.lastKnown={x:1,z:0};lost.memory=0;lost.goal={x:1,z:0};
tickThreat(lost,{...args,moving:false,movementSpeed:0,player:{x:8,z:8},enemy:{x:1,z:0}});
for(let i=0;i<26;i++)tickThreat(lost,{...args,moving:false,movementSpeed:0,player:{x:8,z:8},enemy:{x:1,z:0}});
assert.ok(lost.searchSweep>0,'Lost visual contact should trigger a local sweep');
const hidden=createThreatBrain();
const quiet=tickThreat(hidden,{...args,moving:false,movementSpeed:0,player:{x:2,z:0}});
assert.notEqual(quiet.mode,'pursue','A stationary concealed player should not be tracked by sound');
console.log('Intruder stealth intelligence: OK');
