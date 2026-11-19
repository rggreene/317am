import * as THREE from 'three';

// Deterministic tiny tile textures. Browser-made, no downloads or third-party
// asset licences; replace maps with authored PBR textures later.
function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function texture(kind,seed=17){
  const size=256,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d'),rng=random(seed);
  const isWood=kind==='wood',isFabric=kind==='fabric';
  const base=isWood?'#9d795b':isFabric?'#66788b':'#acb4b8';
  ctx.fillStyle=base;ctx.fillRect(0,0,size,size);
  if(isWood){
    // Narrow, irregular linear grain catches warm specular highlights.
    for(let i=0;i<420;i++){
      const y=rng()*size,h=.3+rng()*2;
      ctx.globalAlpha=.025+rng()*.12;
      ctx.fillStyle=rng()>.44?'#37251b':'#ebcaa2';
      ctx.fillRect(0,y,size,h);
    }
    for(let i=0;i<15;i++){
      const y=rng()*size;ctx.globalAlpha=.11;
      ctx.strokeStyle='#513626';ctx.beginPath();
      ctx.moveTo(-10,y);
      ctx.bezierCurveTo(70,y-2+rng()*3,160,y+2-rng()*4,270,y+rng()*3);
      ctx.stroke();
    }
  }else if(isFabric){
    for(let i=0;i<size;i+=3){
      ctx.globalAlpha=.08;
      ctx.fillStyle='#dce3ea';ctx.fillRect(0,i,size,1);
      ctx.fillStyle='#101e32';ctx.fillRect(i,0,1,size);
    }
    for(let i=0;i<1900;i++){
      ctx.globalAlpha=.025+rng()*.11;
      ctx.fillStyle=rng()>.5?'#ecf3f6':'#111c27';
      ctx.fillRect(rng()*size,rng()*size,1+rng()*2,1+rng()*2);
    }
  }else{
    for(let i=0;i<4200;i++){
      ctx.globalAlpha=.015+rng()*.09;
      ctx.fillStyle=rng()>.52?'#ffffff':'#34414c';
      ctx.fillRect(rng()*size,rng()*size,1+rng()*2,1+rng()*2);
    }
  }
  ctx.globalAlpha=1;
  const map=new THREE.CanvasTexture(canvas);
  map.wrapS=THREE.RepeatWrapping;map.wrapT=THREE.RepeatWrapping;
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=4;
  return map;
}

export function makeMaterials(){
  const standard=(color,roughness=.85,metalness=0,options={})=>
    new THREE.MeshStandardMaterial({color,roughness,metalness,...options});
  // Use shared textures/materials instead of creating one material per board.
  const woodMap=texture('wood',39),fabricMap=texture('fabric',103),
        plasterMap=texture('plaster',271);
  const floorMap=woodMap.clone();floorMap.needsUpdate=true;floorMap.repeat.set(1.5,1);
  const wallMap=plasterMap.clone();wallMap.needsUpdate=true;wallMap.repeat.set(4,2);
  return {
    wall:standard('#e1e3df',.94,0,{map:wallMap}),
    wallDark:standard('#777f87',.97,0,{map:plasterMap}),
    trim:standard('#d2d2cb',.66),
    edge:standard('#aab0ae',.82),
    floor:standard('#ffffff',.73,0,{map:floorMap}),
    floorSeam:standard('#342a25',.9),
    wood:standard('#e3c6aa',.67,0,{map:woodMap}),
    darkWood:standard('#3f3028',.7),
    upholstery:standard('#d6dfe6',.95,0,{map:fabricMap}),
    upholsteryShade:standard('#8f9eac',.95,0,{map:fabricMap}),
    paleLinen:standard('#c7c8bb',.96),
    throw:standard('#8e7966',.98),
    rug:standard('#647179',1,0,{map:fabricMap}),
    black:standard('#121923',.6),
    screen:standard('#192b37',.25,0,{emissive:'#284e68',emissiveIntensity:.65}),
    chrome:standard('#abb4b8',.24,.77),
    lampShade:standard('#efd9aa',.81,0,{emissive:'#c28b4c',emissiveIntensity:.23,side:THREE.DoubleSide}),
    warmGlass:standard('#c7ab8e',.25,.05,{transparent:true,opacity:.69}),
    window:standard('#6c91b7',.18,.1,{transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}),
    leaf:standard('#415b43',.87),
    clay:standard('#a87f66',.94),
    paper:standard('#d5cbb6',.92),
    ink:standard('#44535e',.83),
    brass:standard('#b3975e',.35,.67),
    night:standard('#101923',.97)
  };
}
