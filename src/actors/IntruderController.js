import * as THREE from 'three';
import rigUrl from '../../assets/models/intruder_rig.glb?url';
import {loadGLB} from '../assets/loadGLB.js';

export const INTRUDER_CLIPS=Object.freeze(['idle','walk','attack','stagger']);

export async function createRiggedIntruder(){
  const asset=await loadGLB(rigUrl);
  if(!asset.mixer)throw Error('No animations found in the intruder rig');
  for(const name of INTRUDER_CLIPS){
    if(!THREE.AnimationClip.findByName(asset.animations,name))throw Error('Missing rig animation: '+name);
  }
  const group=asset.scene;
  group.name='Rigged Intruder (GLB)';
  group.position.set(.28,0,-.38);
  group.traverse(node=>{
    if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}
    if(node.isSkinnedMesh)node.frustumCulled=false;
  });
  let active=null;
  let current='';
  let onChanged=()=>{};
  function setClip(name){
    if(!INTRUDER_CLIPS.includes(name))return false;
    if(name===current&&active?.isRunning())return true;
    const clip=THREE.AnimationClip.findByName(asset.animations,name);
    const action=asset.mixer.clipAction(clip);
    const oneShot=name==='attack'||name==='stagger';
    if(active&&active!==action)active.fadeOut(.18);
    action.enabled=true;
    action.reset();
    action.setLoop(oneShot?THREE.LoopOnce:THREE.LoopRepeat,oneShot?1:Infinity);
    action.clampWhenFinished=oneShot;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.fadeIn(.18).play();
    active=action;current=name;onChanged(name);
    return true;
  }
  asset.mixer.addEventListener('finished',event=>{
    if(event.action===active&&(current==='attack'||current==='stagger'))setClip('idle');
  });
  setClip('idle');
  return {
    group,
    setClip,
    update(delta){asset.mixer.update(delta);},
    set onChanged(fn){onChanged=fn;if(current)fn(current);},
    get clip(){return current;}
  };
}
