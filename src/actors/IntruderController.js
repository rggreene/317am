import * as THREE from 'three';
import rigUrl from '../../assets/models/intruder_rig.glb?url';
import {loadGLB} from '../assets/loadGLB.js';
import {impactDirection,dampedSpring} from '../game/ImpactQuality.js';
import {dressIntruderRig} from './IntruderArtPass.js';
import {sculptIntruderSilhouette} from './IntruderSculpt.js';
import {intruderPose} from './IntruderPose.js';

export const INTRUDER_CLIPS=Object.freeze(['idle','walk','attack','stagger']);

export async function createRiggedIntruder(){
  const asset=await loadGLB(rigUrl);
  if(!asset.mixer)throw Error('No animations found in the intruder rig');
  for(const name of INTRUDER_CLIPS){
    if(!THREE.AnimationClip.findByName(asset.animations,name))throw Error('Missing rig animation: '+name);
  }
  // Pivot around hips to avoid sliding the feet through the floor.
  const group=new THREE.Group();
  group.name='Rigged Intruder (GLB)';
  const rest=new THREE.Vector3(.28,0,-.38);
  group.position.copy(rest);
  const pivot=new THREE.Group();
  pivot.position.y=.96;
  asset.scene.position.y=-.96;
  pivot.add(asset.scene);
  group.add(pivot);
  asset.scene.traverse(node=>{
    if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}
    if(node.isSkinnedMesh)node.frustumCulled=false;
  });
  // Bone-following costume details; GLB clips and hit positions stay intact.
  // Replace the mannequin-like skinned shell with detailed bone-following
  // meshes; the old skinned mesh stays in memory as a reversible fallback.
  const sculpt=sculptIntruderSilhouette(asset.scene);
  const art=dressIntruderRig(asset.scene);
  // Intent layer is additive to the original four GLB animation clips.
  // Undo the previous offset before mixer.update to avoid frame-to-frame drift.
  const poseBones=new Map();
  asset.scene.traverse(node=>{if(node.isBone)poseBones.set(node.name,node);});
  const applied=new Map();
  let intent='idle',intentProgress=0,poseClock=0;
  const inverse=new THREE.Quaternion(),addition=new THREE.Quaternion();
  function resetPose(){
    for(const [name,quat] of applied){
      const bone=poseBones.get(name);
      if(bone){
        inverse.copy(quat).invert();
        bone.quaternion.multiply(inverse);
      }
    }
    applied.clear();
  }
  function addPose(dt){
    poseClock+=dt;
    const pose=intruderPose(intent,intentProgress,poseClock);
    for(const [name,angles] of Object.entries(pose)){
      const bone=poseBones.get(name);
      if(!bone)continue;
      const euler=new THREE.Euler(...angles,'XYZ');
      addition.setFromEuler(euler);
      bone.quaternion.multiply(addition);
      applied.set(name,addition.clone());
    }
  }
  let active=null;
  let current='';
  let onChanged=()=>{};
  const reaction={
    x:{value:0,velocity:0}, z:{value:0,velocity:0},
    pitch:{value:0,velocity:0},roll:{value:0,velocity:0},
    twist:{value:0,velocity:0}
  };
  let flashTime=0;
  const flash=new THREE.PointLight('#f9c795',0,.9,2);
  flash.position.set(0,1.5,.18);
  group.add(flash);
  function reactToImpact(attacker){
    const dir=impactDirection(attacker,group.position);
    const impacts={x:dir.pushX,z:dir.pushZ,pitch:dir.pitch,roll:dir.roll,twist:dir.twist};
    for(const [key,input] of Object.entries(impacts)){
      const state=reaction[key],cap=(key==='x'||key==='z')?.20:.42;
      state.value=THREE.MathUtils.clamp(state.value+input,-cap,cap);
      state.velocity=0;
    }
    flashTime=.11;
    setClip('stagger',true);
  }
  function setClip(name,forceRestart=false){
    if(!INTRUDER_CLIPS.includes(name))return false;
    if(name===current&&active?.isRunning()&&!forceRestart)return true;
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
    art,
    sculpt,
    setClip,
    setIntent(name,progress=0){
      intent=name;
      intentProgress=THREE.MathUtils.clamp(progress,0,1);
    },
    update(delta){
      resetPose();
      asset.mixer.update(delta);
      addPose(delta);
      for(const state of Object.values(reaction)){
        const next=dampedSpring(state.value,state.velocity,delta,16);
        state.value=next.value;
        state.velocity=next.velocity;
      }
      group.position.set(rest.x+reaction.x.value,rest.y,rest.z+reaction.z.value);
      pivot.rotation.set(reaction.pitch.value,reaction.twist.value,reaction.roll.value,'YXZ');
      flashTime=Math.max(0,flashTime-delta);
      flash.intensity=flashTime>0?flashTime*14:0;
    },
    reactToImpact,
    setBasePosition(x,z){rest.set(x,0,z);group.position.set(x,0,z);},
    getTarget(){return new THREE.Vector3(group.position.x,1.43,group.position.z);},
    set onChanged(fn){onChanged=fn;if(current)fn(current);},
    get clip(){return current;}
  };
}
