import * as THREE from 'three';
import {WeaponRig} from './WeaponRig.js';
import {ImpactAudio} from '../audio/ImpactAudio.js';
import {dampedSpring} from './ImpactQuality.js';
import {isMeleeHit,moveWithCollision,APARTMENT_BLOCKERS,PLAYER_RADIUS} from './CombatMath.js';
import {createAnalogMovement,adjustAnalogMovement,eyeHeightFor,speedFor,
  paceDescription,stanceDescription,STANDING_EYE_HEIGHT,MAX_PACE}
  from './AnalogLocomotion.js';

const PLAYER_HEIGHT=STANDING_EYE_HEIGHT;
const MELEE_REACH=1.55;
const MELEE_FACING=.84;

export class CombatLab{
  constructor({view,canvas,root,onHit=()=>{},onEnter=()=>{},getTarget=()=>new THREE.Vector3(.28,1.43,-.38),canHit=()=>true}){
    this.view=view;this.canvas=canvas;this.root=root;
    this.onHit=onHit;this.onEnter=onEnter;this.getTarget=getTarget;this.canHit=canHit;
    this.hurtTime=0;
    this.active=false;this.locked=false;
    this.keys=new Set();
    this.analog=createAnalogMovement();
    this.eyeHeight=PLAYER_HEIGHT;
    this.currentSpeed=0;
    this.actualSpeed=0;
    this.getCollisionBlockers=()=>APARTMENT_BLOCKERS;
    this.yaw=-.10;this.pitch=-.085;this.walkClock=0;this.hitCount=0;
    this.flashTime=0;this.statusTime=0;this.markerTime=0;
    this.direction=new THREE.Vector3();
    this.audio=new ImpactAudio();
    this.cameraKick={value:0,velocity:0};
    this.weapon=new WeaponRig(view.camera,()=>this.applyImpact());
    view.scene.add(view.camera);

    window.addEventListener('keydown',event=>{
      if(event.code==='KeyV'&&!event.repeat&&!event.ctrlKey&&!event.metaKey){
        this.toggleMode();event.preventDefault();
      }
      if(this.active){
        this.keys.add(event.code);
        if(event.code==='KeyC')event.preventDefault();
      }
    });
    window.addEventListener('keyup',event=>this.keys.delete(event.code));
    window.addEventListener('blur',()=>this.keys.clear());
    window.addEventListener('wheel',event=>{
      // In orbit mode the mouse wheel must remain a zoom control.
      if(!this.active||event.ctrlKey||event.metaKey)return;
      event.preventDefault();
      this.analog=adjustAnalogMovement(this.analog,event.deltaY,event.deltaMode,
        this.keys.has('KeyC'));
      this.updateMovementHud();
    },{passive:false});
    document.addEventListener('pointerlockchange',()=>{
      this.locked=document.pointerLockElement===this.canvas;
      this.updateStatus();
    });
    document.addEventListener('mousemove',event=>{
      if(!this.active||!this.locked)return;
      const dx=THREE.MathUtils.clamp(event.movementX,-180,180);
      const dy=THREE.MathUtils.clamp(event.movementY,-180,180);
      this.yaw-=dx*.0021;
      this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0021,-1.30,1.30);
      this.weapon.addLookSway(dx,dy);
    });
    canvas.addEventListener('mousedown',event=>{
      if(!this.active||event.button!==0)return;
      event.preventDefault();
      if(!this.locked){
        try{
          const pending=canvas.requestPointerLock?.();
          pending?.catch?.(()=>this.setFeedback('MOUSE CAPTURE BLOCKED · CLICK SCENE AGAIN'));
        }catch(error){this.setFeedback('CLICK SCENE TO CAPTURE THE MOUSE');}
        return;
      }
      if(this.weapon.swing())this.audio.swing();
      else if(!this.weapon.assetLoaded)this.setFeedback('FRYING PAN IS STILL LOADING');
    });
    document.querySelector('#play-mode')?.addEventListener('click',()=>this.toggleMode());
    this.updateStatus();
    this.updateMovementHud();
  }
  resetMovement(){
    this.analog=createAnalogMovement();
    this.eyeHeight=PLAYER_HEIGHT;
    this.currentSpeed=0;
    this.actualSpeed=0;
    this.updateMovementHud();
  }
  updateMovementHud(){
    const stance=document.querySelector('#stance-readout');
    const pace=document.querySelector('#pace-readout');
    const stanceMeter=document.querySelector('#stance-meter');
    const paceMeter=document.querySelector('#pace-meter');
    if(stance)stance.textContent='STANCE · '+stanceDescription(this.analog.stance);
    if(pace)pace.textContent='PACE · '+this.analog.pace.toFixed(2)+
      ' M/S · '+paceDescription(this.analog.pace);
    if(stanceMeter)stanceMeter.style.width=(this.analog.stance*100).toFixed(1)+'%';
    if(paceMeter)paceMeter.style.width=(this.analog.pace/MAX_PACE*100).toFixed(1)+'%';
    this.root.dataset.analogStance=this.analog.stance.toFixed(3);
    this.root.dataset.analogPace=this.analog.pace.toFixed(3);
  }
  toggleMode(){this.active?this.exit():this.enter();}
  enter(){
    if(this.active)return;
    this.onEnter();
    const {camera,controls}=this.view;
    this.orbitState={
      position:camera.position.clone(),
      quaternion:camera.quaternion.clone(),
      target:controls.target.clone(),
      fov:camera.fov
    };
    controls.enabled=false;
    this.keys.clear();
    this.active=true;
    this.resetMovement();
    this.yaw=-.10;this.pitch=-.085;this.walkClock=0;
    this.cameraKick={value:0,velocity:0};
    camera.fov=72;camera.updateProjectionMatrix();
    camera.position.set(.05,PLAYER_HEIGHT,1.70);
    camera.rotation.order='YXZ';
    camera.rotation.set(this.pitch,this.yaw,0);
    this.weapon.setVisible(true);
    this.root.classList.add('fps-mode');
    this.setFeedback('CLICK SCENE TO CAPTURE THE MOUSE');
    this.updateStatus();
  }
  exit(){
    if(!this.active)return;
    this.active=false;this.locked=false;this.keys.clear();
    if(document.pointerLockElement===this.canvas)document.exitPointerLock?.();
    this.weapon.setVisible(false);
    const {camera,controls}=this.view;
    camera.position.copy(this.orbitState.position);
    camera.quaternion.copy(this.orbitState.quaternion);
    camera.fov=this.orbitState.fov;camera.updateProjectionMatrix();
    controls.target.copy(this.orbitState.target);
    controls.enabled=true;controls.update();
    this.root.classList.remove('fps-mode','impact','miss','hit-confirm','player-hurt');
    this.root.dispatchEvent(new CustomEvent('night-pause'));
    this.updateStatus();
  }
  updateStatus(){
    const mode=document.querySelector('#mode-status');
    if(mode)mode.textContent=this.active?
      (this.locked?'PRACTICE MODE · READY':'PRACTICE MODE · CLICK TO CAPTURE'):
      'ORBIT LAB · PRESS V TO PLAY';
    const button=document.querySelector('#play-mode');
    if(button)button.textContent=this.active?'RETURN TO ORBIT  [V]':'ENTER FIRST PERSON  [V]';
  }
  setFeedback(text){
    const node=document.querySelector('#combat-feedback');
    if(node)node.textContent=text;
    this.statusTime=1.4;
  }
  applyImpact(){
    const camera=this.view.camera;
    camera.getWorldDirection(this.direction);
    const target=this.getTarget();
    const hit=this.canHit()&&isMeleeHit(camera.position,this.direction,target,MELEE_REACH,MELEE_FACING);
    this.weapon.contact(hit);
    this.root.classList.remove('impact','miss','hit-confirm');
    if(hit){
      this.hitCount++;
      const count=document.querySelector('#hit-count');
      if(count)count.textContent=String(this.hitCount);
      this.root.classList.add('impact','hit-confirm');
      this.flashTime=.13;this.markerTime=.21;
      this.cameraKick.velocity+=.12;
      this.setFeedback('CONTACT · INTRUDER RECOILS');
      this.onHit({attacker:{x:camera.position.x,z:camera.position.z},target});
      this.audio.impact();
    }else{
      this.root.classList.add('miss');
      this.flashTime=.10;
      this.setFeedback('MISSED · STEP CLOSER AND FACE THE TARGET');
    }
  }
  update(dt){
    if(!this.active)return;
    const camera=this.view.camera;
    const forward=Number(this.keys.has('KeyW'))-Number(this.keys.has('KeyS'));
    const strafe=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
    const mag=Math.hypot(forward,strafe)||1;
    const moving=forward!==0||strafe!==0;
    const preferred=speedFor(this.analog,this.keys.has('ShiftLeft'));
    const targetSpeed=moving?preferred:0;
    this.currentSpeed+=(targetSpeed-this.currentSpeed)*
      (1-Math.exp(-dt*(moving?8:12)));
    const mx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*strafe)/
      mag*this.currentSpeed*dt;
    const mz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*strafe)/
      mag*this.currentSpeed*dt;
    const oldX=camera.position.x,oldZ=camera.position.z;
    const next=moveWithCollision(oldX,oldZ,mx,mz,PLAYER_RADIUS,
      this.getCollisionBlockers());
    camera.position.x=next.x;camera.position.z=next.z;
    // Actual distance matters: walking into a blocked sofa makes no footfall.
    this.actualSpeed=dt>0?
      Math.hypot(next.x-oldX,next.z-oldZ)/dt:0;
    if(this.actualSpeed>.08)this.walkClock+=dt*(4+this.actualSpeed*3);
    this.eyeHeight+=(eyeHeightFor(this.analog.stance)-this.eyeHeight)*
      (1-Math.exp(-dt*9));
    const bob=this.actualSpeed>.08?
      Math.sin(this.walkClock)*(.003+this.actualSpeed*.004)*
      (.5+.5*this.analog.stance):
      Math.sin(performance.now()*.0018)*.002;
    camera.position.y=this.eyeHeight+bob;
    this.cameraKick=dampedSpring(this.cameraKick.value,this.cameraKick.velocity,dt,23);
    camera.rotation.order='YXZ';
    camera.rotation.set(this.pitch+this.cameraKick.value,this.yaw,0);
    this.weapon.update(dt,moving);
    if(this.hurtTime>0){
      this.hurtTime=Math.max(0,this.hurtTime-dt);
      if(!this.hurtTime)this.root.classList.remove('player-hurt');
    }
    if(this.flashTime>0){
      this.flashTime=Math.max(0,this.flashTime-dt);
      if(!this.flashTime)this.root.classList.remove('impact','miss');
    }
    if(this.markerTime>0){
      this.markerTime=Math.max(0,this.markerTime-dt);
      if(!this.markerTime)this.root.classList.remove('hit-confirm');
    }
    if(this.statusTime>0){
      this.statusTime=Math.max(0,this.statusTime-dt);
      if(!this.statusTime){
        const text=document.querySelector('#combat-feedback');
        if(text)text.textContent='LEFT CLICK · SWING THE PAN';
      }
    }
  }
}
