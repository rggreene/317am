import assert from 'node:assert/strict';
import * as THREE from 'three';
import {surfaceMaps,finishFurnitureMaterials} from '../src/assets/ArtMaterialFinish.js';
const woven=surfaceMaps('fabric'),wood=surfaceMaps('wood');
assert.equal(woven.normal.image.width,128);
assert.equal(woven.roughness.image.height,128);
assert.equal(surfaceMaps('fabric'),woven,'maps should be cached and shared');
assert.notDeepEqual([...woven.normal.image.data.slice(0,24)],
  [...wood.normal.image.data.slice(0,24)],'wood and fabric should have distinct microstructure');
assert.equal(woven.normal.colorSpace,THREE.NoColorSpace);
const root=new THREE.Group();
const one=new THREE.Mesh(new THREE.BoxGeometry(.6,.2,.7),
  new THREE.MeshStandardMaterial({name:'Seat cushions',roughness:.94}));
const two=new THREE.Mesh(new THREE.BoxGeometry(1,.3,.4),
  new THREE.MeshStandardMaterial({name:'Walnut hardwood'}));
const three=new THREE.Mesh(new THREE.BoxGeometry(.7,.1,.5),
  new THREE.MeshStandardMaterial({name:'Aged brass'}));
root.add(one,two,three);
assert.equal(finishFurnitureMaterials(root),2);
assert.ok(one.material.normalMap&&one.material.roughnessMap);
assert.ok(two.material.normalMap&&two.material.roughnessMap);
assert.equal(three.material.normalMap,null);
assert.ok(one.material.normalScale.x>0&&one.material.normalScale.x<.5);
console.log('PBR micro-surface maps for imported upholstery and wood validated');
