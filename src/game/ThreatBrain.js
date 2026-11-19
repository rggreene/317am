// Deterministic perception and telegraphed melee for a single intruder.
import {movementAwareness} from './AnalogLocomotion.js';
import {sightClear,audibleRange} from '../audio/Occlusion.js';
// This module knows nothing about Three.js, DOM, audio or animation.
export const WINDUP_SECONDS=.82;
export const RECOVERY_SECONDS=1.25;
export const STRIKE_RANGE=1.18;
export const SEARCH_POINTS=Object.freeze([
  {x:2.65,z:2.08},{x:2.72,z:.38},{x:.24,z:.43},{x:-1.12,z:1.90}
]);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const copy=v=>({x:v.x,z:v.z});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function createThreatBrain(){
  return {mode:'search',goal:copy(SEARCH_POINTS[1]),lastKnown:null,
    memory:0,windup:0,recovery:0,searchIndex:1,investigation:0,
    soundGoal:null,soundMemory:0};
}
export function interruptThreat(brain){
  brain.mode='staggered';brain.windup=0;brain.recovery=Math.max(brain.recovery,.55);
  return brain;
}
export function tickThreat(brain,{dt,enemy,player,moving=false,running=false,
  movementSpeed=null,stance=1,flashlight=false,housePower=true,
  blockers=undefined,soundEvent=null}){
  const step=clamp(dt,0,.1);
  const range=distance(enemy,player);
  // The scroll-selected pace changes footstep audibility. Lower stances
  // also reduce the player's visible profile in ambient light.
  const hearing=Number.isFinite(movementSpeed)&&movementSpeed!==null?
    (moving?movementAwareness(movementSpeed,stance):0):
    (running?5.0:moving?3.05:0);
  const sight=(flashlight?4.25:housePower?3.2:2.1)*
    (flashlight?1:(.78+.22*Math.min(1,Math.max(0,stance))));
  const heard=moving&&range<audibleRange(hearing,enemy,player,blockers);
  const visible=range<sight&&sightClear(enemy,player,blockers);
  // Close proximity is still perceptible, even when furniture obscures sight.
  const detected=range<.8||heard||visible;
  if(soundEvent&&Number.isFinite(soundEvent.x)&&Number.isFinite(soundEvent.z)){
    const source={x:soundEvent.x,z:soundEvent.z};
    const loudness=Math.max(0,soundEvent.range??0);
    if(distance(enemy,source)<audibleRange(loudness,enemy,source,blockers)){
      brain.soundGoal=copy(source);
      brain.soundMemory=3.5;
    }
  }
  if(detected){
    brain.lastKnown=copy(player);
    brain.memory=4.3;
    brain.investigation=0;
    brain.soundGoal=null;
    brain.soundMemory=0;
  }else{
    brain.memory=Math.max(0,brain.memory-step);
    brain.soundMemory=Math.max(0,brain.soundMemory-step);
  }

  if(brain.mode==='staggered'){
    brain.recovery=Math.max(0,brain.recovery-step);
    if(brain.recovery===0)brain.mode='search';
    return {mode:'staggered',goal:null,telegraph:false,strike:false,heard};
  }
  if(brain.mode==='recover'){
    brain.recovery=Math.max(0,brain.recovery-step);
    if(brain.recovery===0)brain.mode='search';
    return {mode:'recover',goal:null,telegraph:false,strike:false,heard};
  }
  if(brain.mode==='windup'){
    brain.windup=Math.max(0,brain.windup-step);
    if(brain.windup>0){
      return {mode:'windup',goal:null,telegraph:false,strike:false,heard};
    }
    brain.mode='recover';
    brain.recovery=RECOVERY_SECONDS;
    return {mode:'attack',goal:null,telegraph:false,
      strike:range<=STRIKE_RANGE,heard};
  }
  if(range<=STRIKE_RANGE&&brain.memory>0){
    brain.mode='windup';
    brain.windup=WINDUP_SECONDS;
    return {mode:'windup',goal:null,telegraph:true,strike:false,heard};
  }
  if(brain.memory>0&&brain.lastKnown){
    brain.mode='pursue';
    brain.goal=copy(brain.lastKnown);
    return {mode:'pursue',goal:copy(brain.goal),telegraph:false,strike:false,heard};
  }
  if(brain.memory===0&&brain.soundMemory>0&&brain.soundGoal){
    brain.mode='investigate';
    brain.goal=copy(brain.soundGoal);
    if(distance(enemy,brain.goal)<.32){
      brain.soundMemory=0;
      brain.soundGoal=null;
      brain.lastKnown=null;
      brain.investigation=0;
    }else{
      return {mode:'investigate',goal:copy(brain.goal),telegraph:false,strike:false,heard:true};
    }
  }
  // On losing a target, investigate the last observed position before
  // returning to the patrol. Never follow the player's unseen position.
  if(brain.lastKnown){
    brain.mode='investigate';
    brain.goal=copy(brain.lastKnown);
    if(distance(enemy,brain.goal)>=.32){
      return {mode:'investigate',goal:copy(brain.goal),telegraph:false,strike:false,heard:false};
    }
    brain.investigation+=step;
    if(brain.investigation<1.2){
      return {mode:'investigate',goal:null,telegraph:false,strike:false,heard:false};
    }
    brain.lastKnown=null;
    brain.investigation=0;
    brain.goal=copy(SEARCH_POINTS[brain.searchIndex]);
  }
  brain.mode='search';
  if(distance(enemy,brain.goal)<.32){
    brain.searchIndex=(brain.searchIndex+1)%SEARCH_POINTS.length;
    brain.goal=copy(SEARCH_POINTS[brain.searchIndex]);
  }
  return {mode:'search',goal:copy(brain.goal),telegraph:false,strike:false,heard:false};
}
