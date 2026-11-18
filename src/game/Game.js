import * as THREE from 'three';
import { createRenderer } from '../rendering/createRenderer.js';
import { buildRoom } from '../world/buildRoom.js';
import { loadFryingPan } from '../props/loadFryingPan.js';

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
    scene.add(world.root);
    this.panGroup=null;
    this.panAsset=null;
    this.panInspect=false;
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
    this.handleKeyDown=(e)=>{
      if(e.repeat || e.ctrlKey || e.metaKey || e.altKey)return;
      switch(e.code){
        case 'KeyE':this.togglePanInspection();break;
        case 'Escape':if(this.panInspect)this.togglePanInspection();break;
        case 'KeyG':this.moody=!this.moody;this.configureLighting();break;
        case 'KeyF':this.flashlightOn=!this.flashlightOn;this.flashlight.visible=this.flashlightOn;break;
        case 'KeyH':this.rootElement.classList.toggle('hide-ui');break;
        case 'KeyO':this.fpsVisible=!this.fpsVisible;document.querySelector('#fps').hidden=!this.fpsVisible;break;
      }
    };
    window.addEventListener('keydown',this.handleKeyDown);
    this.lastFrame=performance.now();
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
    if(!this.panGroup)return;
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
  configureLighting(){
    this.ambient.intensity=this.moody?0.65:1.65;
    this.moon.intensity=this.moody?1.35:2.1;
    this.lamp.intensity=this.moody?17:8;
    this.tv.intensity=this.moody?6:2;
    this.view.renderer.toneMappingExposure=this.moody?1.25:1.5;
    this.view.scene.fog.density=this.moody?0.024:0.012;
  }
  frame=(now)=>{
    const delta=Math.min(0.05,(now-this.lastFrame)/1000||0);
    this.lastFrame=now;
    this.elapsed+=delta;
    this.intruder.animate(this.elapsed);
    if(this.panGroup){
      const wantedHeight=this.panInspect?1.22:0.968;
      this.panGroup.position.y+=(wantedHeight-this.panGroup.position.y)*Math.min(1,delta*7);
      const desiredAngle=this.panInspect?this.elapsed*0.38:0;
      // Spin the held preview around the bowl's origin, not the whole apartment.
      this.panGroup.rotation.y+=(desiredAngle-this.panGroup.rotation.y)*Math.min(1,delta*6);
      this.panAsset?.mixer?.update(delta);
    }
    const {camera,controls,renderer,scene}=this.view;
    if(this.cameraAnimation){
      camera.position.lerp(this.cameraAnimation.pos,Math.min(1,delta*6));
      controls.target.lerp(this.cameraAnimation.target,Math.min(1,delta*6));
      if(camera.position.distanceTo(this.cameraAnimation.pos)<0.02 && controls.target.distanceTo(this.cameraAnimation.target)<0.02){
        camera.position.copy(this.cameraAnimation.pos);
        controls.target.copy(this.cameraAnimation.target);
        this.cameraAnimation=null;
        controls.enabled=true;
      }
    }
    controls.update();
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
