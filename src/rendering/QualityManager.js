import * as THREE from 'three';

// Quality profiles change GPU cost without altering gameplay, event timing,
// hit detection, or the lighting design itself.
export const QUALITY_ORDER=Object.freeze(['balanced','cinematic','performance']);
export const QUALITY_PRESETS=Object.freeze({
  performance:{scale:.8,shadowSize:256,shadows:false},
  balanced:{scale:1,shadowSize:512,shadows:true},
  cinematic:{scale:1.35,shadowSize:1024,shadows:true}
});
export function qualityConfig(name,dpr=1){
  const key=Object.hasOwn(QUALITY_PRESETS,name)?name:'balanced';
  const preset=QUALITY_PRESETS[key];
  return {name:key,pixelRatio:Math.min(2,Math.max(.65,Math.max(.5,dpr)*preset.scale)),
    shadowSize:preset.shadowSize,shadows:preset.shadows};
}
export function nextQuality(name){
  const at=QUALITY_ORDER.indexOf(name);
  return QUALITY_ORDER[(at+1)%QUALITY_ORDER.length];
}
export function applyQualityPreset(renderer,lights,profile='balanced',dpr=1){
  const preset=qualityConfig(profile,dpr);
  renderer.setPixelRatio(preset.pixelRatio);
  renderer.shadowMap.enabled=preset.shadows;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.needsUpdate=true;
  for(const light of lights){
    if(!light?.shadow)continue;
    light.castShadow=preset.shadows;
    if(light.shadow.mapSize.x!==preset.shadowSize ||
       light.shadow.mapSize.y!==preset.shadowSize){
      light.shadow.map?.dispose();
      light.shadow.map=null;
      light.shadow.mapSize.set(preset.shadowSize,preset.shadowSize);
      light.shadow.needsUpdate=true;
    }
  }
  return preset;
}
