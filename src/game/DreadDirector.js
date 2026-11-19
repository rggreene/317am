// Deterministic, non-combat environmental cues. No random jumpscares and
// no artificial player sound events: the intruder cannot hear the house itself.
export function createDreadState(){return {nextAt:8,index:0,flicker:0,dim:1};}
const cues=[
  {kind:'settle',text:'A FLOORBOARD CREAKS SOMEWHERE BEHIND YOU.'},
  {kind:'flicker',text:'THE LIGHTS FALTER. THEN HOLD.'},
  {kind:'tap',text:'A SMALL TAP FROM THE OTHER SIDE OF THE ROOM.'},
  {kind:'silence',text:'THE HOUSE GOES UNNATURALLY QUIET.'},
  {kind:'flicker',text:'FOR A MOMENT, THE ROOM LOOKS DIFFERENT.'}
];
export function tickDread(state,dt,elapsed,{power=true,enemyNear=false}={}){
  state.flicker=Math.max(0,state.flicker-Math.max(0,dt));
  state.dim=state.flicker>0?.23:1;
  if(elapsed<state.nextAt)return null;
  const cue=cues[state.index%cues.length];
  state.index++;
  state.nextAt=elapsed+9+(state.index%3)*3;
  // Don't override a nearby threat or flash powerless lights.
  if(enemyNear||(!power&&cue.kind==='flicker'))return null;
  if(cue.kind==='flicker')state.flicker=.22;
  return cue;
}
