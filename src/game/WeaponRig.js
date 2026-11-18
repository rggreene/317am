import * as THREE from 'three';
import {loadFryingPan} from '../props/loadFryingPan.js';
import {SWING_DURATION,IMPACT_PHASE,swingPose} from './CombatMath.js';

const GRIP_COLOR='#272d34';
const COAT_COLOR='#445267';
const cuff=new THREE.MeshStandardMaterial({color:'#191e24',roughness:.93});
const sleeve=new THREE.MeshStandardMaterial({color:COAT_COLOR,roughness:.97});
const glove=new THREE.MeshStandardMaterial({color:GRIP_COLOR,roughness:.89});

function link(group,start,end,radius,material){
  const from=new THREE.Vector3(...start),to=new THREE.Vector3(...end);
  const len=from.distanceTo(to);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.86,radius,len,10),material);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());
  mesh.receiveShadow=true;
  group.add(mesh);
}
function gloveHand(group,x,y,z){
  const palm=new THREE.Mesh(new THREE.SphereGeometry(.104,12,10),glove);
  palm.position.set(x,y,z);
  palm.scale.set(.92,1.14,.78);
  group.add(palm);
  for(let i=0;i<3;i++){
    const finger=new THREE.Mesh(new THREE.CapsuleGeometry(.017,.056,4,7),glove);
    finger.position.set(x-.050+i*.047,y-.052,z-.05);
    finger.rotation.z=.3;
    group.add(finger);
  }
}
function buildArms(group){
  // Camera-attached proxy arms; explicitly NOT a complete humanoid skeleton.
  link(group,[.60,-.89,.28],[.31,-.19,.04],.112,sleeve);
  link(group,[-.53,-.90,.27],[-.14,-.24,-.13],.107,sleeve);
  link(group,[.31,-.37,.04],[.31,-.16,.04],.119,cuff);
  link(group,[-.14,-.42,-.13],[-.14,-.24,-.13],.109,cuff);
  gloveHand(group,.31,-.14,.04);
  gloveHand(group,-.14,-.21,-.13);
}

export class WeaponRig {
  constructor(camera,onImpact=()=>{}){
    this.camera=camera;
    this.onImpact=onImpact;
    this.group=new THREE.Group();
    this.group.name='Camera-attached weapon viewmodel';
    this.group.visible=false;
    this.rest=new THREE.Vector3(.07,-.33,-.70);
    this.group.position.copy(this.rest);
    camera.add(this.group);
    buildArms(this.group);

    this.panPivot=new THREE.Group();
    this.panPivot.position.set(-.08,.14,-.07);
    this.panPivot.rotation.set(1.22,0,-.60);
    this.group.add(this.panPivot);
    this.assetLoaded=false;
    this.swingTime=SWING_DURATION;
    this.hitSent=false;
    this.time=0;
    this.walkPhase=0;
    this.motion=new THREE.Vector2();

    // A low-cost local light makes hands readable under the moody room lighting.
    const bounce=new THREE.PointLight('#bfd2de',1.5,1.8,2);
    bounce.position.set(.05,-.2,-.35);
    camera.add(bounce);

    void loadFryingPan().then(asset=>{
      asset.scene.traverse(node=>{
        if(node.isMesh){node.castShadow=false;node.receiveShadow=true;}
      });
      this.panPivot.add(asset.scene);
      this.assetLoaded=true;
    }).catch(error=>{
      console.error('Viewmodel frying pan failed to load:',error);
    });
  }

  setVisible(visible){this.group.visible=visible;}
  swing(){
    if(!this.assetLoaded||this.swingTime<SWING_DURATION)return false;
    this.swingTime=0;
    this.hitSent=false;
    return true;
  }
  update(delta,isWalking=false){
    this.time+=delta;
    if(isWalking)this.walkPhase+=delta*11;
    const attack=this.swingTime<SWING_DURATION;
    const previous=this.swingTime;
    if(attack)this.swingTime=Math.min(SWING_DURATION,this.swingTime+delta);

    if(attack&&!this.hitSent&&previous<=SWING_DURATION*IMPACT_PHASE&&
       this.swingTime>=SWING_DURATION*IMPACT_PHASE){
      this.hitSent=true;
      this.onImpact();
    }
    const pose=swingPose(this.swingTime/SWING_DURATION);
    const step=isWalking?1:0;
    const bob=step*Math.sin(this.walkPhase)*.013;
    const sway=Math.sin(this.time*1.5)*.005;

    this.group.position.set(
      this.rest.x+pose.x+sway+this.motion.x*.022,
      this.rest.y+pose.y+bob+this.motion.y*.014,
      this.rest.z+pose.z
    );
    this.group.rotation.set(pose.pitch-this.motion.y*.012,pose.yaw-this.motion.x*.018,pose.roll,'XYZ');
    this.motion.multiplyScalar(Math.max(0,1-delta*9));
  }
  addLookSway(mx,my){
    this.motion.x=THREE.MathUtils.clamp(this.motion.x+mx*.012,-1,1);
    this.motion.y=THREE.MathUtils.clamp(this.motion.y+my*.012,-1,1);
  }
}
