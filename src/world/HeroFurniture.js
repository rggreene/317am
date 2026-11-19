import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {box,rounded,cylinder} from './EnvironmentKit.js';

// Hand-shaped procedural hero meshes; deliberate intermediate art, not Blender exports.
// Each named group has a stable world-space pivot and can later be replaced by a GLB.
const clothMat=(base)=>new THREE.MeshStandardMaterial({
  color:base,roughness:.97,metalness:0,side:THREE.DoubleSide
});
function mesh(parent,geometry,material,name,position=[0,0,0]){
  const obj=new THREE.Mesh(geometry,material);
  obj.name=name;obj.position.set(...position);
  obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;
}
function group(name,origin){
  const g=new THREE.Group();g.name='ArtSlot:'+name;g.position.set(...origin);
  g.userData.assetId=name;return g;
}
function refinedCushion(parent,size,material,location,name,{radius=.11,compression=.019,wrinkle=.006}={}){
  const [w,h,d]=size;
  const geo=new RoundedBoxGeometry(w,h,d,5,Math.min(radius,h*.47,w*.25,d*.25));
  const arr=geo.attributes.position;
  for(let i=0;i<arr.count;i++){
    const x=arr.getX(i),y=arr.getY(i),z=arr.getZ(i);
    const xn=Math.min(1,Math.abs(x)/(w*.5)),zn=Math.min(1,Math.abs(z)/(d*.5));
    const center=Math.max(0,1-xn*xn)*Math.max(0,1-zn*zn);
    let ny=y;
    if(y>0)ny-=compression*center;
    if(Math.abs(y)<h*.29)ny+=wrinkle*Math.sin(x*20+z*8)*(1-center);
    arr.setY(i,ny);
  }
  geo.computeVertexNormals();
  return mesh(parent,geo,material,name,location);
}
function seam(parent,coords,material,radius=.006,name='Fabric piping',segments=40){
  const path=new THREE.CatmullRomCurve3(coords.map(p=>new THREE.Vector3(...p)),true,'centripetal');
  return mesh(parent,new THREE.TubeGeometry(path,segments,radius,5,true),material,name);
}
function taperedLeg(parent,at,y,height,material){
  const [x,z]=at;
  const part=mesh(parent,new THREE.CylinderGeometry(.038,.056,height,8),material,'Tapered hardwood leg',[x,y,z]);
  part.scale.z=.90;
  return part;
}
function drawerPull(parent,x,y,z,material){
  box(parent,[.18,.015,.014],material,[x,y,z],{name:'Dresser satin handle'});
  for(const off of [-.075,.075])box(parent,[.015,.04,.018],material,[x+off,y,z-.016],{name:'Drawer handle stand-off'});
}

export function buildHeroSofa(m){
  const g=group('room_sofa_2seat',[1.50,0,1.26]);
  const fabric=m.upholsteryShade,seat=m.upholstery;
  const piping=clothMat('#66717d');
  const stitch=clothMat('#89959e');
  const wood=m.darkWood;

  for(const x of [-.82,.82])for(const z of [-.33,.33]){
    taperedLeg(g,[x,z],.095,.19,wood);
    rounded(g,[.08,.027,.08],m.edge,[x,.18,z],.012,{cast:false,name:'Sofa leg ferrule'});
  }
  refinedCushion(g,[2.01,.28,.92],fabric,[0,.33,0],'Sofa supported seat frame',{radius:.09,compression:.006});
  refinedCushion(g,[2.00,.72,.24],fabric,[0,.64,.395],'Sofa sloped back shell',{radius:.12,compression:.008});
  for(const dir of [-1,1]){
    const arm=refinedCushion(g,[.235,.47,.96],fabric,[dir*.89,.50,0],'Upholstered rolled arm',{radius:.112,compression:.007});
    arm.rotation.z=-dir*.02;
    seam(g,[
      [dir*.90,.68,-.36],[dir*.9,.71,-.14],[dir*.91,.71,.21],
      [dir*.90,.69,.42],[dir*.87,.59,.43],[dir*.87,.35,.40],
      [dir*.87,.32,-.34],[dir*.90,.51,-.42]
    ],piping,.0055,'Arm binding');
  }
  for(const dir of [-1,1]){
    const x=dir*.485;
    refinedCushion(g,[.92,.17,.78],seat,[x,.51,-.035],
      'Individually compressed sofa seat',{radius:.095,compression:.027,wrinkle:.005});
    refinedCushion(g,[.91,.52,.21],seat,[x,.70,.33],
      'Slouched sofa back cushion',{radius:.07,compression:.027,wrinkle:.008})
      .rotation.x=-.07;
    const ex=x+(dir*.008);
    seam(g,[
      [ex-.42,.56,-.31],[ex+.42,.56,-.31],[ex+.45,.47,-.25],
      [ex+.45,.46,.27],[ex-.45,.46,.27],[ex-.45,.48,-.26]
    ],piping,.006,'Seat cushion piping',44);
    seam(g,[
      [ex-.42,.84,.36],[ex+.42,.84,.36],[ex+.44,.71,.40],
      [ex+.40,.49,.41],[ex-.42,.49,.41],[ex-.45,.70,.39]
    ],piping,.0055,'Back cushion piping',44);
    // Subtle thread marks at a single cushion edge, not dozens of individual meshes.
    const stitchPoints=[];
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2;
      stitchPoints.push([x+.445*Math.cos(a),.573,-.035+.365*Math.sin(a)]);
    }
    const stitchGeo=new THREE.BufferGeometry();
    stitchGeo.setFromPoints(stitchPoints.map(p=>new THREE.Vector3(...p)));
    const line=new THREE.LineLoop(stitchGeo,new THREE.LineBasicMaterial({color:'#8393a0',transparent:true,opacity:.55}));
    line.name='Subtle stitched seat boundary';g.add(line);
  }
  // A pillow is intentionally off-kilter, not a perfect symmetric duplicate.
  const pillow=refinedCushion(g,[.33,.35,.14],m.throw,[.69,.78,.20],
    'Worn lumbar cushion',{radius:.073,compression:.013});
  pillow.rotation.z=-.24;pillow.rotation.y=-.16;
  seam(g,[[.49,.84,.28],[.83,.89,.27],[.84,.66,.27],[.48,.65,.27]],piping,.005,'Pillow edge binding',22);

  // Pooled blanket: a light cloth surface drapes over the front of the seat.
  const w=.59,d=.85,cols=16,rows=20,verts=[],uv=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows;
    const x=-.66+(u-.5)*w;
    const z=-.23+v*d;
    const fold=.016*Math.sin(u*5*Math.PI+v*4);
    const drop=Math.max(0,(v-.78)/.22);
    const y=.608+fold-.27*drop;
    verts.push(x,y,z);uv.push(u,v);
    if(i<cols&&j<rows){
      const a=j*(cols+1)+i,b=a+cols+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  const blanketGeo=new THREE.BufferGeometry();
  blanketGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  blanketGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  blanketGeo.setIndex(indices);blanketGeo.computeVertexNormals();
  mesh(g,blanketGeo,clothMat('#b5afa5'),'Soft throw draped over sofa');
  // A few small seam folds along the edge give the cloth an actual silhouette.
  const hem=[];
  for(let i=0;i<=cols;i++){
    const u=i/cols,v=1,drop=1;
    hem.push([-.66+(u-.5)*w,.608+.016*Math.sin(u*5*Math.PI+4)-.27*drop,-.23+d]);
  }
  const edgeGeo=new THREE.BufferGeometry().setFromPoints(hem.map(p=>new THREE.Vector3(...p)));
  g.add(new THREE.Line(edgeGeo,new THREE.LineBasicMaterial({color:'#d4ccc0',transparent:true,opacity:.8})));
  g.userData.prototypeQuality='art-pass-1';
  return g;
}

export function buildHeroCoffeeTable(m){
  const g=group('room_coffee_table',[1.49,0,.17]);
  const wood=m.wood,under=m.darkWood,metal=m.brass;
  rounded(g,[1.16,.085,.66],wood,[0,.47,0],.028,{name:'Coffee table top'});
  rounded(g,[1.05,.036,.54],under,[0,.419,0],.012,{name:'Underside apron'});
  for(const x of [-.47,.47])for(const z of [-.245,.245]){
    const leg=mesh(g,new THREE.CylinderGeometry(.029,.051,.37,8),under,'Angled solid-wood table leg',
      [x,.236,z]);
    leg.rotation.z=-Math.sign(x)*.052;leg.rotation.x=Math.sign(z)*.045;
    cylinder(g,.045,.045,.014,metal,[x,.408,z],12).name='Table leg brass joinery';
  }
  rounded(g,[1.035,.03,.50],under,[0,.22,0],.014,{name:'Lower wood shelf'});
  // Slight joinery lines, drawn as subtle inlaid dark rails.
  for(const z of [-.28,.28]){
    box(g,[.96,.006,.008],under,[0,.518,z],{cast:false,name:'Top hardwood seam'});
  }
  for(const x of [-.48,.48]){
    box(g,[.012,.06,.46],metal,[x,.418,0],{cast:false,name:'Apron screw rail'});
  }
  g.userData.prototypeQuality='art-pass-1';
  return g;
}

export function buildHeroBed(m){
  const g=group('room_bed_dressed',[-1.91,0,-1.36]);
  // Local +Z points toward the foot of the bed.
  for(const x of [-.78,.78])for(const z of [-.89,.89]){
    taperedLeg(g,[x,z],.135,.27,m.darkWood);
  }
  rounded(g,[1.78,.27,2.12],m.darkWood,[0,.30,0],.045,{name:'Timber bed frame'});
  rounded(g,[1.68,.24,2.02],m.paleLinen,[0,.48,.015],.085,{name:'Mattress with rounded ticking'});
  const headboard=rounded(g,[1.85,.79,.15],m.darkWood,[0,.54,-1.018],.035,{name:'Bed headboard frame'});
  // Soft vertical inset panels rather than a single flat brown slab.
  for(let i=0;i<5;i++){
    const x=-.72+i*.36;
    refinedCushion(g,[.31,.56,.073],m.upholsteryShade,[x,.60,-.927],
      'Fabric padded headboard channel',{radius:.033,compression:.008});
  }
  // Side of comforter provides physical mass; top is a variable folded cloth mesh.
  refinedCushion(g,[1.63,.12,1.40],m.upholstery,[0,.665,.30],
    'Comforter body with rounded overhang',{radius:.04,compression:.012});
  const w=1.65,d=1.36,cols=22,rows=18,verts=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows;
    const x=(u-.5)*w,z=-.37+v*d;
    const boundary=Math.max(0,1-Math.abs(x)/(w*.5));
    const y=.746+.021*Math.sin(v*21+u*3)*boundary+
      .014*Math.sin(u*13-v*12)*boundary;
    verts.push(x,y,z);
    if(j<rows&&i<cols){
      const a=j*(cols+1)+i,b=a+cols+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  mesh(g,geo,clothMat('#b3bbc1'),'Rumpled quilt surface');
  // Two genuinely puffed pillows, each off-axis by a few degrees.
  for(const [x,rot] of [[-.42,.065],[.42,-.10]]){
    const pillow=refinedCushion(g,[.69,.16,.40],m.paleLinen,[x,.705,-.72],
      'Pillow with fabric edge',{radius:.07,compression:.027});
    pillow.rotation.y=rot;
  }
  // Folded top sheet inset between the two pillows and duvet.
  rounded(g,[1.50,.025,.12],m.paper,[0,.772,-.37],.01,{name:'Top sheet folded seam'});
  g.userData.prototypeQuality='art-pass-1';
  return g;
}

export function buildHeroDresser(m){
  const g=group('room_dresser_phone',[-2.78,0,1.46]);
  rounded(g,[.66,1.13,.34],m.darkWood,[0,.598,0],.023,{name:'Dresser solid wood carcass'});
  rounded(g,[.70,.034,.37],m.wood,[0,1.17,0],.012,{name:'Dresser crown and phone surface'});
  for(let i=0;i<4;i++){
    const y=.238+i*.254;
    rounded(g,[.603,.221,.021],m.wood,[0,y,.176],.01,{name:'Dresser drawer front'});
    box(g,[.57,.006,.007],m.darkWood,[0,y+.102,.190],{cast:false,name:'Drawer reveal'});
    drawerPull(g,0,y,.194,m.brass);
  }
  for(const x of [-.27,.27])for(const z of [-.13,.13]){
    rounded(g,[.057,.10,.057],m.darkWood,[x,.055,z],.01,{name:'Dresser footing'});
  }
  // Phone stays in original place, on the unchanged in-game interaction anchor.
  g.userData.prototypeQuality='art-pass-1';
  return g;
}
