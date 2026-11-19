import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const standardBox=new Map();
export function box(parent,size,material,position,{cast=true,name=''}={}){
  const key=size.join('/');
  if(!standardBox.has(key))standardBox.set(key,new THREE.BoxGeometry(...size));
  const mesh=new THREE.Mesh(standardBox.get(key),material);
  mesh.name=name;mesh.position.set(...position);mesh.castShadow=cast;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
}
export function rounded(parent,size,material,position,radius=.07,{cast=true,name=''}={}){
  const r=Math.min(radius,...size.map(s=>s*.48));
  const shape=new RoundedBoxGeometry(...size,2,r);
  const mesh=new THREE.Mesh(shape,material);
  mesh.name=name;mesh.position.set(...position);mesh.castShadow=cast;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
}
export function cylinder(parent,rTop,rBottom,height,material,pos,segments=16){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,height,segments),material);
  mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function sphere(parent,rad,material,pos,segments=12){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(rad,segments,10),material);
  mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function plane(parent,width,height,material,pos,{vertical=false,rotationY=0}={}){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
  mesh.rotation.set(vertical?0:-Math.PI/2,rotationY,0);
  mesh.position.set(...pos);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
