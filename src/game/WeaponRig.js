import * as THREE from 'three';
import {loadFryingPan} from '../props/loadFryingPan.js';
import {SWING_DURATION,IMPACT_PHASE,swingPose} from './CombatMath.js';
import {dampedSpring} from './ImpactQuality.js';
import {buildFirstPersonGrip} from './ViewmodelArt.js';

export class WeaponRig{
  constructor(camera,onImpact=()=>{}){
    this.camera=camera;
    this.onImpact=onImpact;
    this.group=new THREE.Group();
    this.group.name='First-person pan and fitted gloved hands';
    this.group.visible=false;
    // Keep the pan out of the aiming center until the attack begins.
    this.rest=new THREE.Vector3(.30,-.49,-.72);
    this.group.scale.setScalar(.82);
    this.group.position.copy(this.rest);
    camera.add(this.group);

    this.panPivot=new THREE.Group();
    this.panPivot.position.set(-.04,.12,-.07);
    this.panPivot.rotation.set(1.18,0,-.56);
    this.group.add(this.panPivot);
    buildFirstPersonGrip(this.group,this.panPivot);

    this.assetLoaded=false;
    this.swingTime=SWING_DURATION;
    this.hitSent=false;
    this.hitStop=0;
    this.recoil={value:0,velocity:0};
    this.time=0;this.walkPhase=0;
    this.motion=new THREE.Vector2();

    const bounce=new THREE.PointLight('#bfd2de',.70,1.6,2);
    bounce.position.set(.08,-.19,-.37);
    camera.add(bounce);

    void loadFryingPan().then(asset=>{
      asset.scene.traverse(node=>{
        if(node.isMesh){node.castShadow=false;node.receiveShadow=true;}
      });
      this.panPivot.add(asset.scene);
      this.assetLoaded=true;
    }).catch(error=>console.error('Viewmodel GLB pan failed:',error));
  }

  setVisible(show){this.group.visible=show;}
  swing(){
    if(!this.assetLoaded||this.swingTime<SWING_DURATION)return false;
    this.swingTime=0;
    this.hitSent=false;
    this.hitStop=0;
    return true;
  }
  contact(hit){
    this.hitStop=hit?.045:0;
    this.recoil.velocity+=hit?.8:.15;
  }
  update(delta,walking=false){
    this.time+=delta;
    if(walking)this.walkPhase+=delta*11;
    const freeze=Math.min(delta,this.hitStop);
    this.hitStop=Math.max(0,this.hitStop-delta);
    const simulationDelta=delta-freeze;
    const prev=this.swingTime;
    if(this.swingTime<SWING_DURATION)
      this.swingTime=Math.min(SWING_DURATION,this.swingTime+simulationDelta);

    // Frame-boundary-safe hit timing: exactly one impact per swing, regardless
    // of intermittent framerate or the added brief hitstop.
    if(!this.hitSent&&prev<=SWING_DURATION*IMPACT_PHASE&&
        this.swingTime>=SWING_DURATION*IMPACT_PHASE){
      this.hitSent=true;
      this.onImpact();
    }
    this.recoil=dampedSpring(this.recoil.value,this.recoil.velocity,delta,22);
    const pose=swingPose(this.swingTime/SWING_DURATION);
    const breathing=Math.sin(this.time*1.32)*.005;
    const step=walking?Math.sin(this.walkPhase)*.015:0;
    const sway=Math.sin(this.time*1.8)*.003;
    this.group.position.set(
      this.rest.x+pose.x+sway+this.motion.x*.019,
      this.rest.y+pose.y+breathing+step+this.motion.y*.011,
      this.rest.z+pose.z+this.recoil.value
    );
    this.group.rotation.set(
      pose.pitch-this.motion.y*.012-this.recoil.value*.3,
      pose.yaw-this.motion.x*.016,
      pose.roll+this.recoil.value*.23,'XYZ'
    );
    this.motion.multiplyScalar(Math.max(0,1-delta*9));
  }
  addLookSway(mx,my){
    this.motion.x=THREE.MathUtils.clamp(this.motion.x+mx*.012,-1,1);
    this.motion.y=THREE.MathUtils.clamp(this.motion.y+my*.012,-1,1);
  }
}
