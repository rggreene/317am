import assert from 'node:assert/strict';
import {focusedInteractable} from '../src/game/SurvivalRules.js';
const items=[
  {id:'phone',x:-2,z:0},{id:'door',x:2,z:0},
  {id:'breaker',x:1.5,z:1.5,disabled:true}
];
assert.equal(focusedInteractable({x:-1,z:0},{x:-1,z:0},items)?.id,'phone');
assert.equal(focusedInteractable({x:-1,z:0},{x:1,z:0},items),null,'should not interact over shoulder');
assert.equal(focusedInteractable({x:-1.5,z:0},{x:1,z:0},items)?.id,'phone','close target does not require precise aiming');
assert.equal(focusedInteractable({x:1.1,z:0},{x:1,z:0},items)?.id,'door');
assert.equal(focusedInteractable({x:1.5,z:1.0},{x:0,z:1},items),null,'disabled item should be ignored');
assert.equal(focusedInteractable({x:0,z:0},{x:1,z:0},items),null,'out-of-range items remain unusable');
console.log('Facing and distance-aware interaction targeting passed');
