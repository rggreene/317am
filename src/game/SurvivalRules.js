// Deterministic rules independent of Three.js and browser APIs.
export const NIGHT_LENGTH=75;
export const THREAT_DELAY=10;
export const BARRICADE_DELAY=15;
export const ENEMY_DAMAGE=16;
export const HIT_COOLDOWN=2.6;
export const MEDKIT_HEAL=38;
export function createNight(){
  return {phase:'idle',elapsed:0,remaining:NIGHT_LENGTH,health:100,
    helpCalled:false,doorSecured:false,breakerOn:true,medkitUsed:false,
    enemyEntered:false,damageCooldown:0,enemyStun:0,
    message:'Call for help. Barricade the door. Survive until dawn.'};
}
export function beginNight(state){if(state.phase==='idle')state.phase='playing';return state;}
export function nightEvent(state,type){
  if(state.phase!=='playing')return false;
  switch(type){
    case 'phone':
      if(state.helpCalled)return false;
      state.helpCalled=true;state.message='DISPATCH: Stay inside. Help is on the way.';return true;
    case 'barricade':
      if(state.doorSecured||state.enemyEntered)return false;
      state.doorSecured=true;state.message='ENTRY REINFORCED. You bought some time.';return true;
    case 'breaker':
      state.breakerOn=!state.breakerOn;
      state.message=state.breakerOn?'CIRCUIT RESTORED.':'CIRCUIT CUT. Something moves in the dark.';return true;
    case 'medkit':
      if(state.medkitUsed||state.health>=100)return false;
      state.medkitUsed=true;state.health=Math.min(100,state.health+MEDKIT_HEAL);
      state.message='YOU BANDAGED YOUR WOUNDS.';return true;
    case 'hit':
      if(state.damageCooldown>0)return false;
      state.health=Math.max(0,state.health-ENEMY_DAMAGE);state.damageCooldown=HIT_COOLDOWN;
      state.message=state.health>0?'YOU WERE STRUCK. GET SOME SPACE.':'YOU DID NOT SURVIVE.';
      if(state.health===0)state.phase='lost';return true;
    case 'stun':
      state.enemyStun=Math.max(state.enemyStun,1.05);return true;
    default:return false;
  }
}
export function tickNight(state,dt){
  if(state.phase!=='playing')return state;
  const step=Math.min(Math.max(dt,0),.5);
  state.elapsed+=step;state.remaining=Math.max(0,NIGHT_LENGTH-state.elapsed);
  state.damageCooldown=Math.max(0,state.damageCooldown-step);
  state.enemyStun=Math.max(0,state.enemyStun-step);
  if(!state.enemyEntered&&state.elapsed>=THREAT_DELAY+(state.doorSecured?BARRICADE_DELAY:0)){
    state.enemyEntered=true;state.message='THE FRONT DOOR GIVES WAY.';
  }
  if(state.remaining===0){
    state.phase=state.helpCalled?'won':'lost';
    state.message=state.helpCalled?'SIRENS. YOU SURVIVED THE NIGHT.':'THE NIGHT PASSES. NO ONE IS COMING.';
  }
  return state;
}
export function nightObjective(state){
  if(state.phase==='won')return 'YOU SURVIVED';
  if(state.phase==='lost')return 'GAME OVER';
  if(!state.helpCalled)return 'FIND THE PHONE. CALL FOR HELP.';
  return 'SURVIVE UNTIL HELP ARRIVES.';
}
export function nearestInteractable(player,items,maxRange=1.20){
  let winner=null,near=maxRange;
  for(const item of items){
    if(item.disabled)continue;
    const distance=Math.hypot(player.x-item.x,player.z-item.z);
    if(distance<near){winner=item;near=distance;}
  }
  return winner;
}
