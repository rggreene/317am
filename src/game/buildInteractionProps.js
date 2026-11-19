import * as THREE from 'three';
import {makeMaterials} from '../world/materialLibrary.js';
import {box,rounded,cylinder,sphere} from '../world/EnvironmentKit.js';

// All coords match the hero environment and its coarse collision envelopes.
export const INTERACTIONS=Object.freeze([
  {id:'phone',name:'Emergency phone',hint:'CALL DISPATCH',x:-2.70,z:1.46},
  {id:'door',name:'Front door',hint:'BARRICADE ENTRY',x:2.80,z:2.08},
  {id:'breaker',name:'Circuit panel',hint:'TOGGLE POWER',x:2.79,z:.38},
  {id:'medkit',name:'First-aid kit',hint:'USE FIRST AID',x:-.53,z:-1.26}
]);
export function buildInteractionProps(scene){
  const root=new THREE.Group();root.name='Survival Interactables';
  const m=makeMaterials();
  // The original room already has a small phone. The extra screen glow is a
  // clear affordance and changes color when a call has been made.
  const phoneGlow=new THREE.MeshBasicMaterial({color:'#ffb366'});
  const phone=rounded(root,[.20,.016,.12],m.black,[-2.71,1.19,1.46],.01);
  phone.name='Emergency Phone';
  box(root,[.09,.004,.07],phoneGlow,[-2.71,1.202,1.46],{cast:false});
  // These props mount on the removable cutaway wall in orbit mode.
  const wallFixtures=new THREE.Group();
  wallFixtures.name='Right wall fixtures';
  root.add(wallFixtures);
  // Door is attached to the existing right-side wall, not a new collision blocker.
  // Pivot at the near jamb: the entry leaf can visibly give way on breach.
  const doorHinge=new THREE.Group();
  doorHinge.position.set(3.11,0,1.54);
  wallFixtures.add(doorHinge);
  rounded(doorHinge,[.07,2.10,.88],m.wood,[0,1.08,.44],.025,{name:'Front Door'});
  box(wallFixtures,[.091,.07,.77],m.trim,[3.055,2.11,1.98],{cast:false});
  for(const z of [1.53,2.43])box(wallFixtures,[.092,2.13,.065],m.trim,[3.056,1.08,z],{cast:false});
  sphere(wallFixtures,.04,m.brass,[3.04,1.04,1.69]);
  const board=box(wallFixtures,[.10,.17,1.09],m.darkWood,[2.991,1.23,1.98],{name:'Barricade plank'});
  board.visible=false;
  const board2=box(wallFixtures,[.10,.17,1.09],m.darkWood,[2.991,.76,1.98],{name:'Lower barricade plank'});
  board2.visible=false;
  // Surface-mounted breaker and red/green indicator.
  rounded(wallFixtures,[.08,.46,.30],m.chrome,[3.095,1.39,.38],.016,{name:'Electrical breaker'});
  const lever=box(wallFixtures,[.083,.16,.046],m.black,[3.03,1.38,.38],{name:'Breaker switch'});
  const indicatorMat=new THREE.MeshBasicMaterial({color:'#92e3a5'});
  sphere(wallFixtures,.017,indicatorMat,[3.03,1.56,.38]);
  // First-aid box rests on hall console.
  rounded(root,[.25,.12,.16],m.paleLinen,[-.53,1.00,-1.26],.023,{name:'First Aid Kit'});
  box(root,[.145,.009,.025],m.ink,[-.53,1.069,-1.26],{cast:false});
  box(root,[.025,.009,.11],m.ink,[-.53,1.069,-1.26],{cast:false});
  const medRoot=rounded(root,[.07,.022,.08],m.paper,[-.53,1.07,-1.26],.005);
  medRoot.visible=false; // reserved for future use animation
  // Entry light hint: only visible while the actor is outside.
  const entryGlow=new THREE.PointLight('#cf784c',0,2,2);
  entryGlow.position.set(2.90,1.65,1.95);
  wallFixtures.add(entryGlow);
  // Unobtrusive, in-world interaction affordances appear only when
  // an object is actually in use range and approximately in front of the player.
  const markers=new Map();
  const markerMat=new THREE.MeshBasicMaterial({color:'#f6c58a',toneMapped:false});
  const markersAt=[
    {id:'phone',parent:root,pos:[-2.71,1.28,1.46]},
    {id:'door',parent:wallFixtures,pos:[3.018,1.44,1.97]},
    {id:'breaker',parent:wallFixtures,pos:[3.018,1.69,.38]},
    {id:'medkit',parent:root,pos:[-.53,1.17,-1.26]}
  ];
  for(const item of markersAt){
    const glow=sphere(item.parent,.034,markerMat,item.pos);
    glow.name='Interact Marker: '+item.id;
    glow.visible=false;
    markers.set(item.id,glow);
  }
  scene.add(root);
  return {
    root,wallFixtures,items:INTERACTIONS,
    update(state,focusedId=null){
      phoneGlow.color.set(state.helpCalled?'#86d3aa':'#ffb366');
      board.visible=state.doorSecured&&!state.enemyEntered;
      board2.visible=state.doorSecured&&!state.enemyEntered;
      // Exterior entry is scripted; this is the visible breach, not a
      // traversable door opening in the current cutaway wall geometry.
      doorHinge.rotation.y=state.enemyEntered?-.95:0;
      lever.rotation.z=state.breakerOn?0:Math.PI/2;
      indicatorMat.color.set(state.breakerOn?'#92e3a5':'#d2665a');
      entryGlow.intensity=state.enemyEntered?0:.20;
      for(const [id,mesh] of markers)mesh.visible=id===focusedId;
    }
  };
}
