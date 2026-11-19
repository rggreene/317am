import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {WINDUP_SECONDS,RECOVERY_SECONDS} from '../src/game/ThreatBrain.js';

// This test validates the v2 *production contract now*, and automatically
// switches to exported-model validation after a real candidate is committed.
globalThis.self ??= globalThis;
const projectUrl=(file)=>new URL('../'+file,import.meta.url);
const json=(file)=>JSON.parse(readFileSync(projectUrl(file),'utf8'));
const c=json('assets/characters/intruder-v2.contract.json');
const manifest=json('assets/asset-manifest.json');
const source=readFileSync(projectUrl('src/actors/IntruderController.js'),'utf8');
const candidate=manifest.assets.find(asset=>asset.id==='char_intruder_v02');
assert.ok(candidate,'character not registered in existing art manifest');
assert.equal(c.schema_version,1);
assert.equal(c.character_id,'char_intruder_v02');
assert.equal(c.source_blend,candidate.source_blend);
assert.equal(c.output_glb,candidate.model_glb);
assert.equal(c.current_fallback,'assets/models/intruder_rig.glb');
assert.equal(c.target_branch,'feature/vertical-slice-alpha');
assert.deepEqual(c.geometry.dimensions_xyz_m,candidate.target_dimensions_m);
assert.equal(c.geometry.triangles_hard_cap,candidate.max_triangles);
assert.ok(c.geometry.triangles_target_min<c.geometry.triangles_target_max);
assert.ok(c.geometry.triangles_target_max<=c.geometry.triangles_hard_cap);
assert.ok(c.geometry.max_materials<=candidate.max_materials);
assert.ok(c.geometry.max_texture_edge_px<=candidate.max_texture_edge_px);
assert.equal(c.geometry.meters_per_unit,1);
assert.equal(c.geometry.runtime_axes.up,'+Y');
assert.equal(c.geometry.runtime_axes.forward,'+Z');
assert.equal(c.geometry.blender_axes.up,'+Z');
assert.equal(c.geometry.blender_axes.forward,'-Y');
assert.equal(c.geometry.skin_influences_per_vertex_max,4);
assert.equal(c.skeleton.expected_deform_bones,36);
assert.equal(c.skeleton.required_bones.length,37);
assert.ok(c.skeleton.legacy_compatibility_bones.length>=12);
assert.ok(c.skeleton.required_bones.includes('Root'));

const seen=new Set(),parents=new Map();
for(const [parent,children] of Object.entries(c.skeleton.hierarchy)){
  for(const child of children){
    assert.ok(!parents.has(child),'bone has two parents: '+child);
    parents.set(child,parent);
  }
}
for(const name of c.skeleton.required_bones){
  assert.ok(!seen.has(name),'duplicate bone '+name);
  seen.add(name);
  if(name!=='Root')assert.ok(parents.has(name),'disconnected required bone '+name);
}
assert.equal(parents.has('Root'),false);
const reachable=new Set(['Root']),pending=['Root'];
while(pending.length){
  const parent=pending.shift();
  for(const child of c.skeleton.hierarchy[parent]||[]){
    assert.ok(!reachable.has(child),'cycle in canonical hierarchy: '+child);
    reachable.add(child);pending.push(child);
  }
}
assert.equal(reachable.size,c.skeleton.required_bones.length,'unreachable bone in canonical hierarchy');

const clips=c.animations.preferred_v2_clips;
const clipNames=new Set();
for(const clip of clips){
  assert.ok(!clipNames.has(clip.name),'duplicate action '+clip.name);
  clipNames.add(clip.name);
  assert.ok(Number.isInteger(clip.duration_ms)&&clip.duration_ms>0);
  assert.ok(['once','loop'].includes(clip.playback));
}
const clip=(name)=>clips.find(a=>a.name===name);
assert.ok(clips.filter(x=>x.required_for_v2).length>=10,'too few production actions');
for(const name of c.animations.runtime_required_clips){
  assert.ok(clipNames.has(name),'legacy clip omitted '+name);
  const controllerClips=source.match(/INTRUDER_CLIPS=Object\.freeze\(\[([^\]]+)\]\)/);
  assert.ok(controllerClips,'cannot identify the existing controller clip contract');
  assert.ok(controllerClips[1].includes("'"+name+"'"),'legacy runtime clip not represented '+name);
}
assert.equal(clip('windup').duration_ms,WINDUP_SECONDS*1000);
assert.equal(clip('recover').duration_ms,RECOVERY_SECONDS*1000);
assert.equal(c.animations.strike_event.windup_ms,WINDUP_SECONDS*1000);
assert.equal(c.animations.strike_event.visible_contact_after_attack_start_ms,clip('attack').contact_ms);
assert.equal(c.animations.strike_event.apply_damage_at_contact,true);
assert.equal(c.animations.strike_event.one_damage_check_per_attempt,true);
assert.equal(c.animations.strike_event.interrupt_before_contact,true);

for(const name of [
 'docs/INTRUDER_V2_ART_BIBLE.md',
 'docs/INTRUDER_V2_PRODUCTION_CHECKLIST.md',
 'docs/INTRUDER_V2_BLENDER_GLB_SPEC.md',
 'scripts/blender/validate_intruder_v2.py'
]){
  assert.ok(existsSync(projectUrl(name)),'production file missing: '+name);
}
for(const mat of c.materials.slots){
  assert.ok(mat.max_resolution_px<=c.geometry.max_texture_edge_px);
  assert.ok(mat.max_resolution_px>=256);
}
assert.ok(c.materials.forbidden.includes('emissive_eyes'));

if(candidate.status==='planned'){
  assert.equal(c.status,'specification_only','planned asset must not claim delivered status');
  assert.ok(!existsSync(projectUrl(c.output_glb)),'GLB exists but manifest still claims planned');
  console.log('Intruder v2 production contract valid: 37 bones,',clips.length,
    'animation targets; model correctly remains planned');
}else{
  assert.ok(['exported','in_review','active'].includes(candidate.status),
    'unexpected candidate status '+candidate.status);
  assert.ok(existsSync(projectUrl(c.output_glb)),'v2 candidate GLB missing at '+c.output_glb);
  const file=readFileSync(projectUrl(c.output_glb));
  const ab=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(ab,'',resolve,reject));
  const bones=new Set(),materials=new Set();
  let skinned=0,triangles=0,hasUV=true;
  gltf.scene.traverse(obj=>{
    if(obj.isBone)bones.add(obj.name);
    if(!obj.isMesh)return;
    if(obj.isSkinnedMesh)skinned++;
    hasUV&&=Boolean(obj.geometry.attributes.uv);
    triangles+=(obj.geometry.index?.count||obj.geometry.attributes.position?.count||0)/3;
    for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])){
      if(mat)materials.add(mat);
      if(mat?.emissiveIntensity>0 && /eye/i.test(mat.name))throw Error('emissive eye material');
    }
  });
  assert.ok(skinned>=1,'v2 export must contain skinned meshes');
  assert.ok(hasUV,'all v2 meshes must carry UVs');
  assert.ok(triangles<=c.geometry.triangles_hard_cap,'v2 export over triangle budget');
  assert.ok(materials.size<=c.geometry.max_materials,'v2 export has too many materials');
  for(const name of c.skeleton.required_bones)assert.ok(bones.has(name),'GLB bone missing '+name);
  const bounds=new THREE.Box3().setFromObject(gltf.scene);
  const size=bounds.getSize(new THREE.Vector3()).toArray();
  c.geometry.dimensions_xyz_m.forEach((expected,i)=>{
    assert.ok(Math.abs(size[i]-expected)/expected<=c.geometry.dimension_tolerance_relative[i],
      'GLB dimension out of contract: axis '+i+' actual '+size[i]);
  });
  const exported=new Map(gltf.animations.map(clip=>[clip.name,clip]));
  for(const name of c.animations.runtime_required_clips){
    assert.ok(exported.has(name),'required runtime animation missing: '+name);
  }
  for(const required of clips.filter(x=>x.required_for_v2)){
    assert.ok(exported.has(required.name),'production clip missing '+required.name);
    const seconds=exported.get(required.name).duration;
    assert.ok(Math.abs(seconds-required.duration_ms/1000)<=.11,
      'incorrect animation timing '+required.name+': '+seconds);
  }
  console.log('Intruder v2 candidate GLB passed:',Math.round(triangles),'tris,',
    materials.size,'materials,',gltf.animations.length,'clips');
}
