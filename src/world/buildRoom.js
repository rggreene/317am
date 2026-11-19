import * as THREE from 'three';
import {createIntruder} from '../actors/createIntruder.js';
import {makeMaterials} from './materialLibrary.js';
import {box,rounded,cylinder,sphere,plane} from './EnvironmentKit.js';
import {HERO_LAYOUT} from './heroLayout.js';
import {buildHeroSofa,buildHeroCoffeeTable,buildHeroBed,buildHeroDresser,buildHeroRug,buildHeroMediaCenter} from './HeroFurniture.js';

/**
 * Milestone 6: polished procedural environment testbed.
 * The main gameplay apartment still lives in v0.4 on main.
 * Everything in here uses standard glTF-compatible PBR material inputs.
 */
export function buildRoom(){
  const root=new THREE.Group();
  root.name='Hero Apartment — living room and hallway';
  const m=makeMaterials();
  const {wallHeight}=HERO_LAYOUT.room;
  const curtains=[];
  const artSlots=new Map();
  function registerHero(id,group){
    if(artSlots.has(id))throw Error('Duplicate hero art slot: '+id);
    group.userData.assetId=id;
    artSlots.set(id,group);
    root.add(group);
    return group;
  }

  const b=(size,material,p,opts)=>box(root,size,material,p,opts);
  const r=(size,material,p,rad=.06,opts)=>rounded(root,size,material,p,rad,opts);
  const c=(top,bottom,h,material,p)=>cylinder(root,top,bottom,h,material,p);
  const s=(rad,material,p)=>sphere(root,rad,material,p);

  // Floor: real plank separation, subtle staggered joints and long-board grain.
  b([6.55,.18,5.48],m.darkWood,[0,-.12,0],{cast:false,name:'Floor substructure'});
  for(let row=0;row<25;row++){
    const z=-2.59+row*.217;
    for(let seg=0;seg<3;seg++){
      const boundaries=seg===0?[-3.23,-1.20+(row%2)*.45]:seg===1?[-1.20+(row%2)*.45,.90+(row%2)*.42]:[.90+(row%2)*.42,3.23];
      const width=boundaries[1]-boundaries[0]-.013;
      b([width,.019,.207],m.floor,[(boundaries[0]+boundaries[1])/2,.009,z],{cast:false,name:'Laminate floor plank'});
    }
  }

  // Architectural envelope: no overhead ceiling so orbit camera keeps a cutaway.
  b([.14,wallHeight,5.36],m.wall,[-3.24,wallHeight/2,0],{name:'Bedroom side wall'});
  b([.16,wallHeight,1.48],m.wall,[-.12,wallHeight/2,-1.93],{name:'Partial bedroom divider'});
  b([.14,wallHeight,5.36],m.wall,[3.24,wallHeight/2,0],{name:'Living outer wall'});
  // Two genuinely recessed openings facing the rear exterior.
  const spans=[[-3.24,-2.35],[-.98,.67],[1.77,3.24]];
  for(const [start,end] of spans){
    b([end-start,wallHeight,.15],m.wall,[(start+end)/2,wallHeight/2,-2.66]);
  }
  const openings=[[-2.35,-.98],[.67,1.77]];
  for(const [start,end] of openings){
    const x=(start+end)/2,w=end-start;
    b([w,.94,.15],m.wall,[x,.47,-2.66]);
    b([w,.39,.15],m.wall,[x,2.655,-2.66]);
    b([w+.09,.07,.19],m.trim,[x,.975,-2.56],{cast:false});
    b([w+.09,.07,.19],m.trim,[x,2.49,-2.56],{cast:false});
    for(const side of [-1,1]){
      b([.065,1.49,.19],m.trim,[x+side*(w/2),1.73,-2.57],{cast:false});
    }
    b([.038,1.42,.065],m.edge,[x,1.74,-2.48],{cast:false});
    b([w,.035,.07],m.edge,[x,1.72,-2.48],{cast:false});
    plane(root,w-.085,1.43,m.window,[x,1.73,-2.465],{vertical:true});
    // Rolled-down translucent linen curtains at outer edges.
    const fabricSide=new THREE.MeshStandardMaterial({color:'#98a7b3',roughness:.96,transparent:true,opacity:.77,side:THREE.DoubleSide});
    for(const dir of [-1,1]){
      const curtain=plane(root,.20,1.67,fabricSide,[x+dir*(w/2-.10),1.72,-2.38],{vertical:true});
      curtain.rotation.y=dir*.18;
      curtains.push({mesh:curtain,base:dir*.18,phase:curtains.length*1.7});
    }
    b([w+.20,.055,.30],m.trim,[x,.93,-2.50],{cast:false,name:'Window sill'});
  }

  // Skirting, crown edge and repeatable wall details.
  for(const z of [-2.55,2.55])b([6.42,.135,.08],m.trim,[0,.073,z],{cast:false});
  for(const x of [-3.145,3.145])b([.08,.135,5.25],m.trim,[x,.073,0],{cast:false});
  b([.09,.13,1.39],m.trim,[-.01,.07,-1.94],{cast:false});
  b([.11,.08,5.2],m.trim,[-3.13,2.77,0],{cast:false});
  b([.11,.08,5.2],m.trim,[3.13,2.77,0],{cast:false});
  // An understated bedroom-to-living-room passage.
  b([.09,2.12,.16],m.trim,[-.02,1.06,-1.14],{cast:false});
  b([.09,.1,.96],m.trim,[-.02,2.12,-1.88],{cast:false});
  // Vent cover and light switch.
  b([.36,.16,.028],m.edge,[3.14,2.36,.28],{cast:false});
  for(let i=0;i<6;i++)b([.018,.105,.033],m.black,[2.997+i*.053,2.36,.305],{cast:false});
  b([.025,.16,.11],m.trim,[-3.14,1.15,.38],{cast:false});

  // Hero bedroom art: physically separate frame, rumpled quilt and drawer fronts.
  // Existing phone and bedside lamp retain their exact gameplay coordinates.
  registerHero('room_bed_dressed',buildHeroBed(m));
  rounded(root,[.48,.68,.44],m.wood,[-2.92,.35,-1.28],.03);
  lamp(root,m,-2.92,-1.28,.72);
  registerHero('room_dresser_phone',buildHeroDresser(m));
  rounded(root,[.22,.038,.14],m.black,[-2.71,1.19,1.46],.01);

  // Hero art: decompressed cushions, fabric piping, textile throw.
  registerHero('room_sofa_2seat',buildHeroSofa(m));

  registerHero('room_rug',buildHeroRug(m));

  // Hero joinery: beveled hardwood, apron, angled legs, lower shelf.
  registerHero('room_coffee_table',buildHeroCoffeeTable(m));

  // Objects show the previous evening was ordinary.
  c(.094,.079,.105,m.warmGlass,[1.23,.57,.04]);
  c(.035,.035,.015,m.brass,[1.32,.59,.04]);
  r([.19,.018,.09],m.black,[1.74,.528,.26],.012);
  for(let i=0;i<5;i++)b([.005,.004,.009],m.edge,[1.682+i*.019,.54,.25],{cast:false});
  r([.24,.02,.16],m.paper,[1.48,.534,.30],.002,{cast:false});
  b([.13,.003,.008],m.ink,[1.48,.548,.31],{cast:false});

  // Coordinated cabinet and TV with functional power glow.
  const media=buildHeroMediaCenter(m);
  registerHero('room_media_console',media.cabinet);
  registerHero('prop_television',media.tv);

  // Compact kitchenette remains navigationally compatible with previous build.
  r([.80,1.87,.75],m.chrome,[2.79,.935,-1.67],.025,{name:'Refrigerator'});
  b([.025,.32,.03],m.edge,[2.42,1.19,-1.30]);
  r([.95,.90,.62],m.wood,[2.18,.45,-.75],.02);
  r([.99,.065,.69],m.chrome,[2.18,.935,-.75],.015);
  c(.11,.12,.075,m.clay,[2.08,1.04,-.81]);
  s(.09,m.leaf,[2.27,1.08,-.66]);

  // Entry-hall story details, mounted where they don't block first-person travel.
  // Thin hallway console next to the bedroom divider (not across a walkway).
  r([.53,.06,.25],m.wood,[-.52,.89,-1.26],.012);
  for(const x of [-.74,-.30])b([.045,.85,.04],m.darkWood,[x,.44,-1.26]);
  r([.16,.017,.095],m.paper,[-.62,.935,-1.22],.004,{cast:false});
  for(const x of [-.57,-.52,-.47])s(.016,m.brass,[x,.966,-1.26]);
  const shoes=[[-2.88,2.16],[-2.61,2.10]];
  for(const [x,z] of shoes){
    const shoe=r([.18,.115,.32],m.black,[x,.065,z],.05);
    shoe.rotation.y=-.12;
  }
  // Wall art: frames, matte insets and monochrome abstract print.
  for(const [x,y,z,w,h] of [[-3.116,1.83,1.48,.46,.65],[-3.116,1.59,.55,.36,.44]]){
    const frame=r([.025,h+.075,w+.075],m.darkWood,[x,y,z],.013);
    const paper=r([.028,h-.03,w-.03],m.paper,[x+.015,y,z],.01,{cast:false});
    paper.rotation.y=0;frame.rotation.y=0;
    b([.030,h*.21,w*.46],m.ink,[x+.033,y-.05,z],{cast:false});
  }
  // Small plant in a pot next to the window.
  c(.14,.108,.27,m.clay,[.38,.14,-2.06]);
  for(const [ox,oz,len] of [[-.08,-.03,.34],[.06,.05,.42],[.07,-.09,.28],[-.05,.08,.31]]){
    const stem=b([.026,len,.026],m.leaf,[.38+ox/2,.28+len/2,-2.06+oz/2]);
    stem.rotation.z=ox*.7;
    const leaf=s(.095,m.leaf,[.38+ox,.27+len,-2.06+oz]);
    leaf.scale.set(1,.35,.65);
  }

  // Slender standing practical next to the sofa, not in the player corridor.
  c(.145,.155,.045,m.chrome,[2.81,.04,2.08]);
  c(.022,.022,1.19,m.chrome,[2.81,.655,2.08]);
  const standingShade=c(.19,.275,.29,m.lampShade,[2.81,1.41,2.08]);
  standingShade.castShadow=true;
  // A small baseboard outlet + accessible dangling cable.
  b([.04,.09,.11],m.trim,[3.13,.19,1.81],{cast:false});
  b([.035,.15,.015],m.black,[3.10,.15,1.84],{cast:false});

  const intruder=createIntruder();
  root.add(intruder.group);

  // Spotlights are not authored in buildRoom; Game.js owns the runtime lights.
  return {
    root,intruder,heroLayout:HERO_LAYOUT,artSlots,
    updateAmbience(elapsed){
      // Small movement only; do not swing entire curtains through the walls.
      for(const item of curtains){
        item.mesh.rotation.y=item.base+
          .026*Math.sin(elapsed*.46+item.phase);
      }
    }
  };
}

function lamp(root,m,x,z,y){
  const foot=cylinder(root,.14,.155,.03,m.chrome,[x,y,z]);
  foot.castShadow=true;
  cylinder(root,.022,.025,.32,m.chrome,[x,y+.17,z]);
  const shade=cylinder(root,.15,.235,.32,m.lampShade,[x,y+.42,z],22);
  shade.castShadow=true;
}
