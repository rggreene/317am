import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const b=readFileSync(new URL('../assets/models/intruder_rig.glb',import.meta.url));
assert.equal(b.toString('ascii',0,4),'glTF');
assert.equal(b.readUInt32LE(4),2);
assert.equal(b.readUInt32LE(8),b.length);
const n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n).toString('utf8')),pos=20+n;
assert.equal(b.toString('ascii',16,20),'JSON');
assert.equal(b.toString('ascii',pos+4,pos+7),'BIN');
assert.equal(b.readUInt32LE(pos),g.buffers[0].byteLength);
const joints=g.skins?.[0]?.joints;
assert.ok(joints?.length>=10,'need 10+ rig joints');
const ibm=g.accessors[g.skins[0].inverseBindMatrices];
assert.equal(ibm.type,'MAT4');assert.equal(ibm.count,joints.length);
for(const p of g.meshes[0].primitives){
  const a=p.attributes;
  for(const k of ['POSITION','NORMAL','JOINTS_0','WEIGHTS_0'])assert.ok(a[k]!==undefined,'missing '+k);
  const nVerts=g.accessors[a.POSITION].count;
  for(const k of ['NORMAL','JOINTS_0','WEIGHTS_0'])assert.equal(nVerts,g.accessors[a[k]].count);
  const view=g.bufferViews[g.accessors[a.JOINTS_0].bufferView];
  for(let i=0;i<nVerts;i++)assert.ok(b[pos+8+view.byteOffset+4*i]<joints.length,'invalid vertex joint');
}
assert.deepEqual(g.animations.map(a=>a.name).sort(),['attack','idle','stagger','walk']);
for(const a of g.animations){
  assert.ok(a.channels.length>=4);
  for(const channel of a.channels){
    assert.equal(channel.target.path,'rotation');
    assert.ok(joints.includes(channel.target.node));
    const s=a.samplers[channel.sampler];
    assert.equal(g.accessors[s.input].count,g.accessors[s.output].count);
    assert.equal(g.accessors[s.output].type,'VEC4');
  }
}
console.log('Animated intruder verified:',joints.length,'joints',g.animations.map(a=>a.name));
