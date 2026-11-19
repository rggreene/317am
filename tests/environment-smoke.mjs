import assert from 'node:assert/strict';

// CanvasTexture only stores the canvas until the renderer uploads it.
// A minimal painter lets us test complete scene assembly in Node without WebGL.
const ctx={
  fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){}
};
globalThis.document={createElement(tag){
  assert.equal(tag,'canvas');
  return {width:256,height:256,getContext(kind){assert.equal(kind,'2d');return ctx;}};
}};
const {buildRoom}=await import('../src/world/buildRoom.js');
const {HERO_LAYOUT,HERO_QUALITY}=await import('../src/world/heroLayout.js');
const world=buildRoom();
assert.ok(world.root.isGroup,'room must be a Three Group');
assert.ok(world.intruder.group.parent===world.root,'intruder remains in room');
assert.equal(HERO_LAYOUT.spawn.x,.05);
assert.equal(HERO_LAYOUT.spawn.z,1.70);
const meshes=[];
world.root.traverse(node=>{if(node.isMesh)meshes.push(node);});
assert.ok(meshes.length>=120,'expected improved hero-area details');
const names=new Set(meshes.map(x=>x.name));
for(const name of ['Laminate floor plank','Coffee table top','Television','Woven lounge rug','Refrigerator','Media cabinet'])
  assert.ok(names.has(name),'missing named hero asset: '+name);
assert.ok(meshes.some(mesh=>mesh.material?.map),'expected textured surfaces');
assert.ok(Object.keys(HERO_QUALITY).length>=5,'hero quality checklist missing');
for(const mesh of meshes){
  assert.ok([...mesh.position].every(Number.isFinite),'invalid mesh coordinate');
}
console.log('Hero environment assembled:',meshes.length,'meshes,',Object.keys(HERO_QUALITY).length,'quality categories');
