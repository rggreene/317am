import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../nightfall-classic.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Nightfall inline script exists');
new vm.Script(script,{filename:'nightfall-classic.html'});
for(const token of ['player.stanceTarget','player.pace','playerGloveMesh.draw','playerSleeveMesh.draw','player.pendingStrike','resolvePlayerStrike','e.windup=.82','spatialBeep','function pathfind','function interact','function renderShadows','staticMesh.upload()']){
 assert.ok(script.includes(token),'Missing Nightfall system: '+token);
}
assert.ok(html.includes('MAIN MENU'),'Nightfall menu return exists');
console.log('Nightfall syntax and shared-system contract: OK');
