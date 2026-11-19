import * as THREE from 'three';
import {createNight,beginNight,tickNight,nightEvent,nightObjective,
  focusedInteractable,THREAT_DELAY,BARRICADE_DELAY} from './SurvivalRules.js';
import {createThreatBrain,tickThreat,interruptThreat} from './ThreatBrain.js';
import {findNavigationPath,navigateStep} from './NavGrid.js';
import {buildInteractionProps} from './buildInteractionProps.js';
import {NightAudio} from '../audio/NightAudio.js';

const ENTRY={x:2.73,z:2.12};
const WALK_SPEED=.67;
const REPATH_INTERVAL=.65;

export class NightDirector{
  constructor(game){
    this.game=game;
    this.state=createNight();
    this.props=buildInteractionProps(game.view.scene);
    this.audio=new NightAudio();
    this.active=false;
    this.path=[];
    this.pathAge=0;
    this.enemyPosition={...ENTRY};
    this.actorState='idle';
    this.brain=createThreatBrain();
    this.entryWarningIssued=false;
    this.lastStepAt=-100;
    this.endedHandled=false;
    this.lastPhase='idle';
    this.interactable=null;
    this.updatePresentation();
  }

  get actor(){return this.game.riggedIntruder?.group??this.game.intruder.group;}
  get target(){return this.game.riggedIntruder;}

  showEnemy(visible){this.actor.visible=visible;}
  setEnemyPosition(x,z){
    this.enemyPosition.x=x;
    this.enemyPosition.z=z;
    if(this.target)this.target.setBasePosition(x,z);
    else this.game.intruder.group.position.set(x,0,z);
  }
  onRigReady(){
    this.setEnemyPosition(this.enemyPosition.x,this.enemyPosition.z);
    this.showEnemy(!this.active||this.state.enemyEntered);
  }
  enter(){
    if(this.state.phase==='won'||this.state.phase==='lost')this.restart();
    else beginNight(this.state);
    this.active=true;
    this.showEnemy(this.state.enemyEntered);
    this.pathAge=0;
    this.endedHandled=false;
    this.audio.enter();
    this.updatePresentation();
  }
  pause(){
    this.active=false;
    this.audio.pause();
    this.showEnemy(true); // Keep actor visible for orbit-mode inspection.
    this.updatePresentation();
  }
  restart(){
    this.state=createNight();
    this.brain=createThreatBrain();
    this.entryWarningIssued=false;
    this.endedHandled=false;
    this.lastPhase='idle';
    this.path=[];
    this.pathAge=0;
    this.actorState='idle';
    this.lastStepAt=-100;
    this.setEnemyPosition(ENTRY.x,ENTRY.z);
    this.target?.setClip('idle');
    this.active=true;
    beginNight(this.state);
    this.showEnemy(false);

    const combat=this.game.combat;
    combat.hitCount=0;
    combat.weapon.setVisible(true);
    combat.weapon.swingTime=.76;
    combat.weapon.hitStop=0;
    combat.keys.clear();
    combat.yaw=-.10;
    combat.pitch=-.085;
    combat.hurtTime=0;
    combat.root.classList.remove('player-hurt','impact','miss','hit-confirm');
    this.game.view.camera.position.set(.05,1.64,1.70);
    const counter=document.querySelector('#hit-count');
    if(counter)counter.textContent='0';
    this.audio.enter();
    this.updatePresentation();
  }

  isDisabled(id){
    const s=this.state;
    return id==='phone'?s.helpCalled:
      id==='door'?s.doorSecured||s.enemyEntered:
      id==='medkit'?s.medkitUsed||s.health>=100:false;
  }
  focusedItem(){
    const camera=this.game.view.camera;
    const direction=new THREE.Vector3();
    camera.getWorldDirection(direction);
    return focusedInteractable(
      {x:camera.position.x,z:camera.position.z},
      {x:direction.x,z:direction.z},
      this.props.items.map(item=>({...item,disabled:this.isDisabled(item.id)}))
    );
  }
  interact(){
    if(!this.active||this.state.phase!=='playing')return;
    const item=this.focusedItem();
    if(!item){
      this.game.combat.setFeedback('FACE AN OBJECT AND MOVE CLOSER');
      return;
    }
    let accepted=false;
    switch(item.id){
      case 'phone':
        accepted=nightEvent(this.state,'phone');
        if(accepted)this.audio.call();
        break;
      case 'door':
        accepted=nightEvent(this.state,'barricade');
        if(accepted)this.audio.door();
        break;
      case 'breaker':
        accepted=nightEvent(this.state,'breaker');
        if(accepted)this.audio.click();
        break;
      case 'medkit':
        accepted=nightEvent(this.state,'medkit');
        if(accepted)this.audio.click();
        break;
    }
    if(accepted){
      this.game.combat.setFeedback(this.state.message);
      this.updatePresentation();
    }else{
      this.game.combat.setFeedback('ALREADY USED OR UNAVAILABLE');
    }
  }
  onPlayerHit(){
    if(!this.active||!this.state.enemyEntered||this.state.phase!=='playing')return;
    nightEvent(this.state,'stun');
    interruptThreat(this.brain);
    this.actorState='stagger';
    this.pathAge=0;
    this.updatePresentation();
  }
  setActorPose(name){
    if(name===this.actorState)return;
    this.actorState=name;
    this.target?.setClip(name);
  }
  enemyTick(dt){
    if(!this.state.enemyEntered||this.state.phase!=='playing')return;
    if(this.state.enemyStun>0)return;

    const player=this.game.view.camera.position;
    const keys=this.game.combat.keys;
    const moving=['KeyW','KeyA','KeyS','KeyD'].some(code=>keys.has(code));
    const running=moving&&keys.has('ShiftLeft');
    const step=tickThreat(this.brain,{
      dt,enemy:this.enemyPosition,player,moving,running,
      flashlight:this.game.flashlightOn&&this.game.flashlight?.visible!==false
    });
    const distance=Math.hypot(player.x-this.enemyPosition.x,player.z-this.enemyPosition.z);

    if(step.telegraph){
      this.state.message='THE INTRUDER DRAWS BACK. MOVE!';
      this.game.combat.setFeedback('DODGE THE STRIKE');
      this.audio.warning();
    }
    if(step.mode==='staggered'){
      this.setActorPose('stagger');
      return;
    }
    if(step.mode==='windup'){
      this.setActorPose('idle');
      return;
    }
    if(step.mode==='attack'){
      this.setActorPose('attack');
      if(step.strike){
        const hit=nightEvent(this.state,'hit');
        if(hit){
          this.audio.hurt();
          this.game.combat.root.classList.add('player-hurt');
          this.game.combat.hurtTime=.31;
          this.game.combat.setFeedback(this.state.message);
          this.game.combat.cameraKick.velocity+=.15;
        }
      }else{
        this.audio.miss();
        this.state.message='IT SWUNG AT EMPTY AIR. KEEP MOVING.';
      }
      return;
    }
    if(step.mode==='recover'){
      if(this.brain.recovery<.62)this.setActorPose('idle');
      return;
    }

    this.setActorPose('walk');
    const goal=step.goal;
    if(!goal)return;
    this.pathAge-=dt;
    if(this.pathAge<=0||this.path.length===0||
      Math.hypot(this.path[this.path.length-1].x-goal.x,
        this.path[this.path.length-1].z-goal.z)>.7){
      this.path=findNavigationPath(this.enemyPosition,goal);
      this.pathAge=REPATH_INTERVAL;
    }
    if(this.path.length){
      const waypoint=this.path[0];
      const speed=step.mode==='pursue'?WALK_SPEED*1.42:WALK_SPEED*.83;
      const next=navigateStep(this.enemyPosition,waypoint,speed,dt);
      this.setEnemyPosition(next.x,next.z);
      if(Math.hypot(next.x-waypoint.x,next.z-waypoint.z)<.075)this.path.shift();
      if(this.state.elapsed-this.lastStepAt>.95){
        this.lastStepAt=this.state.elapsed;
        this.audio.step(this.state.elapsed,true,distance);
      }
    }
    if(this.target){
      this.target.group.rotation.y=Math.atan2(
        goal.x-this.enemyPosition.x,goal.z-this.enemyPosition.z
      );
    }
  }
  update(dt){
    if(!this.active||this.state.phase!=='playing')return;
    const hadEntered=this.state.enemyEntered;
    tickNight(this.state,dt);
    const entryTime=THREAT_DELAY+(this.state.doorSecured?BARRICADE_DELAY:0);
    if(!this.entryWarningIssued&&!this.state.enemyEntered&&this.state.elapsed>=entryTime-3){
      this.entryWarningIssued=true;
      this.state.message='A DOOR HANDLE TURNS. THE HOUSE GOES QUIET.';
      this.audio.warning();
    }
    if(!hadEntered&&this.state.enemyEntered){
      this.setEnemyPosition(ENTRY.x,ENTRY.z);
      this.showEnemy(true);
      this.pathAge=0;
      this.brain=createThreatBrain();
      this.setActorPose('idle');
      this.audio.door();
      this.game.combat.setFeedback(this.state.message);
    }
    if(this.state.phase==='playing'){
      this.enemyTick(Math.min(dt,.05));
      this.audio.heartbeat(this.state.elapsed,this.state.health);
    }

    const keys=this.game.combat.keys;
    if(['KeyW','KeyA','KeyS','KeyD'].some(code=>keys.has(code))){
      this.audio.step(this.state.elapsed,false);
    }
    if(!this.endedHandled&&['won','lost'].includes(this.state.phase)){
      this.endedHandled=true;
      if(document.pointerLockElement===this.game.combat.canvas)document.exitPointerLock?.();
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
    const focused=this.active&&s.phase==='playing'?this.focusedItem():null;
    this.props.update(s,focused?.id??null);
    this.game.setBreakerPower?.(s.breakerOn);
    this.audio.setPower(s.breakerOn);
    const set=(id,value)=>{
      const node=document.querySelector(id);
      if(node)node.textContent=value;
    };
    const seconds=Math.ceil(s.remaining);
    set('#night-clock',String(Math.floor(seconds/60)).padStart(2,'0')+':'+
      String(seconds%60).padStart(2,'0'));
    set('#night-health',String(s.health).padStart(3,'0')+'%');
    set('#night-objective',nightObjective(s));
    set('#night-message',s.message);
    this.interactable=focused;
    set('#interaction-hint',focused?'[ E ]  '+focused.hint:
      'FACE AN OBJECT AND MOVE CLOSE TO INTERACT');
    set('#threat-indicator',!s.enemyEntered?'HOUSE QUIET':
      s.enemyStun>0?'INTRUDER STAGGERED':
      this.brain.mode==='windup'?'INCOMING STRIKE':
      this.brain.mode==='pursue'?'FOOTSTEPS APPROACHING':
      this.brain.mode==='search'?'FOOTSTEPS SEARCHING':
      this.brain.mode==='recover'?'INTRUDER RECOVERING':'PRESENCE DETECTED');
    const hud=document.querySelector('#night-hud');
    if(hud){
      hud.classList.toggle('night-ended',s.phase==='won'||s.phase==='lost');
      hud.classList.toggle('night-won',s.phase==='won');
      hud.classList.toggle('danger',s.enemyEntered&&
        (this.brain.mode==='windup'||this.brain.mode==='pursue'));
    }
    const overlay=document.querySelector('#night-end');
    if(overlay)overlay.hidden=!(this.active&&(s.phase==='won'||s.phase==='lost'));
    set('#night-end-title',s.phase==='won'?'YOU SURVIVED':'THE NIGHT WON');
    set('#night-end-copy',s.phase==='won'?
      'The sirens finally reach your street. You held on long enough.':
      s.helpCalled?'Dispatch was on the way. It was not fast enough.':
      'You never called for help.');
    this.game.rootElement.classList.toggle('night-ending',
      this.active&&(s.phase==='won'||s.phase==='lost'));
  }
}
