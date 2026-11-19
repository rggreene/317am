import * as THREE from 'three';
import {createNight,beginNight,tickNight,nightEvent,nightObjective,nearestInteractable} from './SurvivalRules.js';
import {findNavigationPath,navigateStep} from './NavGrid.js';
import {buildInteractionProps} from './buildInteractionProps.js';
import {NightAudio} from '../audio/NightAudio.js';

const THREAT_SPAWN={x:2.73,z:2.12};
const ENEMY_SPEED=.67;
const ATTACK_RANGE=1.08;
const REPATH_INTERVAL=.65;

export class NightDirector{
  constructor(game){
    this.game=game;
    this.state=createNight();
    this.props=buildInteractionProps(game.view.scene);
    this.audio=new NightAudio();
    this.active=false;
    this.heldTarget=null;
    this.path=[];
    this.pathAge=0;
    this.enemyPosition={...THREAT_SPAWN};
    this.actorState='idle';
    this.lastStepAt=-100;
    this.interactable=null;
    this.feedbackTimer=0;
    this.endedHandled=false;
    this.lastPhase='idle';
    this.updatePresentation();
  }

  get actor(){
    return this.game.riggedIntruder?.group??this.game.intruder.group;
  }
  get target(){
    return this.game.riggedIntruder;
  }
  showEnemy(visible){
    this.actor.visible=visible;
  }
  setEnemyPosition(x,z){
    this.enemyPosition.x=x;
    this.enemyPosition.z=z;
    if(this.game.riggedIntruder){
      this.game.riggedIntruder.setBasePosition(x,z);
    }else{
      this.game.intruder.group.position.set(x,0,z);
    }
  }
  onRigReady(){
    this.setEnemyPosition(this.enemyPosition.x,this.enemyPosition.z);
    this.showEnemy(!this.active||this.state.enemyEntered);
  }
  enter(){
    if(this.state.phase==='won'||this.state.phase==='lost'){
      this.restart();
    }else{
      beginNight(this.state);
    }
    this.active=true;
    this.showEnemy(this.state.enemyEntered);
    this.pathAge=0;
    this.audio.enter();
    this.endedHandled=false;
    this.updatePresentation();
  }
  pause(){
    this.active=false;
    this.audio.pause();
    this.showEnemy(true); // Orbit lab remains useful for inspection.
    this.updatePresentation();
  }
  restart(){
    this.state=createNight();
    this.endedHandled=false;
    this.lastPhase='idle';
    this.path=[];
    this.pathAge=0;
    this.actorState='idle';
    this.setEnemyPosition(THREAT_SPAWN.x,THREAT_SPAWN.z);
    this.active=true;
    beginNight(this.state);
    this.showEnemy(false);
    this.game.combat.hitCount=0;
    this.game.combat.weapon.setVisible(true);
    this.game.combat.weapon.swingTime=.76;
    this.game.combat.keys.clear();
    this.game.combat.yaw=-.10;
    this.game.combat.pitch=-.085;
    this.game.view.camera.position.set(.05,1.64,1.70);
    this.game.combat.weapon.hitStop=0;
    const counter=document.querySelector('#hit-count');
    if(counter)counter.textContent='0';
    this.audio.enter();
    this.updatePresentation();
  }
  interact(){
    if(!this.active||this.state.phase!=='playing')return;
    const camera=this.game.view.camera;
    const item=nearestInteractable({x:camera.position.x,z:camera.position.z},
      this.props.items.map(it=>({...it,disabled:this.isDisabled(it.id)})));
    if(!item){
      this.game.combat.setFeedback('NOT CLOSE ENOUGH TO INTERACT');
      return;
    }
    let accepted=false;
    switch(item.id){
      case 'phone':accepted=nightEvent(this.state,'phone');if(accepted)this.audio.call();break;
      case 'door':accepted=nightEvent(this.state,'barricade');if(accepted)this.audio.door();break;
      case 'breaker':accepted=nightEvent(this.state,'breaker');if(accepted)this.audio.click();break;
      case 'medkit':accepted=nightEvent(this.state,'medkit');if(accepted)this.audio.click();break;
    }
    if(accepted){
      this.game.combat.setFeedback(this.state.message);
      this.updatePresentation();
    }else this.game.combat.setFeedback('ALREADY USED OR UNAVAILABLE');
  }
  isDisabled(id){
    const s=this.state;
    return id==='phone'?s.helpCalled:
      id==='door'?s.doorSecured||s.enemyEntered:
      id==='medkit'?s.medkitUsed||s.health>=100:false;
  }
  onPlayerHit(){
    if(!this.active||!this.state.enemyEntered||this.state.phase!=='playing')return;
    nightEvent(this.state,'stun');
    this.updatePresentation();
  }
  enemyTick(dt){
    const s=this.state;
    if(!s.enemyEntered||s.phase!=='playing')return;
    if(s.enemyStun>0)return;
    const player=this.game.view.camera.position;
    const dx=player.x-this.enemyPosition.x,dz=player.z-this.enemyPosition.z;
    const distance=Math.hypot(dx,dz);
    if(distance<ATTACK_RANGE){
      this.actorState='attack';
      this.target?.setClip('attack');
      const hit=nightEvent(s,'hit');
      if(hit){
        this.audio.hurt();
        this.game.combat.root.classList.add('player-hurt');
        this.game.combat.hurtTime=.31;
        this.game.combat.setFeedback(s.message);
        this.game.combat.cameraKick.velocity+=.15;
      }
      return;
    }
    this.actorState='walk';
    this.target?.setClip('walk');
    this.pathAge-=dt;
    if(this.pathAge<=0||this.path.length===0){
      this.path=findNavigationPath(this.enemyPosition,{x:player.x,z:player.z});
      this.pathAge=REPATH_INTERVAL;
    }
    if(this.path.length){
      const point=this.path[0];
      const next=navigateStep(this.enemyPosition,point,ENEMY_SPEED,dt);
      this.setEnemyPosition(next.x,next.z);
      if(Math.hypot(this.enemyPosition.x-point.x,this.enemyPosition.z-point.z)<.075){
        this.path.shift();
      }
      if(this.state.elapsed-this.lastStepAt>.9){
        this.lastStepAt=this.state.elapsed;
        this.audio.step(this.state.elapsed,true,distance);
      }
    }
    if(this.target){
      const turn=Math.atan2(player.x-this.enemyPosition.x,player.z-this.enemyPosition.z);
      this.target.group.rotation.y=turn;
    }
  }
  update(dt){
    if(!this.active||this.state.phase!=='playing')return;
    const beforeEntered=this.state.enemyEntered;
    tickNight(this.state,dt);
    if(!beforeEntered&&this.state.enemyEntered){
      this.setEnemyPosition(THREAT_SPAWN.x,THREAT_SPAWN.z);
      this.showEnemy(true);
      this.pathAge=0;
      this.audio.door();
      this.game.combat.setFeedback(this.state.message);
    }
    if(this.state.phase==='playing'){
      this.enemyTick(dt);
      this.audio.heartbeat(this.state.elapsed,this.state.health);
    }
    const combat=this.game.combat;
    const player=this.game.view.camera.position;
    const forward=Number(combat.keys.has('KeyW'))-Number(combat.keys.has('KeyS'));
    const sideways=Number(combat.keys.has('KeyD'))-Number(combat.keys.has('KeyA'));
    if(forward||sideways)this.audio.step(this.state.elapsed,false);
    if(!this.endedHandled&&['won','lost'].includes(this.state.phase)){
      this.endedHandled=true;
      if(document.pointerLockElement===this.game.combat.canvas){
        document.exitPointerLock?.();
      }
      this.game.combat.keys.clear();
      this.audio.pause();
    }
    if(this.state.phase!==this.lastPhase){
      if(this.state.phase==='won')this.audio.call();
      if(this.state.phase==='lost')this.audio.door();
      this.lastPhase=this.state.phase;
    }
    this.updatePresentation();
  }
  updatePresentation(){
    const s=this.state;
    this.props.update(s);
    // Power control intentionally affects practical lights, not player flashlight.
    this.game.setBreakerPower?.(s.breakerOn);
    this.audio.setPower(s.breakerOn);
    const set=(id,value)=>{
      const node=document.querySelector(id);
      if(node)node.textContent=value;
    };
    const remaining=Math.ceil(s.remaining);
    set('#night-clock',String(Math.floor(remaining/60)).padStart(2,'0')+':'+
      String(remaining%60).padStart(2,'0'));
    set('#night-health',String(s.health).padStart(3,'0')+'%');
    set('#night-objective',nightObjective(s));
    set('#night-message',s.message);
    const camera=this.game.view.camera;
    const nearby=nearestInteractable({x:camera.position.x,z:camera.position.z},
      this.props.items.map(item=>({...item,disabled:this.isDisabled(item.id)})));
    this.interactable=nearby;
    set('#interaction-hint',nearby?'[ E ]  '+nearby.hint:'MOVE CLOSE TO AN OBJECT AND PRESS E');
    const hud=document.querySelector('#night-hud');
    if(hud){
      hud.classList.toggle('night-ended',s.phase==='won'||s.phase==='lost');
      hud.classList.toggle('night-won',s.phase==='won');
    }
    const overlay=document.querySelector('#night-end');
    if(overlay)overlay.hidden=!(this.active&&(s.phase==='won'||s.phase==='lost'));
    set('#night-end-title',s.phase==='won'?'YOU SURVIVED':'THE NIGHT WON');
    set('#night-end-copy',s.phase==='won'?
      'The sirens finally reach your street. You held on long enough.':
      s.helpCalled?'Dispatch was on the way. It was not fast enough.':'You never called for help.');
    this.game.rootElement.classList.toggle('night-ending',this.active&&(s.phase==='won'||s.phase==='lost'));
  }
}
