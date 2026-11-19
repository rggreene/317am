// Additive animation direction; this is presentation only.
// Damage windows and actual detection stay in the deterministic survival rules.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function intruderPose(intent='idle',progress=0,elapsed=0){
  const t=clamp(progress,0,1);
  const smooth=t*t*(3-2*t);
  const breathing=Math.sin(elapsed*1.45);
  const scan=Math.sin(elapsed*.62);
  const result={
    Spine:[.014*breathing,0,.012*Math.sin(elapsed*.7)],
    Neck:[-.018,0,0],
    Head:[0,.11*scan,0],
    Shoulder_L:[.034,0,0],
    Shoulder_R:[-.035,0,0]
  };
  switch(intent){
    case 'search':
      result.Spine=[-.045,.05*scan,.021*Math.sin(elapsed*.42)];
      result.Head=[-.03,.23*scan,.04*Math.sin(elapsed*.53)];
      result.Shoulder_L=[-.09,0,.015];
      result.Shoulder_R=[-.03,0,-.015];
      break;
    case 'pursue':
      result.Spine=[-.11,0,.014*Math.sin(elapsed*3.0)];
      result.Neck=[.02,0,0];
      result.Head=[.045,.04*scan,0];
      result.Shoulder_L=[-.19,0,0];
      result.Shoulder_R=[.19,0,0];
      break;
    case 'windup':
      result.Spine=[-.07-.12*smooth,-.20*smooth,.09*smooth];
      result.Neck=[.025,0,0];
      result.Head=[-.06,.09*smooth,-.02*smooth];
      result.Shoulder_L=[.12*smooth,0,.12*smooth];
      result.Shoulder_R=[-.22-1.02*smooth,.07*smooth,-.07*smooth];
      break;
    case 'recover':
      result.Spine=[-.07,0,.02];
      result.Head=[.025,.04*scan,0];
      result.Shoulder_R=[-.12,0,0];
      break;
    case 'attack':
    case 'stagger':
      // Native GLB one-shot clips own these poses. No additive corrections.
      return {};
    default:break;
  }
  return result;
}
