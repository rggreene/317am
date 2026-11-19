import * as THREE from 'three';

// Art placeholder only. Replace this rig with a Blender GLB and real animation clips.
export function createIntruder(){
  const coat=new THREE.MeshStandardMaterial({color:'#202831',roughness:0.96});
  const shadow=new THREE.MeshStandardMaterial({color:'#10151b',roughness:0.98});
  const skin=new THREE.MeshStandardMaterial({color:'#3d3533',roughness:0.96});
  const eye=new THREE.MeshStandardMaterial({color:'#b7cbd7',roughness:0.44,emissive:'#223d4b',emissiveIntensity:0.24});
  const root=new THREE.Group();
  root.position.set(0.28,0,-0.38);

  function mesh(geometry,material,parent,x=0,y=0,z=0){
    const m=new THREE.Mesh(geometry,material);
    m.position.set(x,y,z);
    m.castShadow=true;
    m.receiveShadow=true;
    parent.add(m);
    return m;
  }
  const torso=mesh(new THREE.CapsuleGeometry(0.31,0.82,5,12),coat,root,0,1.27,0);
  torso.scale.set(1,1,0.75);
  const head=mesh(new THREE.SphereGeometry(0.235,16,12),skin,root,0,1.92,0.06);
  const hood=mesh(new THREE.SphereGeometry(0.285,18,12,0,Math.PI*2,0,Math.PI*0.72),coat,root,0,2.00,-0.01);
  hood.scale.set(1.03,1,1.08);
  mesh(new THREE.BoxGeometry(0.38,0.27,0.11),shadow,root,0,1.93,0.24);
  mesh(new THREE.SphereGeometry(0.024,8,8),eye,root,-0.079,1.91,0.308);
  mesh(new THREE.SphereGeometry(0.024,8,8),eye,root,0.079,1.91,0.308);
  const leftArm=new THREE.Group();
  const rightArm=new THREE.Group();
  leftArm.position.set(-0.36,1.62,0);
  rightArm.position.set(0.36,1.62,0);
  root.add(leftArm,rightArm);
  mesh(new THREE.CapsuleGeometry(0.115,0.53,4,10),coat,leftArm,0,-0.37,0);
  mesh(new THREE.CapsuleGeometry(0.115,0.53,4,10),coat,rightArm,0,-0.37,0);
  const leftLeg=new THREE.Group();
  const rightLeg=new THREE.Group();
  leftLeg.position.set(-0.15,0.9,0);
  rightLeg.position.set(0.15,0.9,0);
  root.add(leftLeg,rightLeg);
  mesh(new THREE.CapsuleGeometry(0.123,0.59,4,10),shadow,leftLeg,0,-0.43,0);
  mesh(new THREE.CapsuleGeometry(0.123,0.59,4,10),shadow,rightLeg,0,-0.43,0);
  const animate=(time)=>{
    const step=Math.sin(time*1.55);
    root.position.y=0.014*Math.sin(time*2.1);
    root.rotation.y=-0.14+0.12*Math.sin(time*0.42);
    leftArm.rotation.x=step*0.19;
    rightArm.rotation.x=-step*0.19;
    leftLeg.rotation.x=-step*0.15;
    rightLeg.rotation.x=step*0.15;
    head.rotation.y=0.14*Math.sin(time*0.61);
    torso.rotation.z=0.016*Math.sin(time*2.1);
  };
  return {group:root,animate};
}
