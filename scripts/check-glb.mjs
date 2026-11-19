// No dependencies needed: validates the committed frying pan GLB container.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const b=readFileSync(new URL('../assets/models/frying_pan.glb',import.meta.url));
assert.equal(b.toString('ascii',0,4),'glTF','invalid GLB header');
assert.equal(b.readUInt32LE(4),2,'GLB version must be 2');
assert.equal(b.readUInt32LE(8),b.length,'invalid total byte length');
const jsonLength=b.readUInt32LE(12);
assert.equal(b.toString('ascii',16,20),'JSON','missing JSON chunk');
const json=JSON.parse(b.subarray(20,20+jsonLength).toString('utf8'));
assert.equal(json.asset.version,'2.0');
assert.ok(json.meshes?.[0]?.primitives?.length>=3,'missing material submeshes');
assert.ok(json.materials?.length>=3,'PBR materials missing');
const offset=20+jsonLength;
assert.equal(b.toString('ascii',offset+4,offset+7),'BIN','missing binary chunk');
assert.equal(json.buffers[0].byteLength,b.readUInt32LE(offset),'binary length mismatch');
for(const access of json.accessors)assert.ok(access.count>0 && access.bufferView>=0);
console.log('GLB verified:',b.length,'bytes',json.meshes[0].primitives.length,'primitives');
