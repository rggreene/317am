// This test validates that Three.js can actually parse, skin, and animate our
// committed GLB, beyond just checking the binary chunk structure.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {dressIntruderRig} from '../src/actors/IntruderArtPass.js';
import {sculptIntruderSilhouette} from '../src/actors/IntruderSculpt.js';

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
const sculpt=sculptIntruderSilhouette(gltf.scene);
assert.ok(sculpt.newMeshes>=10,'new human silhouette needs several body components');
assert.ok(sculpt.hiddenPrototypeSkins>=1,'old mannequin body should be hidden');
assert.ok(characters.every(x=>x.visible===false),'mannequin shell still visible');
const art=dressIntruderRig(gltf.scene);
assert.ok(art.boneCount>=12,'rig dressing did not find expected bones');
assert.ok(art.attachmentCount>=25,'intruder art pass lacks attached details');
assert.ok(art.changedMaterials>=4,'basic PBR materials not retuned');
const dressed=[];
gltf.scene.traverse(node=>{
  if(node.isMesh&&/Jacket|Hood|Glove|Boot|coat|zipper/i.test(node.name))dressed.push(node);
  if(node.isMesh && node.material?.name==='Reflective Eyes'){
    assert.ok(node.material.emissiveIntensity===0,'eyes must not self-illuminate');
  }
});
assert.ok(dressed.length>=10,'bone-following fabric art not present');
for(const clip of gltf.animations){
  const action=mixer.clipAction(clip);
  action.reset().play();mixer.update(.025);
  action.stop();
}
console.log('Three.js successfully parsed skinned intruder and four animation actions');
