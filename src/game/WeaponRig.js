import * as THREE from 'three';
import {loadFryingPan} from '../props/loadFryingPan.js';
import {SWING_DURATION,IMPACT_PHASE,swingPose} from './CombatMath.js';
import {dampedSpring} from './ImpactQuality.js';

const sleeve=new THREE.MeshStandardMaterial({color:'#465165',roughness:.95});
const cuff=new THREE.MeshStandardMaterial({color:'#222833',roughness:.88});
const leather=new THREE.MeshStandardMaterial({color:'#20242a',roughness:.82});
const piping=new THREE.MeshStandardMaterial({color:'#454c52',roughness:.7});

function pill(parent,start,end,radius,material){
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end);
  const d=b.clone().sub(a);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.86,radius,d.length(),12),material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}
function palm(parent,x){
  // Palms and curled fingers are constructed in *pan local space*;
  // they stay wrapped around the handle as the whole viewmodel swings.
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),leather);
  mesh.scale.set(.075,.054,.074);
  mesh.position.set(x,.103,.018);
  parent.add(mesh);
  for(let i=0;i<4;i++){
    const fx=x-.043+i*.027;
    pill(parent,[fx,.132,.055],[fx+.003,.055,-.021],.015,leather);
    const knuckle=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),leather);
    knuckle.position.set(fx,.13,.055);
    parent.add(knuckle);
  }
  pill(parent,[x+.071,.10,-.016],[x+.04,.057,-.038],.019,leather);
}
function buildTwoHandGrip(group,panPivot){
  const hands=[{x:.356,origin:[.57,-.90,.40]},{x:.246,origin:[-.55,-.89,.39]}];
  // The right hand makes the main grip, left hand braces close to the tang.
  panPivot.updateMatrix();
  for(const h of hands){
    palm(panPivot,h.x);
    const wrist=new THREE.Vector3(h.x,.095,.014).applyEuler(panPivot.rotation).add(panPivot.position);
    const elbow=new THREE.Vector3().fromArray(h.origin);
    const cuffEnd=wrist.clone().lerp(elbow,.22);
    pill(group,h.origin,cuffEnd.toArray(),.105,sleeve);
    pill(group,cuffEnd.toArray(),wrist.toArray(),.094,cuff);
    const seam=new THREE.Mesh(new THREE.TorusGeometry(.086,.008,6,14),piping);
    seam.position.copy(cuffEnd);
    seam.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),wrist.clone().sub(elbow).normalize());
    group.add(seam);
  }
}

export class WeaponRig{
  constructor(camera,onImpact=()=>{}){
    this.camera=camera;
    this.onImpact=onImpact;
    this.group=new THREE.Group();
    this.group.name='First-person pan and fitted gloved hands';
    this.group.visible=false;
    this.rest=new THREE.Vector3(.09,-.34,-.69);
    this.group.position.copy(this.rest);
    camera.add(this.group);

    this.panPivot=new THREE.Group();
    this.panPivot.position.set(-.04,.12,-.07);
    this.panPivot.rotation.set(1.18,0,-.56);
    this.group.add(this.panPivot);
    buildTwoHandGrip(this.group,this.panPivot);

    this.assetLoaded=false;
    this.swingTime=SWING_DURATION;
    this.hitSent=false;
    this.hitStop=0;
    this.recoil={value:0,velocity:0};
    this.time=0;this.walkPhase=0;
    this.motion=new THREE.Vector2();

    const bounce=new THREE.PointLight('#bfd2de',1.35,1.6,2);
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
