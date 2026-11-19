// Renderer-independent directional impact and framerate-independent recoil.
export function impactDirection(attacker,target,strength=1){
  const dx=target.x-attacker.x,dz=target.z-attacker.z;
  const d=Math.hypot(dx,dz)||1;
  const x=dx/d,z=dz/d,k=Math.max(0,Math.min(strength,1.5));
  return {
    pushX:x*.14*k,pushZ:z*.14*k,
    pitch:-z*.24*k,roll:(x*.27+.065)*k,twist:(z*.12+x*.08)*k
  };
}
export function dampedSpring(value,velocity,dt,omega=18){
  const d=Math.max(0,Math.min(dt,.1)),w=Math.max(.01,omega);
  const a=velocity+w*value,decay=Math.exp(-w*d);
  return {value:(value+a*d)*decay,velocity:(velocity-w*a*d)*decay};
}
