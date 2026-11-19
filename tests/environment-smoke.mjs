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
assert.equal(world.artSlots.size,7,'seven living/bedroom hero replacements must be available');
for(const name of ['room_sofa_2seat','room_coffee_table','room_bed_dressed','room_dresser_phone','room_rug','room_media_console','prop_television']){
  const slot=world.artSlots.get(name);
  assert.ok(slot?.isGroup,'missing furniture art slot '+name);
  assert.equal(slot.userData.assetId,name);
  let count=0;
  slot.traverse(node=>{if(node.isMesh)count++;});
  assert.ok(count>=3,'hero geometry insufficient: '+name);
}
const meshes=[];
world.root.traverse(node=>{if(node.isMesh)meshes.push(node);});
assert.ok(meshes.length>=120,'expected improved hero-area details');
const names=new Set(meshes.map(x=>x.name));
for(const name of ['Laminate floor plank','Coffee table top','Television','Woven lounge rug','Refrigerator','Media cabinet'])
  assert.ok(names.has(name),'missing named hero asset: '+name);
assert.ok(meshes.some(mesh=>mesh.material?.map),'expected textured surfaces');
assert.ok(Object.keys(HERO_QUALITY).length>=5,'hero quality checklist missing');
assert.equal(typeof world.updateAmbience,'function');
world.updateAmbience(1.25);
const curtainCount=meshes.filter(x=>x.material?.transparent&&x.material?.opacity===.77).length;
assert.ok(curtainCount>=2,'expected curtain fabric in the environment');
for(const mesh of meshes){
  assert.ok([...mesh.position].every(Number.isFinite),'invalid mesh coordinate');
}
console.log('Hero environment assembled:',meshes.length,'meshes,',Object.keys(HERO_QUALITY).length,'quality categories');
