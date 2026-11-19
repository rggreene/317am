import assert from 'node:assert/strict';
import {SEARCH_AREAS,areaForPosition,searchAreaPoint} from '../src/game/RoomNavigation.js';
import {findNavigationPath} from '../src/game/NavGrid.js';
import {canOccupy} from '../src/game/CombatMath.js';
assert.equal(new Set(SEARCH_AREAS.map(a=>a.id)).size,SEARCH_AREAS.length);
for(let i=0;i<SEARCH_AREAS.length;i++){
  const point=searchAreaPoint(i);
  assert.ok(canOccupy(point.x,point.z),SEARCH_AREAS[i].id+' must be traversable');
  const next=searchAreaPoint(i+1);
  assert.ok(findNavigationPath(point,next).length>0,
    SEARCH_AREAS[i].id+' must connect to the next search zone');
}
assert.equal(areaForPosition({x:2.7,z:2}),'entry');
assert.equal(areaForPosition({x:-1.5,z:1}),'bedroom');
console.log('Semantic search areas and navigation connectivity passed');
