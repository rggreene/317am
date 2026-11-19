// Deterministic perception and telegraphed melee for a single intruder.
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
    memory:0,windup:0,recovery:0,searchIndex:1};
}
export function interruptThreat(brain){
  brain.mode='staggered';brain.windup=0;brain.recovery=Math.max(brain.recovery,.55);
  return brain;
}
export function tickThreat(brain,{dt,enemy,player,moving=false,running=false,flashlight=false,housePower=true}){
  const step=clamp(dt,0,.1);
  const range=distance(enemy,player);
  const hearing=running?5.0:moving?3.05:0;
  const sight=flashlight?4.25:housePower?3.2:2.1;
  const detected=range<1.75 || (moving&&range<hearing) || range<sight;
  if(detected){
    brain.lastKnown=copy(player);
    brain.memory=4.3;
  }else{
    brain.memory=Math.max(0,brain.memory-step);
  }

  if(brain.mode==='staggered'){
    brain.recovery=Math.max(0,brain.recovery-step);
    if(brain.recovery===0)brain.mode='search';
    return {mode:'staggered',goal:null,telegraph:false,strike:false,heard:detected};
  }
  if(brain.mode==='recover'){
    brain.recovery=Math.max(0,brain.recovery-step);
    if(brain.recovery===0)brain.mode='search';
    return {mode:'recover',goal:null,telegraph:false,strike:false,heard:detected};
  }
  if(brain.mode==='windup'){
    brain.windup=Math.max(0,brain.windup-step);
    if(brain.windup>0){
      return {mode:'windup',goal:null,telegraph:false,strike:false,heard:detected};
    }
    brain.mode='recover';
    brain.recovery=RECOVERY_SECONDS;
    return {mode:'attack',goal:null,telegraph:false,
      strike:range<=STRIKE_RANGE,heard:detected};
  }
  if(range<=STRIKE_RANGE&&brain.memory>0){
    brain.mode='windup';
    brain.windup=WINDUP_SECONDS;
    return {mode:'windup',goal:null,telegraph:true,strike:false,heard:true};
  }
  if(brain.memory>0&&brain.lastKnown){
    brain.mode='pursue';
    brain.goal=copy(brain.lastKnown);
    return {mode:'pursue',goal:copy(brain.goal),telegraph:false,strike:false,heard:detected};
  }
  brain.mode='search';
  if(distance(enemy,brain.goal)<.32){
    brain.searchIndex=(brain.searchIndex+1)%SEARCH_POINTS.length;
    brain.goal=copy(SEARCH_POINTS[brain.searchIndex]);
  }
  return {mode:'search',goal:copy(brain.goal),telegraph:false,strike:false,heard:false};
}
