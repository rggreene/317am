import * as THREE from 'three';
import { createRenderer } from '../rendering/createRenderer.js';
import { buildRoom } from '../world/buildRoom.js';
import { loadFryingPan } from '../props/loadFryingPan.js';
import {createRiggedIntruder,INTRUDER_CLIPS} from '../actors/IntruderController.js';
import {CombatLab} from './CombatLab.js';
import {NightDirector} from './NightDirector.js';

export class Game {
  constructor({canvas,root}){
    this.rootElement=root;
    this.view=createRenderer(canvas);
    this.flashlightOn=true;
    this.moody=true;
    this.fpsVisible=false;
    this.elapsed=0;
    this.frameTimes=[];
    this.lastFrame=performance.now();
    const {scene,camera}=this.view;
    const world=buildRoom();
    this.intruder=world.intruder;
    this.apartment=world.root;
    this.riggedIntruder=null;
    scene.add(world.root);
    void this.setupIntruder();
    this.panGroup=null;
    this.panAsset=null;
    this.panInspect=false;
    this.intruderInspect=false;
    this.intruderSavedCamera=null;
    this.cameraAnimation=null;
    void this.setupPan();
    this.ambient=new THREE.HemisphereLight('#8eaecf','#1d1818',0.65);
    scene.add(this.ambient);
    this.moon=new THREE.DirectionalLight('#94bbec',1.35);
    this.moon.position.set(-3.7,5.2,-1.1);
    this.moon.castShadow=true;
    this.moon.shadow.mapSize.set(1024,1024);
    this.moon.shadow.camera.left=-7;
    this.moon.shadow.camera.right=7;
    this.moon.shadow.camera.top=7;
    this.moon.shadow.camera.bottom=-7;
    this.moon.shadow.bias=-0.0008;
    scene.add(this.moon);
    this.lamp=new THREE.PointLight('#ffc581',17,5,2);
    this.lamp.position.set(-2.93,1.27,-1.27);
    scene.add(this.lamp);
    // Hero-area practicals; restrained falloff keeps the far side of the room tense.
    this.livingLamp=new THREE.PointLight('#ffc995',9.2,4.2,2);
    this.livingLamp.position.set(2.80,1.54,2.08);
    this.livingLamp.castShadow=true;
    this.livingLamp.shadow.mapSize.set(512,512);
    this.livingLamp.shadow.bias=-.001;
    scene.add(this.livingLamp);
    this.windowBounce=new THREE.PointLight('#8aaccb',3.7,3.0,2);
    this.windowBounce.position.set(1.24,2.2,-2.28);
    scene.add(this.windowBounce);
    this.tv=new THREE.PointLight('#78badc',6,3.8,2);
    this.tv.position.set(1.6,1.15,-2.0);
    scene.add(this.tv);
    this.flashlight=new THREE.SpotLight('#e3edf6',15,10,Math.PI/6,0.5,2);
    this.flashlight.castShadow=true;
    this.flashlight.shadow.mapSize.set(512,512);
    this.flashlight.shadow.bias=-0.001;
    this.flashlight.target.position.copy(this.view.controls.target);
    scene.add(this.flashlight,this.flashlight.target);
    this.panLight=new THREE.PointLight('#ffdbaf',8,2.4,2);
    this.panLight.position.set(2.12,1.92,-.6);
    scene.add(this.panLight);
    this.tmpDirection=new THREE.Vector3();
    this.configureLighting();
    this.combat=new CombatLab({
      view:this.view,
      canvas,
      root,
      onEnter:()=>{
        // Cancel any in-flight orbit inspection when the user takes control.
        this.cameraAnimation=null;
        this.panInspect=false;
        this.intruderInspect=false;
        const label=document.querySelector('#inspect-mode');
        if(label)label.textContent='APARTMENT OVERVIEW · E PAN · R INTRUDER';
        this.night?.enter();
      },
      getTarget:()=>this.riggedIntruder?.getTarget() ?? new THREE.Vector3(.28,1.43,-.38),
      canHit:()=>Boolean(this.night?.state?.enemyEntered&&this.night?.state?.phase==='playing'),
      onHit:({attacker})=>{
        if(this.riggedIntruder)this.riggedIntruder.reactToImpact(attacker);
        this.night?.onPlayerHit();
        else this.intruder.animate(this.elapsed);
      }
    });
    this.night=new NightDirector(this);
    root.addEventListener('night-pause',()=>this.night.pause());
    document.querySelector('#night-restart')?.addEventListener('click',()=>this.night.restart());
    this.handleKeyDown=(e)=>{
      if(e.repeat || e.ctrlKey || e.metaKey || e.altKey)return;
      switch(e.code){
        case 'KeyE':
          if(this.combat.active)this.night.interact();
          else this.togglePanInspection();
          break;
        case 'KeyN':
          if(this.combat.active&&['won','lost'].includes(this.night.state.phase))this.night.restart();
          break;
        case 'KeyM':
          this.night.audio.enabled=!this.night.audio.enabled;
          this.night.audio.setMuted?.(!this.night.audio.enabled);
          break;
        case 'KeyR':if(!this.combat.active)this.toggleIntruderInspection();break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':this.riggedIntruder?.setClip(INTRUDER_CLIPS[Number(e.code.slice(-1))-1]);break;
        case 'Escape':if(this.panInspect)this.togglePanInspection();else if(this.intruderInspect)this.toggleIntruderInspection();break;
        case 'KeyG':this.moody=!this.moody;this.configureLighting();break;
        case 'KeyF':this.flashlightOn=!this.flashlightOn;this.flashlight.visible=this.flashlightOn;break;
        case 'KeyH':this.rootElement.classList.toggle('hide-ui');break;
        case 'KeyO':this.fpsVisible=!this.fpsVisible;document.querySelector('#fps').hidden=!this.fpsVisible;break;
      }
    };
    window.addEventListener('keydown',this.handleKeyDown);
    this.lastFrame=performance.now();
  }
  async setupIntruder(){
    try{
      const controller=await createRiggedIntruder();
      this.apartment.add(controller.group);
      this.apartment.remove(this.intruder.group);
      this.riggedIntruder=controller;
      controller.onChanged=clip=>{
        const label=document.querySelector('#clip-status');
        if(label)label.textContent='INTRUDER: '+clip.toUpperCase();
      };
      const status=document.querySelector('#intruder-status');
      if(status)status.textContent='12-bone animated GLB loaded';
      this.night?.onRigReady();
    }catch(error){
      console.error('Intruder GLB failed. Keeping fallback:',error);
      const status=document.querySelector('#intruder-status');
      if(status)status.textContent='Rig unavailable: showing fallback intruder';
    }
  }
  async setupPan(){
    try{
      const asset=await loadFryingPan();
      const group=new THREE.Group();
      group.name='PanInspectPivot';
      group.position.set(2.14,0.968,-0.77);
      asset.scene.traverse(node=>{
        if(node.isMesh){
          node.castShadow=true;
          node.receiveShadow=true;
        }
      });
      group.add(asset.scene);
      this.view.scene.add(group);
      this.panGroup=group;
      this.panAsset=asset;
      const label=document.querySelector('#asset-status');
      if(label)label.textContent='Frying pan GLB loaded · Press E to inspect';
    }catch(error){
      console.error('Could not load frying pan asset:',error);
      const label=document.querySelector('#asset-status');
      if(label)label.textContent='Frying pan asset unavailable — see browser console';
    }
  }
  togglePanInspection(){
    if(!this.panGroup||this.intruderInspect)return;
    this.panInspect=!this.panInspect;
    const {camera,controls}=this.view;
    if(this.panInspect){
      this.savedCamera={pos:camera.position.clone(),target:controls.target.clone()};
      this.panGroup.rotation.y=0;
      this.cameraAnimation={
        pos:new THREE.Vector3(2.98,2.2,1.98),
        target:new THREE.Vector3(2.14,1.31,-.77)
      };
    }else if(this.savedCamera){
      this.cameraAnimation={pos:this.savedCamera.pos,target:this.savedCamera.target};
    }
    controls.enabled=false;
    const mode=document.querySelector('#inspect-mode');
    if(mode)mode.textContent=this.panInspect?'INSPECTING FRYING PAN · E TO RETURN':'APARTMENT OVERVIEW · E TO INSPECT PAN';
  }
  toggleIntruderInspection(){
    if(!this.riggedIntruder||this.panInspect)return;
    const {camera,controls}=this.view;
    this.intruderInspect=!this.intruderInspect;
    if(this.intruderInspect){
      this.intruderSavedCamera={pos:camera.position.clone(),target:controls.target.clone()};
      this.cameraAnimation={
        pos:new THREE.Vector3(1.22,2.10,1.78),
        target:new THREE.Vector3(.28,1.45,-.38)
      };
    }else if(this.intruderSavedCamera){
      this.cameraAnimation={pos:this.intruderSavedCamera.pos,target:this.intruderSavedCamera.target};
    }
    controls.enabled=false;
    const label=document.querySelector('#inspect-mode');
    if(label)label.textContent=this.intruderInspect?'INSPECTING INTRUDER · R TO RETURN':'APARTMENT OVERVIEW · E PAN · R INTRUDER';
  }
  setBreakerPower(power){
    const strength=power?1:.025;
    this.lamp.intensity=(this.moody?17:8)*strength;
    this.livingLamp.intensity=(this.moody?9.2:4.8)*strength;
    this.tv.intensity=(this.moody?4.4:1.7)*strength;
    this.panLight.intensity=(this.moody?8:3)*strength;
  }
  configureLighting(){
    this.ambient.intensity=this.moody?0.65:1.65;
    this.moon.intensity=this.moody?1.35:2.1;
    this.lamp.intensity=this.moody?17:8;
    this.tv.intensity=this.moody?4.4:1.7;
    this.livingLamp.intensity=this.moody?9.2:4.8;
    this.windowBounce.intensity=this.moody?3.7:2.1;
    this.view.renderer.toneMappingExposure=this.moody?1.12:1.34;
    this.view.scene.fog.density=this.moody?0.024:0.012;
    this.setBreakerPower(this.night?.state.breakerOn??true);
  }
  frame=(now)=>{
    const delta=Math.min(0.05,(now-this.lastFrame)/1000||0);
    this.lastFrame=now;
    this.elapsed+=delta;
    if(this.riggedIntruder)this.riggedIntruder.update(delta);
    else this.intruder.animate(this.elapsed);
    if(this.panGroup){
      const wantedHeight=this.panInspect?1.22:0.968;
      this.panGroup.position.y+=(wantedHeight-this.panGroup.position.y)*Math.min(1,delta*7);
      const desiredAngle=this.panInspect?this.elapsed*0.38:0;
      // Spin the held preview around the bowl's origin, not the whole apartment.
      this.panGroup.rotation.y+=(desiredAngle-this.panGroup.rotation.y)*Math.min(1,delta*6);
      this.panAsset?.mixer?.update(delta);
    }
    const {camera,controls,renderer,scene}=this.view;
    if(this.combat.active){
      this.combat.update(delta);
      this.night.update(delta);
    }
    if(!this.combat.active && this.cameraAnimation){
      camera.position.lerp(this.cameraAnimation.pos,Math.min(1,delta*6));
      controls.target.lerp(this.cameraAnimation.target,Math.min(1,delta*6));
      if(camera.position.distanceTo(this.cameraAnimation.pos)<0.02 && controls.target.distanceTo(this.cameraAnimation.target)<0.02){
        camera.position.copy(this.cameraAnimation.pos);
        controls.target.copy(this.cameraAnimation.target);
        this.cameraAnimation=null;
        controls.enabled=true;
      }
    }
    if(!this.combat.active)controls.update();
    this.flashlight.position.copy(camera.position);
    camera.getWorldDirection(this.tmpDirection);
    this.flashlight.target.position.copy(camera.position).addScaledVector(this.tmpDirection,5);
    this.flashlight.target.updateMatrixWorld();
    renderer.render(scene,camera);
    if(this.fpsVisible){
      this.frameTimes.push(delta);
      if(this.frameTimes.length>50)this.frameTimes.shift();
      if(Math.floor(this.elapsed*4)!==Math.floor((this.elapsed-delta)*4)){
        const average=this.frameTimes.reduce((a,b)=>a+b,0)/Math.max(1,this.frameTimes.length);
        document.querySelector('#fps').textContent=average>0?Math.round(1/average)+' FPS':'-- FPS';
      }
    }
    requestAnimationFrame(this.frame);
  };
  start(){requestAnimationFrame(this.frame);}
}
