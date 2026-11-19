// Scripted ambience with player agency. No camera movement, teleports or
// fabricated intruder detections. The cue sequence is seeded per round.
export function createDreadState(seed=0){return {nextAt:8+(seed%4),index:seed%5,seed,
  flicker:0,dim:1,silence:0,sequence:null};}
const cues=['settle','flicker','tap','silence','flicker'];
const positions=[{x:-2.4,z:1.65},{x:2.6,z:-1.85},{x:-.65,z:-2.05},
  {x:2.7,z:1.95},{x:-2.5,z:-1.75}];
export function tickDread(state,dt,elapsed,{power=true,enemyNear=false,
  combat=false,player=null,facing=null,enemy=null,enemyVisible=false}={}){
  const step=Math.max(0,dt);
  state.flicker=Math.max(0,state.flicker-step);
  state.silence=Math.max(0,state.silence-step);
  state.dim=state.flicker>0?.23:1;
  if(combat||enemyNear||enemyVisible){
    state.sequence=null;
    state.silence=0;
    state.flicker=0;
    state.dim=1;
    state.nextAt=Math.max(state.nextAt,elapsed+5);
    return null;
  }
  if(state.sequence){
    const seq=state.sequence;
    if(elapsed<seq.at)return null;
    if(seq.phase==='quiet'){
      seq.phase='creak';seq.at=elapsed+1.4;
      return {kind:'quiet',text:'',position:seq.position};
    }
    state.sequence=null;
    return {kind:'settle',text:'',position:seq.position};
  }
  if(elapsed<state.nextAt)return null;
  const index=state.index++;
  const kind=cues[index%cues.length];
  state.nextAt=elapsed+10+((index+state.seed)%4)*2;
  if(!power&&kind==='flicker')return null;
  const position=positions[(index+state.seed)%positions.length];
  if(enemy&&Math.hypot(enemy.x-position.x,enemy.z-position.z)<1.5)return null;
  if(kind==='flicker')state.flicker=.22;
  if(kind==='silence'){
    state.silence=4.5;
    state.sequence={phase:'quiet',at:elapsed+2.5,position};
    return {kind:'silence',text:'THE HOUSE GOES UNNATURALLY QUIET.',position};
  }
  return {kind,text:kind==='tap'?'A FAINT TAP IN THE APARTMENT.':
    kind==='settle'?'THE BUILDING SETTLES.':'THE LIGHTS FALTER. THEN HOLD.',position};
}
