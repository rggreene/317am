import * as THREE from 'three';

// The current character is still a 12-bone procedural GLB. This art dressing
// follows those exported bones, rather than replacing the rig or movement clips.
// It can be removed when the authored v02 character GLB is approved.
const material=(color,roughness=.91,metalness=0)=>new THREE.MeshStandardMaterial({
  color,roughness,metalness
});
function addMesh(parent,geometry,mat,name,position=[0,0,0]){
  const m=new THREE.Mesh(geometry,mat);
  m.position.set(...position);m.name=name;m.castShadow=true;m.receiveShadow=true;
  parent.add(m);return m;
}
function seam(parent,start,end,radius,mat,name){
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end);
  const d=b.clone().sub(a),len=d.length();
  const cylinder=new THREE.CylinderGeometry(radius,radius,len,7);
  const obj=addMesh(parent,cylinder,mat,name,a.clone().add(b).multiplyScalar(.5).toArray());
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  return obj;
}
function rounded(parent,dimensions,position,mat,name,radius=.025){
  const [x,y,z]=dimensions;
  return addMesh(parent,new THREE.BoxGeometry(x,y,z),mat,name,position);
}
function ring(parent,outer,tube,material,name,pos,rotation=[0,0,0]){
  const obj=addMesh(parent,new THREE.TorusGeometry(outer,tube,7,28),material,name,pos);
  obj.rotation.set(...rotation);return obj;
}
export function dressIntruderRig(scene){
  const bones=new Map();
  scene.traverse(node=>{if(node.isBone)bones.set(node.name,node);});
  const required=['Pelvis','Spine','Neck','Head','Shoulder_L','Shoulder_R','Elbow_L','Elbow_R','Thigh_L','Thigh_R','Knee_L','Knee_R'];
  for(const name of required){
    if(!bones.has(name))throw Error('Cannot dress intruder: missing bone '+name);
  }
  const coat=material('#33393d',.96),coatDark=material('#1d2429',.98);
  const faded=material('#485055',.96),tape=material('#71716b',.87);
  const thread=material('#686f6d',1),leather=material('#252323',.88,.02);
  const zipper=material('#666969',.50,.42),fabric=material('#323533',.97);
  const faceShadow=material('#0d1115',1);

  // Preserve the physically plausible low-light eye response. This is an
  // ordinary human, not a supernatural creature with luminous retinas.
  let changedMaterials=0;
  scene.traverse(node=>{
    if(!node.isMesh)return;
    const input=Array.isArray(node.material)?node.material:[node.material];
    const updated=input.map(old=>{
      if(!old)return old;
      const mat=old.clone();
      const name=(old.name||'').toLowerCase();
      if(name.includes('reflective eyes')){
        mat.color.set('#1d262b');
        mat.emissive?.set('#000000');
        mat.emissiveIntensity=0;
      }else if(name.includes('jacket')){
        mat.color.set('#3a4146');
        mat.roughness=.97;
      }else if(name.includes('hood')){
        mat.color.set('#1d2228');
        mat.roughness=.99;
      }else if(name.includes('weathered face')){
        mat.color.set('#51433e');
        mat.roughness=.95;
      }else if(name.includes('leather')){
        mat.color.set('#242527');
        mat.roughness=.88;
      }
      changedMaterials++;
      return mat;
    });
    node.material=Array.isArray(node.material)?updated:updated[0];
  });

  const spine=bones.get('Spine'),neck=bones.get('Neck'),
    head=bones.get('Head'),pelvis=bones.get('Pelvis');
  // Jacket zipper and layered seams sit in the skinning parent's local space.
  seam(spine,[.015,-.26,.220],[.015,.28,.220],.0055,zipper,'Dull jacket zipper');
  for(const side of [-1,1]){
    seam(spine,[side*.19,-.28,.204],[side*.21,.02,.226],.004,thread,
      'Jacket princess seam');
    rounded(spine,[.19,.13,.018],[side*.17,-.15,.211],faded,
      'Uneven coat pocket flap');
    seam(spine,[side*.27,-.07,.218],[side*.08,.18,.238],.007,coatDark,
      'Slanted coat lapel');
    addMesh(spine,new THREE.CylinderGeometry(.009,.009,.008,8),zipper,
      'Small jacket snap',[side*.24,-.18,.227]);
  }
  rounded(spine,[.41,.085,.032],[0,-.33,.16],leather,'Weathered lower hem');
  ring(neck,.205,.032,coatDark,'Layered high collar',[0,.015,.015],[-Math.PI/2,0,0]);
  // Soft trim around the cloth hood, without the old full circular visor.
  seam(head,[-.15,.18,.074],[-.11,.00,.10],.004,thread,'Loose hood seam left');
  seam(head,[.15,.18,.074],[.11,.00,.10],.004,thread,'Loose hood seam right');
  rounded(head,[.095,.012,.018],[-.03,-.113,.196],faceShadow,'Scarf edge below chin');

  // Sleeves, forearms and glove cuff details move with the existing skeleton.
  for(const side of [-1,1]){
    const shoulder=bones.get(side<0?'Shoulder_L':'Shoulder_R');
    const elbow=bones.get(side<0?'Elbow_L':'Elbow_R');
    const thigh=bones.get(side<0?'Thigh_L':'Thigh_R');
    const knee=bones.get(side<0?'Knee_L':'Knee_R');
    const layer=rounded(shoulder,[.18,.18,.025],
      [side*.015,-.19,.140],side<0?faded:coatDark,
      'Mismatched shoulder reinforcement');
    layer.rotation.z=side*.12;
    seam(shoulder,[side*.012,-.045,.140],[side*.039,-.355,.108],
      .0035,thread,'Sleeve seam');
    ring(elbow,.107,.014,leather,'Glove cuff and folded sleeve',
      [side*.025,-.29,.011],[-Math.PI/2,0,0]);
    for(let j=0;j<3;j++){
      const x=side*.029+(j-1)*.039;
      seam(elbow,[x,-.355,.135],[x,-.426,.123],.0025,tape,
        'Glove knuckle stitch');
    }
    ring(thigh,.139,.008,coatDark,'Worn trouser seam',
      [0,-.32,.012],[-Math.PI/2,0,0]);
    rounded(knee,[.22,.040,.12],[0,-.32,.116],leather,'Boot ankle strap');
    rounded(knee,[.20,.014,.023],[0,-.33,.186],zipper,'Boot strap buckle');
    seam(knee,[-.065,-.23,.128],[-.065,-.37,.146],.0035,thread,
      'Boot stitching');
  }
  // Belt & pant details have their own quiet values so they read in moonlight.
  rounded(pelvis,[.54,.075,.32],[0,-.21,.004],leather,'Dark webbing belt');
  rounded(pelvis,[.07,.065,.014],[0,-.20,.179],zipper,'Weathered belt buckle');
  rounded(spine,[.15,.30,.020],[.30,-.01,-.20],tape,
    'Back jacket repair patch').rotation.z=-.13;
  const additions=[];
  for(const bone of bones.values()){
    bone.traverse(node=>{
      if(node.isMesh&&node.name) additions.push(node.name);
    });
  }
  return {boneCount:bones.size,changedMaterials,attachmentCount:additions.length,
    artStyle:'The Uninvited — grounded low-light human'};
}
