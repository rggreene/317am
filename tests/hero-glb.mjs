import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

globalThis.self ??= globalThis;
const manifest=JSON.parse(readFileSync(new URL('../assets/asset-manifest.json',import.meta.url),'utf8'));
const required=['room_sofa_2seat','room_coffee_table','room_bed_dressed','room_dresser_phone'];
for(const id of required){
  const art=manifest.assets.find(x=>x.id===id);
  assert.ok(art,'missing hero asset '+id);
  assert.equal(art.status,'in_review','new GLB should remain under visual review');
  assert.equal(art.source_kind,'reproducible_procedural_glb');
  const data=readFileSync(new URL('../'+art.model_glb,import.meta.url));
  const buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
  const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(buffer,'',resolve,reject));
  const bounds=new THREE.Box3().setFromObject(gltf.scene);
  const actual=bounds.getSize(new THREE.Vector3()).toArray();
  for(let i=0;i<3;i++){
    assert.ok(Number.isFinite(actual[i])&&actual[i]>.01,'invalid GLB dimension');
    assert.ok(Math.abs(actual[i]-art.target_dimensions_m[i])/
      art.target_dimensions_m[i]<.40,'incorrect GLB scale '+id);
  }
  let tri=0,materials=new Set(),verts=0;
  gltf.scene.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const n=mesh.geometry.getIndex()?.count??mesh.geometry.attributes.position.count;
    tri+=n/3;
    verts+=mesh.geometry.attributes.position.count;
    const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const mat of list)materials.add(mat.name);
    assert.ok(mesh.geometry.attributes.normal,'GLB must provide authored normals');
    assert.ok(mesh.geometry.attributes.uv,'GLB must provide UVs');
  });
  assert.ok(tri>600,'hero GLB too simple: '+id);
  assert.ok(tri<=art.max_triangles,'triangle budget exceeded: '+id);
  assert.ok(materials.size<=art.max_materials,'material budget exceeded: '+id);
  assert.ok(verts>500,'hero model lacks geometry');
  console.log(id,'GLB validated:',data.byteLength,'bytes,',tri,'tris,',
    materials.size,'materials, dimensions',actual.map(n=>n.toFixed(2)).join(' × '));
}
