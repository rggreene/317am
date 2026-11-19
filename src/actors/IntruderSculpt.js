import * as THREE from 'three';

// Sculpted procedural replacement geometry parented to the existing named bones.
// This is an interim 3D art pass, NOT an authored/weighted Blender character.
// Bone transforms keep the established idle/walk/attack/stagger clips working.
const MAT={
  jacket:new THREE.MeshStandardMaterial({color:'#333c41',roughness:.96}),
  hood:new THREE.MeshStandardMaterial({color:'#222a30',roughness:.99,side:THREE.DoubleSide}),
  seam:new THREE.MeshStandardMaterial({color:'#42494c',roughness:.98}),
  trousers:new THREE.MeshStandardMaterial({color:'#272e31',roughness:.98}),
  gloves:new THREE.MeshStandardMaterial({color:'#1e2325',roughness:.89}),
  boots:new THREE.MeshStandardMaterial({color:'#222222',roughness:.83}),
  skin:new THREE.MeshStandardMaterial({color:'#55423d',roughness:.97}),
  shade:new THREE.MeshStandardMaterial({color:'#101215',roughness:1}),
  worn:new THREE.MeshStandardMaterial({color:'#4a4b48',roughness:.98})
};
function mesh(parent,geometry,mat,name,p=[0,0,0]){
  const obj=new THREE.Mesh(geometry,mat);
  obj.position.set(...p);
  obj.name=name;
  obj.castShadow=true;obj.receiveShadow=true;
  parent.add(obj);return obj;
}
// Each 6-value row is [centerX, Y, centerZ, radiusX, radiusZ, wrinkleAmount].
// Loft has smooth normals, ellipsoidal sections, soft asymmetric folds and caps.
export function loft(parent,profiles,material,name,segments=18){
  const vertices=[],uv=[],idx=[];
  const rings=profiles.length;
  for(let j=0;j<rings;j++){
    const [cx,y,cz,rx,rz,wave=0]=profiles[j];
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2;
      const fold=1+wave*(.5*Math.sin(a*5+y*13)+.25*Math.sin(a*8-y*17));
      const x=cx+rx*Math.cos(a)*fold;
      const z=cz+rz*Math.sin(a)*fold;
      vertices.push(x,y,z);
      uv.push(i/segments,j/(rings-1));
    }
  }
  for(let j=0;j<rings-1;j++)for(let i=0;i<segments;i++){
    const a=j*segments+i,b=j*segments+(i+1)%segments,
      c=(j+1)*segments+i,d=(j+1)*segments+(i+1)%segments;
    idx.push(a,c,b,b,c,d);
  }
  // Cap top/bottom with small center discs to hide seams under overlap.
  for(const j of [0,rings-1]){
    const p=profiles[j],center=vertices.length/3;
    vertices.push(p[0],p[1],p[2]);uv.push(.5,.5);
    for(let i=0;i<segments;i++){
      const a=j*segments+i,b=j*segments+(i+1)%segments;
      if(j===0)idx.push(center,a,b);
      else idx.push(center,b,a);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  return mesh(parent,g,material,name);
}
function ellipse(parent,radius,material,name,position,scale=[1,1,1],segments=18){
  const obj=mesh(parent,new THREE.SphereGeometry(radius,segments,14),material,name,position);
  obj.scale.set(...scale);return obj;
}
function seam(parent,points,material,name,radius=.004){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(parent,new THREE.TubeGeometry(curve,points.length*7,radius,5,false),
    material,name);
}
function addCoat(bones){
  const spine=bones.get('Spine');
  loft(spine,[
    [0,-.365,0,.277,.19,.06],
    [0,-.255,.006,.28,.19,.05],
    [0,-.10,.000,.296,.210,.05],
    [0,.095,0,.329,.216,.025],
    [0,.245,.002,.338,.202,.023],
    [0,.365,-.015,.242,.144,.015]
  ],MAT.jacket,'Tailored asymmetric charcoal jacket');
  // Longer jacket skirt with diagonal asymmetric split.
  const pelvis=bones.get('Pelvis');
  loft(pelvis,[
    [0,-.300,.008,.247,.17,.03],
    [0,-.255,.018,.271,.173,.055],
    [0,-.13,.004,.283,.180,.06],
    [0,-.02,0,.275,.177,.04],
    [0,.13,0,.265,.16,.015]
  ],MAT.jacket,'Split weathered jacket hem');
  // Broad collar masks the visible gap between rotating neck/torso.
  loft(bones.get('Neck'),[
    [0,-.12,-.01,.215,.155,.015],
    [0,-.02,0,.222,.177,.019],
    [0,.07,-.024,.170,.135,.013]
  ],MAT.hood,'Raised cloth collar',20);
  seam(spine,[[.017,-.31,.19],[.012,-.10,.222],[.008,.16,.225],[.011,.28,.168]],
    MAT.worn,'Long uneven zipper stitching');
  seam(spine,[[-.255,-.18,.085],[-.255,.01,.095],[-.235,.24,.08]],
    MAT.seam,'Worn left coat side seam');
}
function addHead(bones){
  const head=bones.get('Head');
  // Narrow human head with a partially visible face. The hood is a short
  // fabric layer *behind* the skull, not a hard spherical helmet.
  ellipse(head,.176,MAT.skin,'Human shadowed face',[0,.025,.045],[.89,1.24,.83],24);
  ellipse(head,.179,MAT.hood,'Soft hair and hood cap',[0,.150,-.060],[1.13,.77,.85],24);
  // Tapered side panels rest against the temples; face remains visible.
  for(const side of [-1,1]){
    loft(head,[
      [side*.128,-.13,-.013,.055,.077,.016],
      [side*.135,-.04,-.020,.071,.098,.014],
      [side*.129,.09,-.030,.063,.096,.01],
      [side*.119,.22,-.064,.055,.062,0]
    ],MAT.hood,'Soft hood side panel',12);
    ellipse(head,.043,MAT.skin,'Visible ear',[side*.170,.025,.045],[.57,.92,.41],12);
    ellipse(head,.029,MAT.shade,'Subtle eye socket',
      [side*.070,.078,.190],[1.17,.49,.29],12);
    seam(head,[[side*.132,.15,-.01],[side*.146,.04,.024],[side*.14,-.095,.018]],
      MAT.seam,'Hood face border seam',.003);
  }
  ellipse(head,.040,MAT.skin,'Natural nose bridge',[0,.014,.197],[.60,1.65,.60],12);
  ellipse(head,.043,MAT.skin,'Small nose tip',[0,-.027,.219],[1,.44,.58],12);
  // A very dark mouth line reads only when the player gets close.
  seam(head,[[-.050,-.116,.195],[0,-.123,.207],[.043,-.116,.193]],
    MAT.shade,'Closed neutral mouth',.002);
  // Fringe under the hood is irregular and avoids a smooth plastic visor.
  for(const [x,y,z,s] of [[-.103,.188,.072,.83],[-.037,.216,.113,.70],[.047,.211,.110,.80],[.114,.189,.054,.62]]){
    const strand=ellipse(head,.061,MAT.hood,'Untidy dark hair lock',
      [x,y,z],[.45,s,.52],10);
    strand.rotation.z=x*.8;
  }
}
function addArms(bones){
  for(const side of [-1,1]){
    const shoulder=bones.get(side<0?'Shoulder_L':'Shoulder_R');
    const elbow=bones.get(side<0?'Elbow_L':'Elbow_R');
    loft(shoulder,[
      [0,.095,0,.148,.132,.015],
      [0,.012,0,.165,.15,.025],
      [side*.015,-.18,.008,.142,.135,.046],
      [side*.027,-.35,.018,.111,.108,.04],
      [side*.032,-.435,.017,.106,.105,.02]
    ],MAT.jacket,'Worn coat upper sleeve');
    loft(elbow,[
      [0,.07,0,.113,.109,.02],
      [side*.011,-.11,.02,.111,.108,.035],
      [side*.022,-.255,.029,.093,.093,.025],
      [side*.028,-.343,.033,.091,.085,.01]
    ],MAT.hood,'Lower jacket sleeve');
    loft(elbow,[
      [side*.027,-.327,.035,.094,.086,.01],
      [side*.032,-.398,.040,.098,.086,.014],
      [side*.035,-.447,.040,.084,.079,.01]
    ],MAT.gloves,'Gloved human hand');
    seam(shoulder,[[side*.013,-.07,.135],[side*.025,-.20,.126],[side*.026,-.33,.11]],
      MAT.seam,'Sleeve creasing stitched line');
    // Slight padding on one shoulder creates distinctive silhouette.
    if(side<0){
      ellipse(shoulder,.10,MAT.worn,'One patched shoulder',
        [-.062,-.15,.076],[1.18,.88,.24]);
    }
  }
}
function addLegs(bones){
  for(const side of [-1,1]){
    const thigh=bones.get(side<0?'Thigh_L':'Thigh_R'),
      knee=bones.get(side<0?'Knee_L':'Knee_R');
    loft(thigh,[
      [0,.080,0,.145,.140,.04],
      [0,-.13,0,.147,.130,.03],
      [side*.012,-.32,.016,.129,.119,.025],
      [side*.008,-.475,.015,.117,.109,.02]
    ],MAT.trousers,'Narrow worn trouser thigh');
    loft(knee,[
      [0,.082,0,.116,.106,.03],
      [0,-.12,.015,.113,.102,.02],
      [0,-.31,.018,.105,.097,.03],
      [0,-.40,.025,.105,.102,.02]
    ],MAT.trousers,'Tapered trouser shin');
    loft(knee,[
      [0,-.270,.015,.120,.115,.013],
      [0,-.338,.030,.123,.117,.013],
      [0,-.413,.058,.125,.139,.015],
      [0,-.461,.073,.130,.160,.005]
    ],MAT.boots,'Worn work boot ankle');
    const toe=ellipse(knee,.15,MAT.boots,'Rounded work boot toe',
      [0,-.433,.142],[.94,.36,1.20]);
    toe.castShadow=true;
    seam(knee,[[-.093,-.40,.182],[-.04,-.414,.222],[.045,-.41,.223],[.095,-.392,.188]],
      MAT.worn,'Scuffed boot toe seam');
  }
}
export function sculptIntruderSilhouette(scene){
  const bones=new Map();
  scene.traverse(node=>{if(node.isBone)bones.set(node.name,node);});
  const required=['Spine','Pelvis','Neck','Head','Shoulder_L','Shoulder_R',
    'Elbow_L','Elbow_R','Thigh_L','Thigh_R','Knee_L','Knee_R'];
  for(const n of required){if(!bones.has(n))throw Error('Sculpt rig missing bone '+n);}
  const old=[];
  scene.traverse(node=>{if(node.isSkinnedMesh)old.push(node);});
  if(!old.length)throw Error('Original skinned rig missing; cannot safely replace silhouette');
  // Sculpted meshes are attached before the prototype skinned shell is hidden;
  // core GLB tracks and animation mixer still drive all named bones.
  addCoat(bones);addHead(bones);addArms(bones);addLegs(bones);
  const created=[];
  for(const bone of bones.values()){
    for(const child of bone.children){
      if(child.isMesh&&/Human|jacket|coat|hood|trouser|sleeve|boot|Gloved|stitched/i.test(child.name)){
        created.push(child);
      }
    }
  }
  for(const mesh of old)mesh.visible=false;
  return {newMeshes:created.length,hiddenPrototypeSkins:old.length,
    materials:Object.values(MAT).length};
}
