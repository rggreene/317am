import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Optional authored asset pipeline. No external GLB assets ship with this starter.
// A returned mixer can play clips named in Blender (idle, walk, attack, stagger).
const loader=new GLTFLoader();
export async function loadGLB(path){
  const gltf=await loader.loadAsync(path);
  const mixer=gltf.animations.length?new THREE.AnimationMixer(gltf.scene):null;
  return {scene:gltf.scene,animations:gltf.animations,mixer};
}
export function playClip(asset,name,fade=0.2){
  if(!asset?.mixer)return false;
  const clip=THREE.AnimationClip.findByName(asset.animations,name);
  if(!clip)return false;
  const next=asset.mixer.clipAction(clip);
  next.reset().fadeIn(fade).play();
  return true;
}
