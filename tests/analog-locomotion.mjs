import assert from 'node:assert/strict';
import {createAnalogMovement,adjustAnalogMovement,wheelNotches,
  eyeHeightFor,speedFor,stanceDescription,paceDescription,movementAwareness,
  STANDING_EYE_HEIGHT,LOWEST_EYE_HEIGHT,MIN_PACE,MAX_PACE}
  from '../src/game/AnalogLocomotion.js';

const initial=createAnalogMovement();
assert.equal(initial.stance,1);
assert.equal(initial.pace,1.75);
assert.equal(eyeHeightFor(1),STANDING_EYE_HEIGHT);
assert.equal(eyeHeightFor(0),LOWEST_EYE_HEIGHT);
assert.equal(wheelNotches(-100),1);
assert.equal(wheelNotches(100),-1);
assert.ok(Math.abs(wheelNotches(-3,1)-1.02)<.00001);
assert.equal(wheelNotches(0),0);
assert.equal(wheelNotches(NaN),0);

const quick=adjustAnalogMovement(initial,-100,0,false);
assert.ok(quick.pace>initial.pace,'wheel up increases pace');
assert.equal(quick.stance,initial.stance,'pace wheel must not change stance');
const slow=adjustAnalogMovement(quick,100,0,false);
assert.equal(slow.pace,initial.pace,'wheel down reverses the speed adjustment');

const low=adjustAnalogMovement(initial,100,0,true);
assert.equal(low.pace,initial.pace,'holding C must not alter pace');
assert.ok(low.stance<initial.stance,'C+wheel down crouches');
const tall=adjustAnalogMovement(low,-100,0,true);
assert.equal(tall.stance,1,'C+wheel up raises posture');

let s=initial;
for(let i=0;i<80;i++)s=adjustAnalogMovement(s,100,0,true);
assert.equal(s.stance,0,'stance has a crouched endpoint');
assert.equal(eyeHeightFor(s.stance),LOWEST_EYE_HEIGHT);
assert.ok(speedFor(s)<1,'low crouch caps speed, even with high preferred pace');
for(let i=0;i<90;i++)s=adjustAnalogMovement(s,-100,0,true);
assert.equal(s.stance,1,'stance has a full-standing endpoint');
for(let i=0;i<80;i++)s=adjustAnalogMovement(s,-100,0,false);
assert.equal(s.pace,MAX_PACE,'preferred pace caps at full speed');
for(let i=0;i<90;i++)s=adjustAnalogMovement(s,100,0,false);
assert.equal(s.pace,MIN_PACE,'preferred pace has a quiet lower bound');

assert.ok(speedFor(initial,true)>speedFor(initial,false),
  'shift temporarily sprints when standing');
assert.equal(speedFor(low,true)<=2.9,true);
assert.equal(stanceDescription(0),'LOW CROUCH');
assert.equal(stanceDescription(1),'STANDING');
assert.equal(paceDescription(.4),'CREEP');
assert.ok(movementAwareness(.4,0)<movementAwareness(1.75,1));
assert.ok(movementAwareness(1.75,1)<movementAwareness(2.9,1));
assert.ok(movementAwareness(.5,0)<movementAwareness(.5,1));
console.log('Analog C+wheel stance, free-wheel pace, caps and sound ranges passed');
