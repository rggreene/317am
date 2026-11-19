// Stereo placement in the listener's horizontal camera plane.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function panFromCamera(listener,facing,source,maxDistance=4){
  const fx=facing.x,fz=facing.z,len=Math.hypot(fx,fz)||1;
  const rightX=-fz/len,rightZ=fx/len;
  const dx=source.x-listener.x,dz=source.z-listener.z;
  return clamp((dx*rightX+dz*rightZ)/maxDistance,-.85,.85);
}
