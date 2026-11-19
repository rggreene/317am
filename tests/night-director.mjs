import assert from 'node:assert/strict';
import * as THREE from 'three';

// Browserless scene smoke test. Integration wiring is exercised through the
// real NightDirector rather than reimplementing its rules.
const ctx={fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){}};
const dom=new Map();
const classes=()=>({
  values:new Set(),add(...values){for(const v of values)this.values.add(v);},
  remove(...values){for(const v of values)this.values.delete(v);},
  toggle(v,force){if(force===undefined)force=!this.values.has(v);
    if(force)this.values.add(v);else this.values.delete(v);return force;},
  contains(v){return this.values.has(v);}
});
function node(id){
  if(!dom.has(id))dom.set(id,{id,hidden:true,textContent:'',classList:classes()});
  return dom.get(id);
}
globalThis.document={
  createElement(type){
    assert.equal(type,'canvas');
    return {width:256,height:256,getContext(){return ctx;}};
  },
  querySelector(id){return node(id);},
  pointerLockElement:null,
  exitPointerLock(){this.pointerLockElement=null;}
};
globalThis.window={};
const {NightDirector}=await import('../src/game/NightDirector.js');
const camera=new THREE.PerspectiveCamera();
camera.position.set(.05,1.64,1.70);
const scene=new THREE.Scene();
const actor=new THREE.Group();
scene.add(actor);
const output=[];
const game={
  view:{scene,camera},
  intruder:{group:actor},
  riggedIntruder:null,
  rootElement:{classList:classes()},
  setBreakerPower(v){this.power=v;},
  combat:{
    canvas:{},
    hitCount:0,
    keys:new Set(),
    yaw:0,pitch:0,
    weapon:{setVisible(){},swingTime:0,hitStop:0},
    root:{classList:classes()},
    cameraKick:{velocity:0},
    setFeedback(message){output.push(message);}
  }
};
const night=new NightDirector(game);
assert.equal(night.state.phase,'idle');
assert.equal(node('#night-clock').textContent,'01:15','timer should be correctly formatted');
night.enter();
assert.equal(night.state.phase,'playing');
assert.equal(actor.visible,false,'enemy should start hidden');
camera.position.set(-2.7,1.64,1.46);
night.interact();
assert.equal(night.state.helpCalled,true,'phone must be reachable');
camera.position.set(2.70,1.64,2.11);
night.interact();
assert.equal(night.state.doorSecured,true,'door must be reachable');
camera.position.set(2.78,1.64,.38);
night.interact();
assert.equal(night.state.breakerOn,false,'breaker must toggle');
assert.equal(game.power,false,'breaker should affect lighting');
night.interact();
assert.equal(night.state.breakerOn,true,'breaker should toggle back on');
night.state.health=61;
camera.position.set(-.53,1.64,-1.26);
night.interact();
assert.equal(night.state.medkitUsed,true,'first aid must be reachable');
assert.equal(night.state.health,99,'one use should heal by 38');
camera.position.set(.05,1.64,1.70);
night.state.elapsed=24.98;night.state.remaining=75-24.98;
night.update(.05);
assert.equal(night.state.enemyEntered,true,'barricade delays enemy to 25 seconds');
assert.equal(actor.visible,true,'intruder becomes visible at entry');
night.onPlayerHit();
assert.ok(night.state.enemyStun>0,'player strike stuns enemy');
night.state.elapsed=74.99;night.state.remaining=.01;
night.update(.05);
assert.equal(night.state.phase,'won','help called and timer finished means win');
assert.equal(node('#night-end').hidden,false,'end screen visible in first-person');
night.pause();
assert.equal(node('#night-end').hidden,true,'orbit lab should not be blocked by overlay');
night.restart();
assert.equal(night.state.phase,'playing','night restarts cleanly');
assert.equal(night.state.health,100);
assert.equal(night.state.helpCalled,false);
console.log('NightDirector browserless interaction and win/restart integration checks passed');
