import assert from 'node:assert/strict';
import {qualityConfig,applyQualityPreset,nextQuality,QUALITY_ORDER} from '../src/rendering/QualityManager.js';
const dpr=1.5;
assert.equal(qualityConfig('cinematic',dpr).pixelRatio,2);
assert.equal(qualityConfig('balanced',dpr).pixelRatio,1.5);
assert.equal(qualityConfig('performance',dpr).shadows,false);
assert.equal(qualityConfig('unrecognized',dpr).name,'balanced');
let name='balanced';for(let i=0;i<3;i++)name=nextQuality(name);
assert.equal(name,'balanced','quality modes should cycle predictably');
assert.equal(QUALITY_ORDER.length,3);
const shadow={
  mapSize:{x:512,y:512,set(x,y){this.x=x;this.y=y;}},
  map:{disposed:false,dispose(){this.disposed=true;}},needsUpdate:false
};
const light={castShadow:true,shadow};
const renderer={
  shadowMap:{enabled:true,type:0,needsUpdate:false},
  lastRatio:1,setPixelRatio(value){this.lastRatio=value;}
};
const perf=applyQualityPreset(renderer,[light],'performance',dpr);
assert.equal(perf.name,'performance');
assert.equal(renderer.shadowMap.enabled,false);
assert.equal(light.castShadow,false);
assert.equal(shadow.mapSize.x,256);
assert.equal(shadow.map,null);
assert.ok(renderer.lastRatio<dpr);
const film=applyQualityPreset(renderer,[light],'cinematic',dpr);
assert.equal(renderer.shadowMap.enabled,true);
assert.equal(light.castShadow,true);
assert.equal(shadow.mapSize.x,1024);
assert.equal(film.pixelRatio,2);
console.log('Performance, balanced and cinematic quality presets passed');
