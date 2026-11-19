import * as THREE from 'three';

// Manifest-driven, reversible optional GLB art replacement.
// Neither the gameplay collision volumes nor the actor animations live here.
const accepted=new Set(['in_review','active']);
export function compareArtBounds(scene,expected,tolerance=.40){
  const bounds=new THREE.Box3().setFromObject(scene);
  const size=bounds.getSize(new THREE.Vector3());
  const actual=size.toArray();
  if(!actual.every(n=>Number.isFinite(n)&&n>.001))return {ok:false,actual,reason:'empty or degenerate asset'};
  for(let i=0;i<3;i++){
    const relative=Math.abs(actual[i]-expected[i])/Math.max(.001,expected[i]);
    if(relative>tolerance){
      return {ok:false,actual,
        reason:'incorrect physical dimension '+['width','height','depth'][i]+
          ': '+actual[i].toFixed(3)+'m, expected '+expected[i]+'m'};
    }
  }
  return {ok:true,actual,reason:null};
}
export function availableArtUrls(manifest,urls,slots){
  return manifest.assets.filter(entry=>
    accepted.has(entry.status)&&slots.has(entry.id)
  ).map(entry=>({...entry,url:urls['../../'+entry.model_glb]??null}));
}
export async function applyArtReplacements({slots,manifest,urls,loadModel,onWarning=()=>{}}){
  if(!slots||!manifest?.assets)throw Error('Art replacement manifest and slots required');
  const results=[];
  for(const entry of availableArtUrls(manifest,urls,slots)){
    const slot=slots.get(entry.id);
    if(!entry.url){
      const reason='Optional art file not bundled: '+entry.model_glb;
      onWarning(reason);
      results.push({id:entry.id,status:'fallback',reason});
      continue;
    }
    try{
      const loaded=await loadModel(entry.url);
      if(!loaded?.scene?.isObject3D)throw Error('GLB has no valid scene');
      const check=compareArtBounds(loaded.scene,entry.target_dimensions_m);
      if(!check.ok)throw Error(check.reason);
      // Do not mutate the working fallback until every validation has succeeded.
      const fallback=[...slot.children];
      slot.clear();
      slot.add(loaded.scene);
      slot.userData.fallbackGeometry=fallback;
      slot.userData.sourceGLB=entry.model_glb;
      slot.userData.prototypeQuality='glb-'+entry.status;
      loaded.scene.traverse(node=>{
        if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}
      });
      results.push({id:entry.id,status:'replaced',dimensions:check.actual});
    }catch(error){
      const reason=String(error?.message??error);
      onWarning(entry.id+': '+reason);
      results.push({id:entry.id,status:'fallback',reason});
    }
  }
  return results;
}
export function restoreProceduralFallback(slot){
  const originals=slot?.userData?.fallbackGeometry;
  if(!Array.isArray(originals)||!originals.length)return false;
  slot.clear();
  for(const child of originals)slot.add(child);
  delete slot.userData.fallbackGeometry;
  delete slot.userData.sourceGLB;
  slot.userData.prototypeQuality='art-pass-1';
  return true;
}
