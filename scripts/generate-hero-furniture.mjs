// Reproducible, asset-friendly GLB generator; outputs six committed furniture assets.
// Run: npm run assets:hero-furniture. Requires Node 22+ only.
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
function buildAssets(){
  const mats={
    sofa:[
      ["Slate woven fabric",[.26,.31,.34,1],.98,0],
      ["Seat cushions",[.35,.41,.45,1],.95,0],
      ["Piping and stitching",[.21,.25,.27,1],.99,0],
      ["Walnut feet",[.24,.14,.095,1],.70,0]
    ],
    table:[
      ["Walnut hardwood",[.39,.23,.14,1],.72,0],
      ["Darker endgrain",[.22,.12,.075,1],.82,0],
      ["Aged brass",[.45,.36,.22,1],.46,.60]
    ]
  };
  function meshBuilder(materials){
    const groups=materials.map(()=>({p:[],n:[],uv:[],indices:[]}));
    function shape(mat,verts,faces,tex){
      const g=groups[mat],base=g.p.length/3;g.p.push(...verts);
      g.uv.push(...(tex||new Array(verts.length/3*2).fill(0)));
      for(const id of faces)g.indices.push(base+id);
    }
    function capsuleBox(material,pos,size,longitude=22,latitude=14,exponent=.34,details={}){
      const [cx,cy,cz]=pos,[sx,sy,sz]=size,verts=[],faces=[],uv=[];
      const signed=(x,p)=>Math.sign(x)*Math.pow(Math.abs(x),p);
      for(let a=0;a<=latitude;a++){
        const polar=a*Math.PI/latitude,sp=signed(Math.sin(polar),exponent),cp=signed(Math.cos(polar),exponent);
        for(let b=0;b<=longitude;b++){
          const angle=b*Math.PI*2/longitude,cs=signed(Math.cos(angle),exponent),sn=signed(Math.sin(angle),exponent);
          const x=cx+sx*.5*sp*cs,z=cz+sz*.5*sp*sn;
          const normX=(x-cx)/(sx*.5),normZ=(z-cz)/(sz*.5);
          const envelope=Math.max(0,1-Math.pow(Math.abs(normX),3))*Math.max(0,1-Math.pow(Math.abs(normZ),3));
          const sag=details.sag||0,fold=details.fold||0;
          let y=cy+sy*.5*cp;
          if(cp>0)y-=sag*envelope;
          y+=fold*Math.sin(x*15+z*4)*Math.pow(1-envelope,1.5);
          verts.push(x,y,z);uv.push(b/longitude,a/latitude);
          if(a<latitude&&b<longitude){
            const i=a*(longitude+1)+b,j=i+longitude+1;
            faces.push(i,i+1,j,i+1,j+1,j);
          }
        }
      }
      shape(material,verts,faces,uv);
    }
    function box(material,center,size){
      const [cx,cy,cz]=center,[sx,sy,sz]=size;
      const v=[],idx=[],uv=[];
      for(const spec of [
        [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
        [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
        [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
        [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
        [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
        [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]
      ]){
        const base=v.length/3;
        for(let i=0;i<4;i++){
          const p=spec[i];
          v.push(cx+p[0]*sx*.5,cy+p[1]*sy*.5,cz+p[2]*sz*.5);
          uv.push(i===1||i===2?1:0,i>=2?1:0);
        }
        idx.push(base,base+1,base+2,base,base+2,base+3);
      }
      shape(material,v,idx,uv);
    }
    function tube(material,points,r=.006,sides=7){
      const v=[],idx=[],uv=[],length=points.length;
      for(let j=0;j<length;j++){
        const [x,y,z]=points[j];
        const prior=points[Math.max(0,j-1)],next=points[Math.min(length-1,j+1)];
        let dx=next[0]-prior[0],dy=next[1]-prior[1],dz=next[2]-prior[2];
        const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
        let nx=-dz,nz=dx,ln=Math.hypot(nx,nz);
        if(ln<.01){nx=1;nz=0;ln=1;}nx/=ln;nz/=ln;
        const bx=dy*nz,by=dz*nx-dx*nz,bz=-dy*nx;
        for(let s=0;s<sides;s++){
          const a=s*Math.PI*2/sides;
          v.push(x+r*(nx*Math.cos(a)+bx*Math.sin(a)),y+r*by*Math.sin(a),z+r*(nz*Math.cos(a)+bz*Math.sin(a)));
          uv.push(s/sides,j/length);
          if(j<length-1){
            const p=j*sides+s,q=j*sides+(s+1)%sides;
            idx.push(p,p+sides,q,p+sides,q+sides,q);
          }
        }
      }
      shape(material,v,idx,uv);
    }
    function cylinder(material,center,rt,rb,h,sides=12){
      const [x,y,z]=center;const v=[],idx=[],uv=[];
      for(let layer=0;layer<=1;layer++){
        const yy=y+(layer-.5)*h,r=layer?rt:rb;
        for(let k=0;k<sides;k++){
          const a=2*Math.PI*k/sides;v.push(x+r*Math.cos(a),yy,z+r*Math.sin(a));uv.push(k/sides,layer);
          if(layer===0){const p=k,q=(k+1)%sides;idx.push(p,sides+p,q,sides+p,sides+q,q);}
        }
      }
      // Cap: valid glTF triangle indices, top and bottom
      const bottom=v.length/3;v.push(x,y-h/2,z);uv.push(.5,.5);
      const top=v.length/3;v.push(x,y+h/2,z);uv.push(.5,.5);
      for(let k=0;k<sides;k++){const next=(k+1)%sides;
        idx.push(bottom,next,k);idx.push(top,sides+k,sides+next);
      }
      shape(material,v,idx,uv);
    }
    return {groups,capsuleBox,box,tube,cylinder};
  }
  function outputGLB(items,materials,metadata){
    const bytesParts=[],bufferViews=[],accessors=[];let offset=0;
    function pack(data,componentType,type,target){
      while(offset%4){bytesParts.push({offset,data:new Uint8Array([0])});offset++;}
      const array=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
      const start=offset;bytesParts.push({offset,data:array});offset+=array.length;
      const v={buffer:0,byteOffset:start,byteLength:array.length};if(target)v.target=target;
      const viewIndex=bufferViews.push(v)-1;
      const components=type==='VEC3'?3:type==='VEC2'?2:1;
      const accessor={bufferView:viewIndex,componentType,count:data.length/components,type};
      if(type==='VEC3'&&componentType===5126){
        const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
        for(let i=0;i<data.length;i+=3)for(let axis=0;axis<3;axis++){
          min[axis]=Math.min(min[axis],data[i+axis]);max[axis]=Math.max(max[axis],data[i+axis]);
        }
        accessor.min=min;accessor.max=max;
      }
      return accessors.push(accessor)-1;
    }
    const primitives=[];let triangles=0;
    for(let mi=0;mi<items.length;mi++){
      const g=items[mi];if(!g.p.length)continue;
      // Millimeter-substep quantization makes generated geometry identical
      // across V8 revisions; trig folds otherwise drift at float32 boundaries.
      const positions=new Float32Array(g.p.map(value=>Math.round(value*10000)/10000));
      const normals=new Float32Array(positions.length);
      for(let t=0;t<g.indices.length;t+=3){
        const ia=g.indices[t]*3,ib=g.indices[t+1]*3,ic=g.indices[t+2]*3;
        const ax=positions[ib]-positions[ia],ay=positions[ib+1]-positions[ia+1],az=positions[ib+2]-positions[ia+2];
        const bx=positions[ic]-positions[ia],by=positions[ic+1]-positions[ia+1],bz=positions[ic+2]-positions[ia+2];
        const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
        for(const i of [ia,ib,ic]){normals[i]+=nx;normals[i+1]+=ny;normals[i+2]+=nz;}
      }
      for(let i=0;i<normals.length;i+=3){
        const norm=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;
        normals[i]=Math.round(normals[i]/norm*100000)/100000;
        normals[i+1]=Math.round(normals[i+1]/norm*100000)/100000;
        normals[i+2]=Math.round(normals[i+2]/norm*100000)/100000;
      }
      const pos=pack(positions,5126,'VEC3',34962);
      const normal=pack(normals,5126,'VEC3',34962);
      const uv=pack(new Float32Array(g.uv),5126,'VEC2',34962);
      const idx=pack(new Uint16Array(g.indices),5123,'SCALAR',34963);
      triangles+=g.indices.length/3;
      primitives.push({attributes:{POSITION:pos,NORMAL:normal,TEXCOORD_0:uv},indices:idx,material:mi,mode:4});
    }
    const materialDefs=materials.map(([name,rgba,roughness,metallic])=>({
      name,pbrMetallicRoughness:{baseColorFactor:rgba,roughnessFactor:roughness,metallicFactor:metallic},
      doubleSided:true
    }));
    const gltf={
      asset:{version:'2.0',generator:'3:17 AM authored procedural hero GLB'},
      scenes:[{nodes:[0]}],scene:0,
      nodes:[{name:metadata.name,mesh:0}],
      meshes:[{name:metadata.name,primitives}],
      materials:materialDefs,
      buffers:[{byteLength:offset}],bufferViews,accessors,
      extras:{description:metadata.description,triangles,source:'scripts/generate-hero-furniture.mjs'}
    };
    const json=JSON.stringify(gltf);
    const jl=Math.ceil(json.length/4)*4,bl=Math.ceil(offset/4)*4;
    const out=new Uint8Array(12+8+jl+8+bl),dv=new DataView(out.buffer);
    dv.setUint32(0,0x46546C67,true);dv.setUint32(4,2,true);dv.setUint32(8,out.length,true);
    dv.setUint32(12,jl,true);dv.setUint32(16,0x4E4F534A,true);
    out.fill(32,20,20+jl);
    for(let i=0;i<json.length;i++)out[20+i]=json.charCodeAt(i);
    const bin=20+jl;
    dv.setUint32(bin,bl,true);dv.setUint32(bin+4,0x004E4942,true);
    for(const part of bytesParts)out.set(part.data,bin+8+part.offset);
    return {bytes:out,triangles,primitives:primitives.length,materials:materials.length};
  }
  // Sofa local pivot at floor center; match existing collision/navigation footprint.
  const sofa=meshBuilder(mats.sofa);
  for(const x of [-.83,.83])for(const z of [-.32,.32]){
    sofa.cylinder(3,[x,.095,z],.038,.055,.19,10);
  }
  sofa.capsuleBox(0,[0,.32,0],[2.00,.24,.90],24,14,.37);
  sofa.capsuleBox(0,[0,.64,.355],[2.00,.60,.21],24,14,.38);
  for(const x of [-.88,.88]){
    sofa.capsuleBox(0,[x,.495,0],[.245,.47,.94],18,14,.4);
    sofa.tube(2,[[x,.64,-.38],[x,.71,-.16],[x,.72,.22],[x,.61,.42],[x,.34,.42]],.006,7);
  }
  for(const x of [-.482,.482]){
    sofa.capsuleBox(1,[x,.52,-.02],[.90,.17,.75],22,16,.40,{sag:.023});
    sofa.capsuleBox(1,[x,.705,.315],[.91,.51,.18],22,16,.42,{sag:.012});
    const left=x-.41,right=x+.41;
    sofa.tube(2,[[left,.57,-.27],[right,.57,-.27],[right,.52,.28],[left,.52,.28],[left,.57,-.27]],.006,6);
    sofa.tube(2,[[left,.82,.4],[right,.82,.4],[right,.56,.4],[left,.56,.4],[left,.82,.4]],.0045,6);
  }
  // Asymmetric throw cushion and folded blanket as separate material silhouettes.
  sofa.capsuleBox(1,[.68,.78,.14],[.35,.31,.16],16,12,.47);
  sofa.capsuleBox(0,[-.64,.604,-.16],[.57,.035,.44],22,10,.35);
  const sb=outputGLB(sofa.groups,mats.sofa,{name:'Art Hero Sofa v01',description:'Layered soft upholstery, stitched seams and tapered feet'});
  // Matching low media-level coffee table with joinery; 1.16 x .51 x .66.
  const table=meshBuilder(mats.table);
  table.capsuleBox(0,[0,.477,0],[1.16,.092,.66],18,10,.24);
  table.box(1,[0,.415,0],[1.04,.048,.55]);
  for(const x of [-.47,.47])for(const z of [-.24,.24]){
    table.cylinder(1,[x,.241,z],.027,.051,.36,9);
    table.cylinder(2,[x,.415,z],.040,.04,.014,10);
    table.cylinder(1,[x,.056,z],.051,.057,.022,10);
  }
  table.capsuleBox(0,[0,.218,0],[1.02,.043,.49],16,8,.25);
  for(const x of [-.47,.47]){
    table.box(2,[x,.402,0],[.010,.055,.49]);
  }
  table.tube(1,[[-.54,.52,-.28],[.54,.52,-.28]],.003,6);
  table.tube(1,[[-.54,.52,.28],[.54,.52,.28]],.003,6);
  const tb=outputGLB(table.groups,mats.table,{name:'Art Hardwood Coffee Table v01',description:'Beveled hardwood top, aprons, turned legs and brass ferrules'});

  const bedMaterials=[
    ["Bed frame in walnut",[.28,.16,.11,1],.76,0],
    ["Cotton mattress and pillows",[.67,.71,.72,1],.99,0],
    ["Dusty blue rumpled coverlet",[.40,.48,.53,1],.96,0],
    ["Upholstered headboard channels",[.28,.33,.36,1],.96,0]
  ];
  const bed=meshBuilder(bedMaterials);
  for(const x of [-.78,.78])for(const z of [-.89,.89])
    bed.cylinder(0,[x,.115,z],.043,.052,.23,10);
  bed.capsuleBox(0,[0,.31,0],[1.77,.27,2.12],22,12,.32);
  bed.capsuleBox(0,[0,.53,-1.01],[1.86,.78,.16],20,12,.34);
  bed.capsuleBox(1,[0,.486,.013],[1.70,.22,2.01],24,14,.37,{sag:.01});
  bed.capsuleBox(2,[0,.675,.293],[1.64,.135,1.45],24,16,.36,{sag:.017,fold:.009});
  for(const x of [-.42,.42]){
    bed.capsuleBox(1,[x,.702,-.69],[.70,.158,.41],22,14,.36,{sag:.022});
    bed.tube(1,[[x-.315,.725,-.88],[x+.315,.725,-.88],[x+.315,.715,-.50],[x-.315,.715,-.50],[x-.315,.725,-.88]],.0045,6);
  }
  for(let k=0;k<5;k++){
    const x=-.72+k*.36;
    bed.capsuleBox(3,[x,.585,-.917],[.305,.55,.065],16,12,.36,{sag:.01});
  }
  bed.capsuleBox(1,[0,.762,-.39],[1.50,.022,.12],16,8,.29);
  for(let k=0;k<7;k++){
    const z=-.25+k*.175;
    const points=[];
    for(let i=0;i<=12;i++){
      const x=-.76+i*(1.52/12);
      points.push([x,.752+.012*Math.sin(i*.73+k*1.28),z]);
    }
    bed.tube(2,points,.0025,5);
  }
  const bedAsset=outputGLB(bed.groups,bedMaterials,{name:'Art Dressed Bed v01',
    description:'Padded headboard, soft mattress, independent pillows and quilt folds'});

  const dresserMaterials=[
    ["Walnut dresser case",[.34,.22,.15,1],.74,0],
    ["Drawer endgrain fronts",[.45,.29,.18,1],.76,0],
    ["Tarnished bronze pulls",[.42,.34,.23,1],.52,.54]
  ];
  const dresser=meshBuilder(dresserMaterials);
  dresser.capsuleBox(0,[0,.59,0],[.66,1.11,.34],18,12,.22);
  dresser.capsuleBox(1,[0,1.166,0],[.70,.034,.37],18,9,.30);
  for(const x of [-.27,.27])for(const z of [-.135,.135])
    dresser.box(0,[x,.05,z],[.057,.10,.06]);
  for(let k=0;k<4;k++){
    const y=.242+k*.252;
    dresser.capsuleBox(1,[0,y,.178],[.595,.220,.019],18,10,.28);
    dresser.box(0,[0,y+.104,.194],[.56,.006,.006]);
    dresser.box(2,[0,y,.209],[.18,.012,.016]);
    for(const x of [-.074,.074])
      dresser.cylinder(2,[x,y,.209],.010,.010,.018,10);
  }
  for(const x of [-.307,.307])
    dresser.box(0,[x,.61,.178],[.015,1.0,.017]);
  const dresserAsset=outputGLB(dresser.groups,dresserMaterials,{name:'Art Four Drawer Dresser v01',
    description:'Hardwood case, recessed drawer reveals and bronzed pulls'});

  const cabinetMaterials=[
    ["Walnut media cabinet",[.37,.22,.15,1],.76,0],
    ["Shadowed cabinet carcass",[.19,.12,.09,1],.87,0],
    ["Tarnished brass cabinet pulls",[.42,.32,.20,1],.50,.58]
  ];
  const cabinet=meshBuilder(cabinetMaterials);
  for(const x of [-.70,.70])for(const z of [-.17,.17]){
    cabinet.cylinder(1,[x,.067,z],.034,.047,.134,10);
  }
  cabinet.capsuleBox(1,[0,.26,0],[1.64,.30,.45],18,12,.32);
  cabinet.capsuleBox(0,[0,.429,0],[1.68,.038,.48],22,12,.25);
  for(const x of [-.52,0,.52]){
    cabinet.capsuleBox(0,[x,.265,.228],[.467,.23,.019],16,10,.25);
    cabinet.box(2,[x,.257,.243],[.19,.012,.012]);
    cabinet.box(1,[x,.377,.23],[.46,.007,.012]);
    for(const dx of [-.08,.08]) cabinet.cylinder(2,[x+dx,.254,.249],.009,.009,.018,8);
  }
  for(const x of [-.73,.73])
    cabinet.box(1,[x,.255,.229],[.016,.24,.012]);
  const mediaAsset=outputGLB(cabinet.groups,cabinetMaterials,{
    name:'Art Media Cabinet v01',description:'Solid wood cabinet with three drawer fronts and metal pulls'});

  const televisionMaterials=[
    ["TV dark bezel and shell",[.067,.083,.10,1],.54,.04],
    ["Reflected screen glass",[.16,.29,.36,1],.32,.07],
    ["TV weighted steel stand",[.16,.18,.19,1],.51,.36]
  ];
  const tv=meshBuilder(televisionMaterials);
  tv.capsuleBox(0,[0,0,0],[1.36,.79,.088],26,18,.19);
  tv.capsuleBox(1,[0,.008,.049],[1.256,.69,.015],24,16,.15);
  tv.box(2,[0,-.408,-.019],[.105,.08,.073]);
  tv.capsuleBox(2,[0,-.468,-.015],[.45,.027,.19],18,10,.29);
  for(let k=0;k<13;k++){
    const x=-.46+k*.078;
    tv.box(0,[x,-.364,.051],[.040,.002,.004]);
  }
  tv.box(1,[.33,.199,.059],[.28,.009,.003]);
  const tvAsset=outputGLB(tv.groups,televisionMaterials,{
    name:'Art Television v01',description:'Thin bezel and glass panel with stand and ventilation slots'});
  return [
    {id:'room_media_console',path:'assets/models/furniture/room_media_console_v01.glb',...mediaAsset},
    {id:'prop_television',path:'assets/models/props/prop_television_v01.glb',...tvAsset},
    {id:'room_bed_dressed',path:'assets/models/furniture/room_bed_dressed_v01.glb',...bedAsset},
    {id:'room_dresser_phone',path:'assets/models/furniture/room_dresser_phone_v01.glb',...dresserAsset},
    {id:'room_sofa_2seat',path:'assets/models/furniture/room_sofa_2seat_v01.glb',...sb},
    {id:'room_coffee_table',path:'assets/models/furniture/room_coffee_table_v01.glb',...tb}
  ];
}
const exports=buildAssets();
for(const asset of exports){mkdirSync(dirname(asset.path),{recursive:true});writeFileSync(asset.path,asset.bytes);console.log('Wrote',asset.path,asset.bytes.length,'bytes,',asset.triangles,'triangles');}
