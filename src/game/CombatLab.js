import * as THREE from 'three';
import {WeaponRig} from './WeaponRig.js';
import {isMeleeHit,moveWithCollision} from './CombatMath.js';

const PLAYER_HEIGHT=1.64;
export class CombatLab {
  constructor({view,canvas,root,onHit=()=>{},onEnter=()=>{}}){
    this.view=view;this.canvas=canvas;this.root=root;this.onHit=onHit;this.onEnter=onEnter;
    this.active=false;this.locked=false;
    this.keys=new Set();
    this.yaw=-0.10;this.pitch=-0.085;this.walkClock=0;this.hitCount=0;
    this.flashTime=0;this.statusTime=0;
    this.target=new THREE.Vector3(.28,1.43,-.38);
    this.direction=new THREE.Vector3();
    this.weapon=new WeaponRig(view.camera,()=>this.applyImpact());
    view.scene.add(view.camera); // Camera children (arms and glTF prop) must be in the scene graph.

    window.addEventListener('keydown',event=>{
      if(event.code==='KeyV'&&!event.repeat&&!event.ctrlKey&&!event.metaKey){
        this.toggleMode();
        event.preventDefault();
      }
      if(this.active)this.keys.add(event.code);
    });
    window.addEventListener('keyup',event=>this.keys.delete(event.code));
    window.addEventListener('blur',()=>this.keys.clear());
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
        try{const promise=canvas.requestPointerLock?.();promise?.catch?.(()=>this.setFeedback('MOUSE LOCK WAS BLOCKED'));}
        catch{this.setFeedback('CLICK THE SCENE TO CAPTURE MOUSE');}
        return;
      }
      if(this.weapon.swing())this.sound('swing');
      else if(!this.weapon.assetLoaded)this.setFeedback('WEAPON IS STILL LOADING');
    });
    document.querySelector('#play-mode')?.addEventListener('click',()=>{
      this.toggleMode();
    });
    this.updateStatus();
  }

  toggleMode(){
    if(this.active)this.exit();
    else this.enter();
  }
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
    this.yaw=-.10;this.pitch=-.085;this.walkClock=0;
    camera.fov=72;
    camera.updateProjectionMatrix();
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
    controls.enabled=true;
    controls.update();
    this.root.classList.remove('fps-mode','impact','miss');
    this.updateStatus();
  }
  updateStatus(){
    const mode=document.querySelector('#mode-status');
    if(mode)mode.textContent=this.active?(this.locked?'PRACTICE MODE · PAN READY':'PRACTICE MODE · CLICK TO CAPTURE'):'ORBIT LAB · PRESS V TO PLAY';
    const play=document.querySelector('#play-mode');
    if(play)play.textContent=this.active?'RETURN TO ORBIT  [V]':'ENTER FIRST PERSON  [V]';
  }
  setFeedback(text){
    const node=document.querySelector('#combat-feedback');
    if(node)node.textContent=text;
    this.statusTime=1.55;
  }
  sound(kind){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    try{
      if(!this.audio)this.audio=new AudioContext();
      if(this.audio.state==='suspended')void this.audio.resume();
      const time=this.audio.currentTime;
      const osc=this.audio.createOscillator(),gain=this.audio.createGain();
      osc.type=kind==='hit'?'triangle':'sawtooth';
      const start=kind==='hit'?145:360;
      osc.frequency.setValueAtTime(start,time);
      osc.frequency.exponentialRampToValueAtTime(kind==='hit'?48:110,time+(kind==='hit'?.15:.11));
      gain.gain.setValueAtTime(.0001,time);
      gain.gain.exponentialRampToValueAtTime(kind==='hit'?.055:.021,time+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,time+(kind==='hit'?.17:.13));
      osc.connect(gain);gain.connect(this.audio.destination);
      osc.start(time);osc.stop(time+.2);
    }catch(error){console.warn('Combat sound unavailable',error);}
  }

  applyImpact(){
    this.view.camera.getWorldDirection(this.direction);
    const hit=isMeleeHit(this.view.camera.position,this.direction,this.target);
    if(hit){
      this.hitCount++;
      document.querySelector('#hit-count').textContent=String(this.hitCount);
      this.root.classList.add('impact');
      this.flashTime=.23;
      this.setFeedback('SOLID HIT · INTRUDER STAGGERS');
      this.onHit();
      this.sound('hit');
    }else{
      this.root.classList.add('miss');
      this.flashTime=.16;
      this.setFeedback('MISSED · GET CLOSER AND FACE THE INTRUDER');
    }
  }

  update(dt){
    if(!this.active)return;
    const camera=this.view.camera;
    const forward=Number(this.keys.has('KeyW'))-Number(this.keys.has('KeyS'));
    const strafe=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
    const mag=Math.hypot(forward,strafe)||1;
    const moving=forward!==0||strafe!==0;
    const speed=this.keys.has('ShiftLeft')?2.9:1.75;
    const mx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*strafe)/mag*speed*dt;
    const mz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*strafe)/mag*speed*dt;
    const position=moveWithCollision(camera.position.x,camera.position.z,mx,mz);
    camera.position.x=position.x;camera.position.z=position.z;
    if(moving)this.walkClock+=dt*(this.keys.has('ShiftLeft')?13:9);
    camera.position.y=PLAYER_HEIGHT+(moving?Math.sin(this.walkClock)*.014:Math.sin(performance.now()*.0018)*.004);
    camera.rotation.order='YXZ';camera.rotation.set(this.pitch,this.yaw,0);
    this.weapon.update(dt,moving);
    if(this.flashTime>0){
      this.flashTime-=dt;
      if(this.flashTime<=0)this.root.classList.remove('impact','miss');
    }
    if(this.statusTime>0){
      this.statusTime-=dt;
      if(this.statusTime<=0&&document.querySelector('#combat-feedback'))document.querySelector('#combat-feedback').textContent='LEFT CLICK · SWING THE PAN';
    }
  }
}
