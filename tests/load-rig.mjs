// This test validates that Three.js can actually parse, skin, and animate our
// committed GLB, beyond just checking the binary chunk structure.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

globalThis.self ??= globalThis;
const b=readFileSync(new URL('../assets/models/intruder_rig.glb',import.meta.url));
const arrayBuffer=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(arrayBuffer,'',resolve,reject));
const characters=[];
gltf.scene.traverse(node=>{if(node.isSkinnedMesh)characters.push(node);});
assert.ok(characters.length>=1,'GLTFLoader did not produce a SkinnedMesh');
assert.equal(characters[0].skeleton.bones.length,12,'skeleton bone count mismatch');
assert.deepEqual(gltf.animations.map(c=>c.name).sort(),['attack','idle','stagger','walk']);
const mixer=new THREE.AnimationMixer(gltf.scene);
for(const clip of gltf.animations){
  const action=mixer.clipAction(clip);
  action.play();mixer.update(.025);
  assert.equal(action.getClip().name,clip.name);
  action.stop();
}
console.log('Three.js successfully parsed skinned intruder and four animation actions');
