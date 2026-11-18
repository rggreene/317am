// Procedural articulated intruder source. Editable in Blender once authored replacement is ready.
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
function buildRigGLB(){
 const nodes=[
 {name:"RigRoot",children:[1,12]},
 {name:"Pelvis",translation:[0,.96,0],children:[2,8,10]},
 {name:"Spine",translation:[0,.34,0],children:[3,4,6]},
 {name:"Neck",translation:[0,.43,0],children:[5]},
 {name:"Shoulder_L",translation:[-.355,.28,0],children:[7]},
 {name:"Head",translation:[0,.17,.025]},
 {name:"Shoulder_R",translation:[.355,.28,0],children:[9]},
 {name:"Elbow_L",translation:[-.055,-.43,.01]},
 {name:"Thigh_L",translation:[-.17,-.08,0],children:[13]},
 {name:"Elbow_R",translation:[.055,-.43,.01]},
 {name:"Thigh_R",translation:[.17,-.08,0],children:[14]},
 {name:"SkeletonMarker"},
 {name:"IntruderMesh",mesh:0,skin:0},
 {name:"Knee_L",translation:[0,-.44,0]},
 {name:"Knee_R",translation:[0,-.44,0]}
 ];
 const global={};
 function calc(i,parent=[0,0,0]){let node=nodes[i],p=node.translation||[0,0,0],v=p.map((n,k)=>n+parent[k]);global[i]=v;for(let child of node.children||[])calc(child,v);}
 calc(0);
 const shapes=[];
 function ell(x,y,z,rx,ry,rz,rings=9,sides=16){
  let p=[],t=[];for(let i=0;i<=rings;i++){let a=i*Math.PI/rings;for(let j=0;j<=sides;j++){let b=j*2*Math.PI/sides;p.push(x+rx*Math.sin(a)*Math.cos(b),y+ry*Math.cos(a),z+rz*Math.sin(a)*Math.sin(b));}}
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){let a=i*(sides+1)+j,b=a+sides+1;t.push(a,a+1,b,b,a+1,b+1);}return{p,t};
 }
 function ring(profiles,sides=12){
  let p=[],t=[];for(let [x,y,z,rx,rz] of profiles)for(let i=0;i<sides;i++){let a=i*2*Math.PI/sides;p.push(x+rx*Math.cos(a),y,z+rz*Math.sin(a));}
  for(let j=0;j<profiles.length-1;j++)for(let i=0;i<sides;i++){let a=j*sides+i,b=(j+1)*sides+i,c=j*sides+(i+1)%sides,d=(j+1)*sides+(i+1)%sides;t.push(a,c,b,c,d,b);}
  return{p,t};
 }
 function cube(x,y,z,w,h,d){
  let p=[],t=[];let f=[[[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1]], [[-1,1,-1],[1,1,-1],[1,-1,-1],[-1,-1,-1]], [[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]], [[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]], [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]];
  for(let side of f){let a=p.length/3;for(let v of side)p.push(x+v[0]*w/2,y+v[1]*h/2,z+v[2]*d/2);t.push(a,a+1,a+2,a,a+2,a+3);}return{p,t};
 }
 function add(mat,joint,shape){shapes.push({mat,joint,...shape});}
 const coat=0,hood=1,skin=2,glove=3,eye=4,steel=5;
 add(coat,2,ring([[0,-.34,-.005,.25,.16],[0,-.20,0,.31,.20],[0,.1,0,.36,.23],[0,.32,0,.295,.19],[0,.39,0,.20,.14]]));
 add(hood,1,ring([[0,-.24,0,.33,.23],[0,-.09,0,.36,.24],[0,.12,0,.33,.22],[0,.20,0,.23,.18]],16));
 add(hood,2,ring([[0,.29,-.02,.29,.21],[0,.38,-.01,.24,.16]],14));
 add(hood,3,ring([[0,-.03,-.04,.16,.15],[0,.11,-.02,.23,.22],[0,.25,-.05,.25,.24],[0,.35,-.08,.17,.18],[0,.38,-.09,.015,.025]],18));
 add(skin,5,ell(0,.025,.075,.177,.212,.168,11,18));
 add(glove,5,cube(0,-.040,.225,.294,.12,.022));
 add(glove,5,cube(0,.039,.223,.296,.055,.03));
 for(let x of [-.081,.081])add(eye,5,ell(x,.058,.224,.026,.012,.006,6,10));
 add(steel,2,cube(0,-.025,.218,.018,.46,.014));
 for(let x of [-.15,.15]){add(glove,2,cube(x,-.12,.205,.17,.16,.05));add(steel,2,cube(x,-.046,.231,.12,.012,.012));}
 for(let [dir,shoulder,elbow] of [[-1,4,7],[1,6,9]]){
  add(coat,shoulder,ring([[0,.02,0,.145,.14],[dir*.01,-.12,0,.156,.146],[dir*.036,-.41,.014,.116,.11],[dir*.05,-.45,.016,.103,.098]]));
  add(glove,elbow,ring([[0,.035,0,.119,.109],[dir*.016,-.18,.012,.103,.102],[dir*.03,-.35,.03,.086,.092],[dir*.035,-.41,.03,.082,.092]]));
  add(skin,elbow,ell(dir*.035,-.42,.03,.092,.115,.10,8,12));
 }
 for(let [dir,thigh,knee] of [[-1,8,13],[1,10,14]]){
  add(hood,thigh,ring([[0,.02,0,.172,.169],[0,-.22,.014,.149,.14],[0,-.45,.01,.12,.121]],14));
  add(glove,knee,ring([[0,.04,0,.133,.128],[0,-.15,.008,.13,.12],[0,-.37,.022,.11,.102]]));
  add(glove,knee,ell(0,-.392,.08,.134,.095,.203,8,14));
 }
 for(let x of [-.225,.225])add(coat,1,cube(x,-.22,.01,.21,.34,.17));
 const grouped=Array.from({length:6},()=>({p:[],t:[],j:[],w:[]}));
 for(let part of shapes){
  let dst=grouped[part.mat],start=dst.p.length/3,offset=global[part.joint];
  for(let i=0;i<part.p.length;i+=3){dst.p.push(part.p[i]+offset[0],part.p[i+1]+offset[1],part.p[i+2]+offset[2]);dst.j.push(part.joint,0,0,0);dst.w.push(1,0,0,0);}
  for(let idx of part.t)dst.t.push(start+idx);
 }
 const chunks=[],views=[],accessors=[];let length=0;
 function pack(a,comp,type,target){
  length=Math.ceil(length/4)*4;
  const data=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),start=length;chunks.push({start,data});length+=data.length;
  const view={buffer:0,byteOffset:start,byteLength:data.length};if(target)view.target=target;
  const vi=views.push(view)-1;
  const d=type==="VEC3"?3:type==="VEC4"?4:type==="MAT4"?16:1;
  const item={bufferView:vi,componentType:comp,count:a.length/d,type};
  if(type==="VEC3" &&comp===5126){
   const mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<a.length;i+=3)for(let j=0;j<3;j++){mn[j]=Math.min(mn[j],a[i+j]);mx[j]=Math.max(mx[j],a[i+j]);}
   item.min=mn;item.max=mx;
  }
  if(type==="SCALAR"&&comp===5126){item.min=[Math.min(...a)];item.max=[Math.max(...a)];}
  return accessors.push(item)-1;
 }
 const joints=[1,2,3,4,5,6,7,8,9,10,13,14],map={};joints.forEach((n,i)=>map[n]=i);
 const primitives=[];
 for(let i=0;i<6;i++){
  const g=grouped[i],p=new Float32Array(g.p),n=new Float32Array(p.length),t=new Uint16Array(g.t);
  for(let q=0;q<t.length;q+=3){
   let a=t[q]*3,b=t[q+1]*3,c=t[q+2]*3;
   let u=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],v=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   for(let x of [a,b,c])for(let k=0;k<3;k++)n[x+k]+=normal[k];
  }
  for(let k=0;k<n.length;k+=3){let l=Math.hypot(n[k],n[k+1],n[k+2])||1;for(let j=0;j<3;j++)n[k+j]/=l;}
  let jointArray=new Uint8Array(g.j);for(let k=0;k<jointArray.length;k+=4)jointArray[k]=map[jointArray[k]];
  primitives.push({attributes:{POSITION:pack(p,5126,"VEC3",34962),NORMAL:pack(n,5126,"VEC3",34962),JOINTS_0:pack(jointArray,5121,"VEC4",34962),WEIGHTS_0:pack(new Float32Array(g.w),5126,"VEC4",34962)},indices:pack(t,5123,"SCALAR",34963),material:i,mode:4});
 }
 const inverse=[];
 for(let id of joints){let [x,y,z]=global[id];inverse.push(1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1);}
 const inverseAccessor=pack(new Float32Array(inverse),5126,"MAT4");
 function quat(axis,deg){let angle=deg*Math.PI/360,s=Math.sin(angle),c=Math.cos(angle);return axis==="x"?[s,0,0,c]:axis==="y"?[0,s,0,c]:[0,0,s,c];}
 const clips=[];
 function clip(name,duration,tracks){
  const samples=[],channels=[];
  const input=pack(new Float32Array([0,.25,.5,.75,1].map(t=>t*duration)),5126,"SCALAR");
  for(let [node,axis,degrees] of tracks){
   let arr=[];for(let deg of degrees)arr.push(...quat(axis,deg));
   const output=pack(new Float32Array(arr),5126,"VEC4");
   let si=samples.push({input,output,interpolation:"LINEAR"})-1;
   channels.push({sampler:si,target:{node,path:"rotation"}});
  }
  clips.push({name,samplers:samples,channels});
 }
 clip("idle",3.6,[[2,"z",[-1,1,-1,1,-1]],[3,"y",[-8,-2,7,2,-8]],[4,"x",[4,1,4,1,4]],[6,"x",[-4,-1,-4,-1,-4]],[1,"y",[0,1,0,-1,0]]]);
 clip("walk",1.05,[[8,"x",[27,0,-27,0,27]],[10,"x",[-27,0,27,0,-27]],[4,"x",[-19,0,19,0,-19]],[6,"x",[19,0,-19,0,19]],[13,"x",[-8,12,8,12,-8]],[14,"x",[8,12,-8,12,8]],[2,"z",[-2,0,2,0,-2]],[3,"x",[-3,-1,-3,-1,-3]]]);
 clip("attack",1,[[2,"y",[0,-18,-25,8,0]],[6,"x",[0,-90,-130,-45,0]],[9,"x",[0,28,55,14,0]],[4,"x",[0,25,-5,0,0]],[3,"x",[0,-12,0,8,0]]]);
 clip("stagger",.8,[[2,"x",[0,16,20,-7,0]],[3,"x",[0,18,-7,5,0]],[4,"z",[0,24,12,-4,0]],[6,"z",[0,-28,-15,0,0]],[5,"y",[0,-12,12,0,0]]]);
 const mats=[
  {name:"Worn Charcoal Jacket",pbrMetallicRoughness:{baseColorFactor:[.115,.132,.15,1],metallicFactor:0,roughnessFactor:.94},doubleSided:true},
  {name:"Deep Black Hood",pbrMetallicRoughness:{baseColorFactor:[.048,.057,.074,1],metallicFactor:0,roughnessFactor:.99},doubleSided:true},
  {name:"Weathered Face",pbrMetallicRoughness:{baseColorFactor:[.32,.265,.25,1],metallicFactor:0,roughnessFactor:.93},doubleSided:true},
  {name:"Leather Gloves Mask and Boots",pbrMetallicRoughness:{baseColorFactor:[.065,.069,.077,1],metallicFactor:.1,roughnessFactor:.81},doubleSided:true},
  {name:"Reflective Eyes",pbrMetallicRoughness:{baseColorFactor:[.69,.84,.93,1],metallicFactor:0,roughnessFactor:.3},emissiveFactor:[.11,.18,.24],doubleSided:true},
  {name:"Metal Details",pbrMetallicRoughness:{baseColorFactor:[.28,.32,.33,1],metallicFactor:.63,roughnessFactor:.47},doubleSided:true}
 ];
 length=Math.ceil(length/4)*4;
 const gltf={asset:{version:"2.0",generator:"317am-rig-prototype"},scenes:[{nodes:[0]}],scene:0,nodes,
  skins:[{name:"IntruderSkeleton",joints,skeleton:1,inverseBindMatrices:inverseAccessor}],
  meshes:[{name:"RiggedIntruder",primitives}],materials:mats,animations:clips,
  buffers:[{byteLength:length}],bufferViews:views,accessors};
 const json=JSON.stringify(gltf),jsonLength=Math.ceil(json.length/4)*4,bytes=new Uint8Array(12+8+jsonLength+8+length),dv=new DataView(bytes.buffer);
 dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,bytes.length,true);dv.setUint32(12,jsonLength,true);dv.setUint32(16,0x4e4f534a,true);
 bytes.fill(32,20,20+jsonLength);
 for(let i=0;i<json.length;i++)bytes[20+i]=json.charCodeAt(i);
 const start=20+jsonLength;dv.setUint32(start,length,true);dv.setUint32(start+4,0x004e4942,true);
 for(let chunk of chunks)bytes.set(chunk.data,start+8+chunk.start);
 return bytes;
}
const file=resolve(dirname(fileURLToPath(import.meta.url)),'../assets/models/intruder_rig.glb');
mkdirSync(dirname(file),{recursive:true});
const bytes=buildRigGLB();writeFileSync(file,bytes);
console.log('Wrote',file,bytes.length,'bytes');
