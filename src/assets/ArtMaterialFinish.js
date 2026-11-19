import * as THREE from 'three';

// Deterministic lightweight PBR surface microdetail for imported furniture.
// Replaced by true scanned/material-authored maps once professional assets arrive.
const SIZE=128;
const cache=new Map();
const sat=(x,min=0,max=255)=>Math.max(min,Math.min(max,x));
function createMaps(kind){
  const normal=new Uint8Array(SIZE*SIZE*4),rough=new Uint8Array(SIZE*SIZE*4);
  const height=new Float32Array(SIZE*SIZE);
  const seed=kind==='wood'?139:kind==='fabric'?47:73;
  let state=seed;
  const rng=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return (state>>>0)/4294967296;};
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    let h;
    if(kind==='wood'){
      const row=y/SIZE;
      const wav=Math.sin(row*145+Math.sin(x*.07)*2.5);
      const longGrain=Math.sin(y*.53+x*.023)*.25;
      h=.5+.19*wav+.08*longGrain+.035*(rng()-.5);
    }else if(kind==='fabric'){
      const weave=Math.sin(x*Math.PI*.44)*Math.sin(y*Math.PI*.44);
      const warp=Math.cos(x*Math.PI*.46)+Math.sin(y*Math.PI*.46);
      h=.5+.22*weave+.065*warp+.02*(rng()-.5);
    }else{
      h=.5+.065*(rng()-.5);
    }
    height[y*SIZE+x]=h;
    const i=(y*SIZE+x)*4;
    const r=sat(Math.round(229+15*(h-.5)));
    rough[i]=r;rough[i+1]=r;rough[i+2]=r;rough[i+3]=255;
  }
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const idx=y*SIZE+x;
    const center=height[idx];
    const right=height[y*SIZE+(x+1)%SIZE];
    const down=height[((y+1)%SIZE)*SIZE+x];
    const strength=kind==='wood'?.54:kind==='fabric'?.50:.17;
    const dx=(center-right)*strength,dy=(center-down)*strength;
    const norm=Math.hypot(dx,dy,1);
    const i=idx*4;
    normal[i]=sat(Math.round((dx/norm*.5+.5)*255));
    normal[i+1]=sat(Math.round((dy/norm*.5+.5)*255));
    normal[i+2]=sat(Math.round((1/norm*.5+.5)*255));
    normal[i+3]=255;
  }
  const make=arr=>{
    const tex=new THREE.DataTexture(arr,SIZE,SIZE,THREE.RGBAFormat);
    tex.needsUpdate=true;
    tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
    tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps=true;
    tex.colorSpace=THREE.NoColorSpace;
    return tex;
  };
  return {normal:make(normal),roughness:make(rough)};
}
export function surfaceMaps(type){
  if(!cache.has(type))cache.set(type,createMaps(type));
  return cache.get(type);
}
export function finishFurnitureMaterials(scene){
  let edited=0;
  scene.traverse(node=>{
    if(!node.isMesh||!node.material)return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    const updated=materials.map(material=>{
      if(!material?.isMeshStandardMaterial)return material;
      const name=(material.name||'').toLowerCase();
      const type=/fabric|cushion|woven|piping|stitched/.test(name)?'fabric':
        /wood|walnut|endgrain|hardwood/.test(name)?'wood':null;
      if(!type)return material;
      const maps=surfaceMaps(type),copy=material.clone();
      copy.normalMap=maps.normal;
      copy.normalScale.set(type==='fabric'?.29:.20,type==='fabric'?.29:.20);
      copy.roughnessMap=maps.roughness;
      copy.needsUpdate=true;
      edited++;
      return copy;
    });
    node.material=Array.isArray(node.material)?updated:updated[0];
  });
  return edited;
}
