import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const fabric=new THREE.MeshStandardMaterial({color:'#495365',roughness:.97});
const cuff=new THREE.MeshStandardMaterial({color:'#303740',roughness:.94});
const leather=new THREE.MeshStandardMaterial({color:'#262a2e',roughness:.90});
const palmLeather=new THREE.MeshStandardMaterial({color:'#303439',roughness:.91});
const stitch=new THREE.MeshStandardMaterial({color:'#676965',roughness:1});
const seamMaterial=new THREE.MeshStandardMaterial({color:'#1a1c20',roughness:.94});

function mesh(parent,geo,material,position,name){
  const m=new THREE.Mesh(geo,material);
  m.name=name;
  m.position.set(...position);
  m.castShadow=false;m.receiveShadow=true;parent.add(m);
  return m;
}
function link(parent,from,to,radius,mat,name,r2=radius*.85){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to);
  const offset=b.clone().sub(a);
  const g=new THREE.CylinderGeometry(r2,radius,offset.length(),12);
  const segment=mesh(parent,g,mat,a.add(b).multiplyScalar(.5).toArray(),name);
  segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),offset.normalize());
  return segment;
}
function finger(parent,base,index){
  const x=base.x+(-.049+index*.033);
  const y=base.y,z=base.z;
  const start=[x,y+.040,z+.035];
  const middle=[x+(.003*index),y-.013,z+.058];
  const end=[x+(.004*index),y-.057,z+.006];
  link(parent,start,middle,.017,leather,'Glove proximal finger');
  link(parent,middle,end,.015,palmLeather,'Glove curled distal finger');
  mesh(parent,new THREE.SphereGeometry(.019,10,8),leather,middle,'Glove knuckle');
  // Subtle horizontal glove stitching follows the back of the proximal finger.
  link(parent,[x-.010,y+.018,z+.052],[x+.011,y+.018,z+.052],.0022,stitch,
    'Glove finger seam');
}
function hand(parent,x){
  const center={x,y:.103,z:.018};
  const shape=new RoundedBoxGeometry(.147,.101,.139,3,.038);
  const arr=shape.attributes.position;
  for(let i=0;i<arr.count;i++){
    const y=arr.getY(i),z=arr.getZ(i);
    // Flatten the padded glove back and round the finger root.
    arr.setZ(i,z+(y>0?.006:-.004));
  }
  shape.computeVertexNormals();
  mesh(parent,shape,palmLeather,[x,.103,.018],'Contoured leather glove palm');
  const pad=new THREE.Mesh(new RoundedBoxGeometry(.103,.018,.09,2,.009),leather);
  pad.name='Back-of-hand stitched padding';
  pad.position.set(x,.162,.035);
  parent.add(pad);
  for(let i=0;i<4;i++)finger(parent,center,i);
  link(parent,[x+.077,.13,-.01],[x+.09,.077,-.046],.025,leather,'Glove thumb base');
  link(parent,[x+.09,.077,-.046],[x+.052,.045,-.065],.020,palmLeather,'Glove folded thumb');
  const wrist=mesh(parent,new THREE.CylinderGeometry(.073,.088,.083,14),
    cuff,[x,.044,.018],'Reinforced leather wrist closure');
  wrist.rotation.z=.15;
  const lip=mesh(parent,new THREE.TorusGeometry(.079,.008,6,18),
    seamMaterial,[x,.01,.018],'Glove cuff stitched lip');
  lip.rotation.x=Math.PI/2;
}
function arm(parent,origin,wrist,side){
  const elbow=new THREE.Vector3(...origin);
  const handJoint=new THREE.Vector3(...wrist);
  const bend=elbow.clone().lerp(handJoint,.62);
  bend.x+=side*.035;
  // Two tapered sections make the sleeve bend instead of forming a single rod.
  link(parent,elbow.toArray(),bend.toArray(),.115,fabric,'Heavy jacket upper sleeve',.097);
  link(parent,bend.toArray(),handJoint.toArray(),.096,fabric,'Tapered jacket forearm',.082);
  const cuffMid=bend.clone().lerp(handJoint,.82);
  link(parent,cuffMid.toArray(),handJoint.toArray(),.094,cuff,'Textile wrist cuff',.078);
  const crease=mesh(parent,new THREE.TorusGeometry(.088,.007,6,16),seamMaterial,
    cuffMid.toArray(),'Forearm seam band');
  crease.quaternion.setFromUnitVectors(
    new THREE.Vector3(0,0,1),handJoint.clone().sub(elbow).normalize()
  );
}
export function buildFirstPersonGrip(viewmodel,panPivot){
  // These are deliberately shaped browser-art placeholders, not skinned hands.
  // Both hands move in pan-local space, so contact is maintained in every swing.
  const grips=[
    {x:.357,origin:[.58,-.90,.40],side:1},
    {x:.230,origin:[-.57,-.87,.38],side:-1}
  ];
  for(const grip of grips){
    hand(panPivot,grip.x);
    const wrist=new THREE.Vector3(grip.x,.02,.018)
      .applyEuler(panPivot.rotation).add(panPivot.position);
    arm(viewmodel,grip.origin,wrist.toArray(),grip.side);
  }
  viewmodel.userData.firstPersonArt='Layered cloth sleeves and glove anatomy pass';
}
