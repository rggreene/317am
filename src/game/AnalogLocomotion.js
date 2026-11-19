// Analog first-person movement, independent from Three.js and the DOM.
// Wheel alone changes preferred pace; C + wheel adjusts camera/stance height.
export const STANDING_EYE_HEIGHT=1.64;
export const LOWEST_EYE_HEIGHT=.88;
export const MIN_PACE=.35;
export const MAX_PACE=3.0;
export const DEFAULT_PACE=1.75;
export const PACE_PER_NOTCH=.18;
export const STANCE_PER_NOTCH=.10;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

export function createAnalogMovement(){
  return {pace:DEFAULT_PACE,stance:1};
}
export function wheelNotches(deltaY,deltaMode=0){
  if(!Number.isFinite(deltaY)||deltaY===0)return 0;
  // DOM_DELTA_PIXEL / LINE / PAGE normalize to a roughly 100px detent.
  // Fractional trackpad deltas give fractional changes; large events are bounded.
  const pixels=deltaMode===1?deltaY*34:deltaMode===2?deltaY*450:deltaY;
  return clamp(-pixels/100,-3,3);
}
export function adjustAnalogMovement(state,deltaY,deltaMode=0,holdC=false){
  const steps=wheelNotches(deltaY,deltaMode);
  if(!steps)return {...state};
  if(holdC)return {
    ...state,
    stance:clamp(state.stance+steps*STANCE_PER_NOTCH,0,1)
  };
  return {
    ...state,
    pace:clamp(state.pace+steps*PACE_PER_NOTCH,MIN_PACE,MAX_PACE)
  };
}
export function eyeHeightFor(stance){
  return LOWEST_EYE_HEIGHT+
    (STANDING_EYE_HEIGHT-LOWEST_EYE_HEIGHT)*clamp(stance,0,1);
}
export function speedFor(state,shiftHeld=false){
  // Crouch height imposes a physical speed cap; the user's preferred pace
  // remains unchanged, so standing back up restores the selected setting.
  const stance=clamp(state.stance,0,1);
  const cap=.95+(MAX_PACE-.95)*stance;
  const preferred=shiftHeld?Math.max(state.pace,2.9):state.pace;
  return Math.min(cap,clamp(preferred,MIN_PACE,MAX_PACE));
}
export function paceDescription(pace){
  return pace<.85?'CREEP':pace<1.5?'CAREFUL':pace<2.25?'WALK':
    pace<2.8?'BRISK':'FAST';
}
export function stanceDescription(stance){
  return stance<.18?'LOW CROUCH':stance<.65?'CROUCHED':
    stance<.93?'LOWERED':'STANDING';
}
export function movementAwareness(speed,stance=1){
  const pace=clamp(speed,0,MAX_PACE);
  const height=clamp(stance,0,1);
  // Effective detection range for a moving player, used by ThreatBrain.
  // Slow, low steps still produce noise, just considerably less of it.
  return (1.20+1.23*pace)*(.69+.31*height);
}
