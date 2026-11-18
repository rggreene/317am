import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createRenderer(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#070b11');
  scene.fog=new THREE.FogExp2('#0b131e',0.024);
  const camera=new THREE.PerspectiveCamera(56,1,0.1,70);
  camera.position.set(4.9,3.6,6.8);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,1.0,0);
  controls.enableDamping=true;
  controls.enablePan=false;
  controls.minDistance=3;
  controls.maxDistance=12;
  controls.maxPolarAngle=Math.PI*0.49;
  const resize=()=>{
    const width=canvas.clientWidth||window.innerWidth;
    const height=canvas.clientHeight||window.innerHeight;
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
  };
  window.addEventListener('resize',resize);
  resize();
  return {renderer,scene,camera,controls,resize};
}
