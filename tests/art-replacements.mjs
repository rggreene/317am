import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyArtReplacements,availableArtUrls,restoreProceduralFallback,compareArtBounds} from '../src/assets/ArtReplacements.js';
const slot=new THREE.Group(),fallback=new THREE.Mesh(new THREE.BoxGeometry(.8,.6,.5));
fallback.name='Existing quality-prototype sofa';slot.add(fallback);
const slots=new Map([['room_sofa_2seat',slot]]);
const path='assets/models/furniture/demo_sofa.glb';
const entry={id:'room_sofa_2seat',status:'in_review',model_glb:path,target_dimensions_m:[1,.5,.6]};
const manifest={assets:[entry]};
const urls={'../../'+path:'/demo_sofa.glb'};
assert.equal(availableArtUrls({assets:[{...entry,status:'planned'}]},urls,slots).length,0);
const warnings=[];
const missing=await applyArtReplacements({slots,manifest,urls:{},
  loadModel:async()=>{throw Error('Should not attempt network');},
  onWarning:x=>warnings.push(x)});
assert.equal(missing[0].status,'fallback');
assert.equal(slot.children[0],fallback,'missing GLB must not blank the room');
const bad=await applyArtReplacements({slots,manifest,urls,
  loadModel:async()=>({scene:new THREE.Group()}),
  onWarning:x=>warnings.push(x)});
assert.equal(bad[0].status,'fallback','degenerate art asset should not replace valid fallback');
assert.equal(slot.children[0],fallback);
const fresh=new THREE.Group();
fresh.add(new THREE.Mesh(new THREE.BoxGeometry(1,.5,.6)));
assert.equal(compareArtBounds(fresh,[1,.5,.6]).ok,true);
assert.equal(compareArtBounds(fresh,[.2,.1,.2]).ok,false);
const success=await applyArtReplacements({slots,manifest,urls,
  loadModel:async()=>({scene:fresh}),onWarning:x=>warnings.push(x)});
assert.equal(success[0].status,'replaced');
assert.equal(slot.children[0],fresh);
assert.equal(slot.userData.sourceGLB,path);
assert.equal(restoreProceduralFallback(slot),true);
assert.equal(slot.children[0],fallback,'restore should recover original geometry');
assert.equal(restoreProceduralFallback(slot),false);
console.log('Optional GLB art replacement, dimension guard and fallback restore passed');
