import * as THREE from 'three';
import { createIntruder } from '../actors/createIntruder.js';

const mat=(color,roughness=0.88,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const wall=mat('#82909c');
const trim=mat('#c6ccd0',0.72);
const darkWood=mat('#49372e');
const wood=mat('#775541',0.83);
const fabric=mat('#536579',0.97);
const fabricDark=mat('#36485b',0.98);
const bedding=mat('#9aa6b4',0.95);
const metal=mat('#838b91',0.34,0.7);
const black=mat('#171d24',0.49);
const warm=new THREE.MeshStandardMaterial({color:'#e9c18c',roughness:0.65,emissive:'#b07832',emissiveIntensity:0.22});
const screen=new THREE.MeshStandardMaterial({color:'#203e52',emissive:'#497b9e',emissiveIntensity:0.55,roughness:0.31});

function box(parent,size,material,position,cast=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
  m.position.set(...position);
  m.castShadow=cast;
  m.receiveShadow=true;
  parent.add(m);
  return m;
}
function sphere(parent,r,material,position){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);
  m.position.set(...position);
  m.castShadow=true;
  parent.add(m);
  return m;
}
function lamp(parent,x,z){
  box(parent,[0.35,0.035,0.35],metal,[x,0.62,z]);
  box(parent,[0.045,0.42,0.045],metal,[x,0.84,z]);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.26,0.32,16),warm);
  shade.position.set(x,1.08,z);
  shade.castShadow=true;
  parent.add(shade);
}
function glass(parent,x,width){
  box(parent,[width+0.18,1.55,0.12],trim,[x,1.72,-2.58],false);
  const blue=new THREE.Mesh(new THREE.PlaneGeometry(width,1.38),new THREE.MeshBasicMaterial({color:'#6d99b5',transparent:true,opacity:0.31,depthWrite:false,side:THREE.DoubleSide}));
  blue.position.set(x,1.72,-2.48);
  parent.add(blue);
  box(parent,[0.065,1.45,0.08],trim,[x,1.72,-2.45],false);
  box(parent,[width,0.065,0.08],trim,[x,1.72,-2.45],false);
}
function makeBackWall(root){
  // Two genuine openings in the back wall instead of flat decals.
  const sections=[[-3.24,-2.35],[-0.98,0.67],[1.77,3.24]];
  for(const [a,b] of sections)box(root,[b-a,2.85,0.14],wall,[(a+b)/2,1.425,-2.66]);
  for(const [a,b] of [[-2.35,-0.98],[0.67,1.77]]){
    box(root,[b-a,0.94,0.14],wall,[(a+b)/2,0.47,-2.66]);
    box(root,[b-a,0.39,0.14],wall,[(a+b)/2,2.655,-2.66]);
  }
  glass(root,-1.665,1.31);
  glass(root,1.22,1.05);
  box(root,[6.48,0.1,0.15],trim,[0,0.06,-2.52]);
}
export function buildRoom(){
  const root=new THREE.Group();
  // Floor and restrained procedural board variation.
  box(root,[6.55,0.23,5.48],darkWood,[0,-0.12,0],false);
  for(let i=0;i<23;i++){
    const t=i/22;
    const c=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(0.07+(i%4)*0.003,0.25,0.30+(i%5)*0.018),roughness:0.89});
    box(root,[6.38,0.018,0.226],c,[0,0.003,-2.5+i*0.228],false);
  }
  makeBackWall(root);
  box(root,[0.15,2.85,5.36],wall,[-3.24,1.425,0]);
  box(root,[0.13,0.11,5.36],trim,[-3.11,0.06,0]);
  box(root,[0.13,2.85,1.45],wall,[-0.12,1.425,-1.93]); // Partial bedroom divider.
  box(root,[0.13,0.12,1.45],trim,[0.02,0.08,-1.93]);

  // Bedroom: bed frame, mattress, pillows, duvet, bedside lamp.
  box(root,[1.74,0.28,2.13],wood,[-1.91,0.2,-1.36]);
  box(root,[1.84,0.76,0.15],darkWood,[-1.91,0.51,-2.37]);
  box(root,[1.64,0.24,2.00],bedding,[-1.91,0.45,-1.33]);
  box(root,[1.66,0.105,1.33],fabric,[-1.91,0.63,-0.94]);
  box(root,[0.65,0.12,0.39],bedding,[-2.33,0.65,-2.02]);
  box(root,[0.65,0.12,0.39],bedding,[-1.53,0.65,-2.02]);
  box(root,[0.45,0.67,0.42],wood,[-2.93,0.34,-1.27]);
  lamp(root,-2.93,-1.27);
  box(root,[0.64,1.15,0.35],wood,[-2.78,0.58,1.46]);
  box(root,[0.25,0.07,0.22],black,[-2.72,1.19,1.47]); // Phone.

  // Living room: sectional, cushions, coffee table and TV.
  box(root,[2.0,0.32,0.91],fabric,[1.5,0.26,1.26]);
  box(root,[2.0,0.79,0.22],fabric,[1.5,0.55,1.64]);
  box(root,[0.23,0.57,0.98],fabric,[0.49,0.35,1.26]);
  box(root,[0.23,0.57,0.98],fabric,[2.51,0.35,1.26]);
  box(root,[0.86,0.11,0.75],fabricDark,[1.03,0.47,1.23]);
  box(root,[0.86,0.11,0.75],fabricDark,[1.99,0.47,1.23]);
  box(root,[1.15,0.08,0.64],wood,[1.49,0.45,0.17]);
  for(const dx of [-0.49,0.49])for(const dz of [-0.25,0.25])box(root,[0.06,0.4,0.06],darkWood,[1.49+dx,0.21,0.17+dz]);
  box(root,[1.58,0.38,0.41],wood,[1.60,0.21,-2.17]);
  box(root,[1.30,0.82,0.08],black,[1.60,1.02,-2.17]);
  box(root,[1.20,0.68,0.02],screen,[1.60,1.02,-2.11],false);
  // Kitchen and lived-in extras.
  box(root,[0.76,1.86,0.74],metal,[2.78,0.93,-1.65]);
  box(root,[0.76,0.06,0.11],black,[2.78,1.07,-1.25]);
  box(root,[0.95,0.9,0.62],wood,[2.18,0.45,-0.75]);
  box(root,[0.98,0.065,0.68],metal,[2.18,0.93,-0.75]);
  sphere(root,0.11,mat('#a86145'),[2.07,1.05,-0.79]);
  sphere(root,0.105,mat('#607b4d'),[2.26,1.05,-0.66]);
  box(root,[0.52,0.07,0.3],wood,[-2.34,1.88,2.48]);
  for(let i=0;i<4;i++)box(root,[0.095,0.32+(i%2)*0.1,0.20],mat(['#644a41','#897d68','#4d5e6e','#8c6f58'][i]),[-2.51+i*0.13,2.06,2.46]);
  const intruder=createIntruder();
  root.add(intruder.group);
  return {root,intruder};
}
