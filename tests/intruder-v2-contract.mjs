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
  // Node does not provide image decoding to GLTFLoader; parse the binary
  // structure here and require a real Chrome/WebGL test for texture/render QA.
  const bytes=readFileSync(projectUrl(c.output_glb));
  assert.equal(bytes.toString('ascii',0,4),'glTF','invalid GLB magic');
  assert.equal(bytes.readUInt32LE(4),2,'invalid GLB version');
  assert.equal(bytes.readUInt32LE(8),bytes.length,'invalid GLB byte length');
  const jsonLength=bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16),0x4E4F534A);
  const gltf=JSON.parse(bytes.toString('utf8',20,20+jsonLength));
  const binChunk=20+jsonLength;
  assert.equal(bytes.readUInt32LE(binChunk+4),0x004E4942);
  const dataStart=binChunk+8;
  assert.ok(gltf.skins?.length>=1,'candidate lacks an exported skin');
  const boneNames=new Set(gltf.skins[0].joints.map(index=>gltf.nodes[index]?.name));
  for(const name of c.skeleton.required_bones)assert.ok(boneNames.has(name),'missing joint: '+name);
  const allPrimitives=gltf.meshes.flatMap(mesh=>mesh.primitives);
  assert.ok(allPrimitives.length>=1,'GLB must include meshes');
  assert.ok(gltf.materials.length<=c.geometry.max_materials,'too many materials');
  assert.ok(gltf.materials.every(x=>!(x.emissiveFactor||[]).some(v=>v>0)),
    'no emissive glow is permitted');
  let triangles=0,vertexCount=0;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const primitive of allPrimitives){
    assert.ok(primitive.attributes.JOINTS_0!==undefined,'skinned joints missing');
    assert.ok(primitive.attributes.WEIGHTS_0!==undefined,'skin weights missing');
    assert.ok(primitive.attributes.NORMAL!==undefined,'vertex normals missing');
    assert.ok(primitive.attributes.TEXCOORD_0!==undefined,'UV coordinates missing');
    const pos=gltf.accessors[primitive.attributes.POSITION];
    const index=gltf.accessors[primitive.indices];
    assert.equal(index.count%3,0,'triangle indices not divisible by three');
    triangles+=index.count/3;
    vertexCount+=pos.count;
    for(let a=0;a<3;a++){
      min[a]=Math.min(min[a],pos.min[a]);
      max[a]=Math.max(max[a],pos.max[a]);
    }
    const weights=gltf.accessors[primitive.attributes.WEIGHTS_0];
    const view=gltf.bufferViews[weights.bufferView];
    assert.equal(weights.type,'VEC4');
    assert.equal(weights.componentType,5126);
    for(let i=0;i<weights.count;i++){
      const offset=dataStart+(view.byteOffset||0)+(weights.byteOffset||0)+i*16;
      let sum=0;
      for(let k=0;k<4;k++){
        const w=bytes.readFloatLE(offset+k*4);
        assert.ok(Number.isFinite(w)&&w>=-.0001&&w<=1.0001);
        sum+=w;
      }
      assert.ok(Math.abs(sum-1)<.015,'skin weights must normalize: '+i);
    }
  }
  assert.ok(vertexCount>5000,'v2 candidate is too simple');
  assert.ok(triangles>=c.geometry.triangles_target_min,'under target geometry quality');
  assert.ok(triangles<=c.geometry.triangles_hard_cap,'over triangle budget');
  const size=min.map((v,i)=>max[i]-v);
  size.forEach((actual,i)=>{
    const expected=c.geometry.dimensions_xyz_m[i];
    assert.ok(Math.abs(actual-expected)/expected<=c.geometry.dimension_tolerance_relative[i],
      'bounds mismatch axis '+i+': '+actual+' expected '+expected);
  });
  assert.ok(Array.isArray(gltf.images)&&gltf.images.length>=3,'PBR maps missing');
  for(const image of gltf.images){
    assert.equal(image.mimeType,'image/png');
    const view=gltf.bufferViews[image.bufferView],offset=dataStart+view.byteOffset;
    assert.equal(bytes.toString('hex',offset,offset+8),'89504e470d0a1a0a','invalid embedded PNG');
    const width=bytes.readUInt32BE(offset+16),height=bytes.readUInt32BE(offset+20);
    assert.ok(width<=c.geometry.max_texture_edge_px&&height<=c.geometry.max_texture_edge_px,
      'embedded texture exceeds budget');
  }
  const exported=new Map((gltf.animations||[]).map(clip=>[clip.name,clip]));
  for(const required of clips.filter(x=>x.required_for_v2)){
    const animation=exported.get(required.name);
    assert.ok(animation,'candidate action missing '+required.name);
    assert.ok(animation.samplers.length>0,'empty action '+required.name);
    const input=gltf.accessors[animation.samplers[0].input];
    const duration=input.max[0];
    assert.ok(Math.abs(duration-required.duration_ms/1000)<.11,
      'action duration mismatch '+required.name+': '+duration);
  }
  console.log('The Uninvited v2 GLB binary validated:',triangles,
    'triangles,',gltf.materials.length,'materials,',
    boneNames.size,'joints,',exported.size,'actions and embedded PBR maps');
}
