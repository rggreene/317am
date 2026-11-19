import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';

const manifest=JSON.parse(readFileSync(new URL('../assets/asset-manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.schema_version,1);
assert.equal(manifest.units,'meters');
assert.equal(manifest.up_axis_runtime,'Y');
assert.equal(manifest.policies.keep_procedural_fallback,true);
assert.equal(manifest.policies.no_automatic_replacement,true);
assert.ok(manifest.assets.length>=20,'missing planned hero assets');
const ids=new Set(),glbPaths=new Set(),sourcePaths=new Set();
const priorities=new Set(['P0','P1','P2']);
const statuses=new Set(manifest.statuses);
const categories=new Set(['furniture','prop','fixture','character','viewmodel','architecture','decor']);
for(const art of manifest.assets){
  assert.ok(typeof art.id==='string'&&/^[a-z][a-z0-9_]+$/.test(art.id),'bad id');
  assert.ok(!ids.has(art.id),'duplicate asset ID '+art.id);
  ids.add(art.id);
  assert.ok(categories.has(art.category),'bad category '+art.id);
  assert.ok(priorities.has(art.priority),'bad priority '+art.id);
  assert.ok(statuses.has(art.status),'bad status '+art.id);
  assert.ok(art.model_glb.startsWith('assets/models/')&&art.model_glb.endsWith('.glb'),'invalid GLB path '+art.id);
  assert.ok(art.source_blend.startsWith('assets/source/blender/')&&art.source_blend.endsWith('.blend'),'invalid Blender path '+art.id);
  assert.ok(!glbPaths.has(art.model_glb),'GLB path collision '+art.id);
  assert.ok(!sourcePaths.has(art.source_blend),'Blender source collision '+art.id);
  glbPaths.add(art.model_glb);
  sourcePaths.add(art.source_blend);
  assert.ok(Number.isInteger(art.max_triangles)&&art.max_triangles>0,'bad triangle budget');
  assert.ok(Number.isInteger(art.max_materials)&&art.max_materials>=1,'bad material budget');
  assert.ok([256,512,1024,2048,4096].includes(art.max_texture_edge_px),'bad texture size');
  assert.ok(Array.isArray(art.target_dimensions_m)&&art.target_dimensions_m.length===3&&
    art.target_dimensions_m.every(n=>Number.isFinite(n)&&n>0),'bad physical dimensions '+art.id);
  assert.ok(art.scene_origin_m===null||(
    Array.isArray(art.scene_origin_m)&&art.scene_origin_m.length===3&&
    art.scene_origin_m.every(Number.isFinite)),'bad origin '+art.id);
  assert.ok(typeof art.integration==='string'&&art.integration.startsWith('src/'),'missing code integration '+art.id);
  // The registry cannot call art "active" without the actual shipped GLB.
  if(art.status==='active'){
    assert.ok(existsSync(new URL('../'+art.model_glb,import.meta.url)),
      'active GLB missing from repository: '+art.id);
  }
}
for(const id of ['room_sofa_2seat','room_coffee_table','room_bed_dressed',
  'room_dresser_phone','prop_entry_door','char_intruder_v02','vm_player_arms_v01']){
  assert.ok(ids.has(id),'missing critical art asset '+id);
}
const counts=Object.fromEntries(['P0','P1','P2'].map(priority=>[
  priority,manifest.assets.filter(x=>x.priority===priority).length
]));
assert.ok(counts.P0>=8,'expected substantial immediate art scope');
console.log('Art asset manifest validated:',manifest.assets.length,'planned/reviewable entries',counts);
