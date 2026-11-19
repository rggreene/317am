import * as THREE from 'three';

// Cheap, deterministic soft contact shadows. No screen-space postprocessing,
// no per-frame CPU work, and a single reusable 64px alpha map.
const SHADOW_RADIUS=64;
function shadowTexture(){
  const pixels=new Uint8Array(SHADOW_RADIUS*SHADOW_RADIUS*4);
  for(let y=0;y<SHADOW_RADIUS;y++)for(let x=0;x<SHADOW_RADIUS;x++){
    const dx=(x+.5)/SHADOW_RADIUS*2-1;
    const dy=(y+.5)/SHADOW_RADIUS*2-1;
    const r=Math.sqrt(dx*dx+dy*dy);
    const t=Math.max(0,1-r);
    const alpha=Math.pow(t,2.1);
    const i=(y*SHADOW_RADIUS+x)*4;
    pixels[i]=18;pixels[i+1]=19;pixels[i+2]=23;
    pixels[i+3]=Math.round(alpha*230);
  }
  const tex=new THREE.DataTexture(pixels,SHADOW_RADIUS,SHADOW_RADIUS,THREE.RGBAFormat);
  tex.needsUpdate=true;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=false;
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}
export function createContactShadows(){
  const root=new THREE.Group();
  root.name='Subtle furniture floor contact';
  const texture=shadowTexture();
  const materials=new Map();
  function add(name,x,z,width,depth,y=.020,opacity=.55){
    const strength=Math.round(opacity*100);
    let material=materials.get(strength);
    if(!material){
      material=new THREE.MeshBasicMaterial({
        map:texture,transparent:true,opacity,
        depthWrite:false,depthTest:true,toneMapped:false,
        side:THREE.DoubleSide
      });
      materials.set(strength,material);
    }
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),material);
    mesh.name='Contact shadow: '+name;
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set(x,y,z);
    mesh.renderOrder=1;
    root.add(mesh);
    return mesh;
  }
  add('sofa',1.50,1.26,2.58,1.45,.022,.56);
  add('bed',-1.91,-1.36,2.30,2.48,.022,.51);
  add('dresser',-2.78,1.46,.88,.59,.021,.52);
  add('coffee table',1.49,.17,1.48,.97,.060,.48);
  add('media console',1.60,-2.17,1.92,.71,.022,.52);
  add('refrigerator',2.79,-1.67,1.07,.94,.022,.49);
  root.userData.shadowCount=root.children.length;
  return root;
}
