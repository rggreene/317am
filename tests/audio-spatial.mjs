import assert from 'node:assert/strict';
import {panFromCamera} from '../src/audio/AudioSpatial.js';
const listener={x:0,z:0},facing={x:0,z:-1};
assert.ok(panFromCamera(listener,facing,{x:3,z:0})>.5,'right-side steps pan right');
assert.ok(panFromCamera(listener,facing,{x:-3,z:0})<-.5,'left-side steps pan left');
assert.equal(panFromCamera(listener,facing,{x:0,z:-2}),0,'front is centered');
assert.ok(Math.abs(panFromCamera(listener,facing,{x:100,z:0}))<=.85);
console.log('Spatial footsteps stereo placement passed');
