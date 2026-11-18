// Procedural 3D source for the first 3:17 AM model; replaceable by an authored Blender GLB.
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
function buildPan(){
 const parts=[];
 function meshLathe(profile,segments=32,axis="y"){
   const verts=[],faces=[];
   for(let i=0;i<profile.length;i++)for(let j=0;j<segments;j++){
     let t=j*2*Math.PI/segments,[a,b,c,d]=profile[i];
     if(axis==="y")verts.push(a*Math.cos(t),b,a*Math.sin(t));
     else verts.push(a,b+c*Math.cos(t),d*Math.sin(t));
   }
   for(let i=0;i<profile.length-1;i++)for(let j=0;j<segments;j++){
     let a=i*segments+j,b=(i+1)*segments+j,c=i*segments+(j+1)%segments,d=(i+1)*segments+(j+1)%segments;
     if(axis==="y")faces.push(a,b,c,c,b,d);else faces.push(a,c,b,c,d,b);
   }
   return {verts,faces};
 }
 function sphere(x,y,z,r){
   const v=[],f=[],n=12,k=16;
   for(let i=0;i<=n;i++){let p=i*Math.PI/n;for(let j=0;j<k;j++){let t=j*2*Math.PI/k;v.push(x+r*Math.sin(p)*Math.cos(t),y+r*Math.cos(p),z+r*Math.sin(p)*Math.sin(t));}}
   for(let i=0;i<n;i++)for(let j=0;j<k;j++){let a=i*k+j,b=a+k,c=i*k+(j+1)%k,d=c+k;f.push(a,c,b,c,d,b);}
   return {verts:v,faces:f};
 }
 function torus(rad,tube,y){
   let profile=[];for(let i=0;i<=12;i++){let t=i*2*Math.PI/12;profile.push([rad+tube*Math.cos(t),y+tube*Math.sin(t)]);}
   return meshLathe(profile,32);
 }
 parts.push([meshLathe([[0,0.004],[.095,.004],[.118,.012],[.137,.041],[.145,.071],[.14,.076],[.133,.057],[.117,.036],[.09,.028],[0,.028]]),0]);
 parts.push([torus(.142,.005,.073),1]);
 parts.push([meshLathe([[.13,.070,.006,.012],[.16,.076,.014,.024],[.21,.083,.012,.019],[.247,.085,.01,.016]],16,"x"),1]);
 parts.push([meshLathe([[.208,.084,.003,.005],[.225,.084,.018,.027],[.285,.088,.024,.035],[.376,.09,.024,.034],[.42,.09,.013,.02],[.438,.09,.002,.004]],20,"x"),2]);
 parts.push([meshLathe([[.212,.084,.020,.03],[.226,.084,.021,.031]],20,"x"),1]);
 parts.push([sphere(.168,.089,-.018,.007),1]);
 parts.push([sphere(.168,.089,.018,.007),1]);
 const blobs=[],views=[],accessors=[],primitives=[];
 let totalBin=0;
 function add(data,comp,type,target,min,max){
   const bytes=new Uint8Array(data.buffer);
   const offset=totalBin;blobs.push({offset,bytes});totalBin+=bytes.length;
   while(totalBin%4)totalBin++;
   const view=views.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target})-1;
   const a={bufferView:view,componentType:comp,count:data.length/(type==="VEC3"?3:1),type};
   if(min)a.min=min;if(max)a.max=max;
   return accessors.push(a)-1;
 }
 for(let [geom,mat] of parts){
   const p=new Float32Array(geom.verts),n=new Float32Array(p.length),ind=new Uint16Array(geom.faces);
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let k=0;k<p.length;k+=3)for(let t=0;t<3;t++){min[t]=Math.min(min[t],p[k+t]);max[t]=Math.max(max[t],p[k+t]);}
   for(let k=0;k<ind.length;k+=3){
     let a=ind[k]*3,b=ind[k+1]*3,c=ind[k+2]*3;
     let ab=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],ac=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];
     let normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
     for(let q of [a,b,c])for(let t=0;t<3;t++)n[q+t]+=normal[t];
   }
   for(let k=0;k<n.length;k+=3){let len=Math.hypot(n[k],n[k+1],n[k+2])||1;for(let t=0;t<3;t++)n[k+t]/=len;}
   primitives.push({attributes:{POSITION:add(p,5126,"VEC3",34962,min,max),NORMAL:add(n,5126,"VEC3",34962)},indices:add(ind,5123,"SCALAR",34963,[0],[p.length/3-1]),material:mat});
 }
 const gltf={asset:{version:"2.0",generator:"317am workshop"},scenes:[{nodes:[0]}],scene:0,
  nodes:[{name:"FryingPan",mesh:0}],meshes:[{name:"Frying Pan",primitives}],
  materials:[
   {name:"Blackened steel",pbrMetallicRoughness:{baseColorFactor:[.10,.115,.12,1],metallicFactor:.84,roughnessFactor:.47},doubleSided:true},
   {name:"Bright alloy",pbrMetallicRoughness:{baseColorFactor:[.55,.57,.59,1],metallicFactor:.88,roughnessFactor:.32},doubleSided:true},
   {name:"Dark grip",pbrMetallicRoughness:{baseColorFactor:[.065,.059,.055,1],metallicFactor:.05,roughnessFactor:.72},doubleSided:true}
  ],buffers:[{byteLength:totalBin}],bufferViews:views,accessors};
 const json=JSON.stringify(gltf);
 const jlen=Math.ceil(json.length/4)*4,all=new Uint8Array(12+8+jlen+8+totalBin),v=new DataView(all.buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,all.length,true);
 v.setUint32(12,jlen,true);v.setUint32(16,0x4e4f534a,true);
 all.fill(32,20,20+jlen);
 for(let i=0;i<json.length;i++)all[20+i]=json.charCodeAt(i); // JSON deliberately ASCII-only
 let binstart=20+jlen;v.setUint32(binstart,totalBin,true);v.setUint32(binstart+4,0x004e4942,true);
 for(let b of blobs)all.set(b.bytes,binstart+8+b.offset);
 return all;
}
const path=resolve(dirname(fileURLToPath(import.meta.url)),'../assets/models/frying_pan.glb');
mkdirSync(dirname(path),{recursive:true});
const bytes=buildPan();writeFileSync(path,bytes);
console.log('Generated',path,bytes.length,'bytes');
