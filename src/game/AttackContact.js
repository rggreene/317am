// Contact-frame combat event: a windup alone cannot deal damage.
// Pure renderer-independent state so exact timing and cancellation are testable.
import {STRIKE_RANGE} from './ThreatBrain.js';

export const INTRUDER_CONTACT_SECONDS=.180;

export function beginIntruderStrike(){
  return {remaining:INTRUDER_CONTACT_SECONDS};
}

export function advanceIntruderStrike(pending,dt,{
  distance=Infinity,stunned=false,playing=true
}={}){
  if(!pending)return {pending:null,event:null};
  if(stunned||!playing)return {pending:null,event:'cancelled'};
  const step=Math.max(0,Math.min(dt,.1));
  const remaining=pending.remaining-step;
  if(remaining>1e-8)return {pending:{remaining},event:null};
  // This is the only damage/miss evaluation for the complete attack.
  // A player who leaves the range before visible contact successfully dodges.
  return {pending:null,event:distance<=STRIKE_RANGE?'hit':'miss'};
}
