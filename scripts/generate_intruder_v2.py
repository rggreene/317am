#!/usr/bin/env python3
"""Reproducible original character model for 3:17 AM: The Uninvited v2.

Self-contained GLB with authored procedural geometry, textured PBR materials,
37 named skin joints, up to four weights per vertex, and 12 named actions.
This produces a real animated glTF asset. It is NOT a Blender sculpt nor a .blend.
Only numpy and Pillow are needed to rebuild (also standard Python modules).

Run from repository root: python3 scripts/generate_intruder_v2.py
"""
from __future__ import annotations
import json, math, struct, io, os
from collections import defaultdict
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'assets/models/characters/char_intruder_v02.glb'
SEED=31702
rng=np.random.default_rng(SEED)
W=32
GEOMETRY=[]
MAT_NAMES=['M_JacketCloth','M_FaceSkin','M_GlovesBoots','M_MinorTrim']
MAT_JACKET=0;MAT_SKIN=1;MAT_LEATHER=2;MAT_TRIM=3

# World-space rest positions (meters, +Y up, looking toward +Z).
J=[
('Root',None,(0,0,0)),
('Pelvis','Root',(0,1.00,0)),
('Spine_Lower','Pelvis',(0,1.12,-.012)),
('Spine','Spine_Lower',(0,1.29,-.013)),
('Spine_Upper','Spine',(0,1.48,-.020)),
('Neck','Spine_Upper',(0,1.575,-.018)),
('Head','Neck',(0,1.731,.002)),
('Clavicle_L','Spine_Upper',(-.165,1.51,0)),
('Shoulder_L','Clavicle_L',(-.301,1.464,.008)),
('Elbow_L','Shoulder_L',(-.371,1.105,.023)),
('Wrist_L','Elbow_L',(-.345,.844,.056)),
('Hand_L','Wrist_L',(-.345,.765,.065)),
('Thumb_01_L','Hand_L',(-.308,.743,.104)),
('Thumb_02_L','Thumb_01_L',(-.292,.696,.134)),
('Index_01_L','Hand_L',(-.374,.695,.113)),
('Index_02_L','Index_01_L',(-.377,.651,.119)),
('FingerCurl_L','Hand_L',(-.369,.678,.071)),
('Clavicle_R','Spine_Upper',(.165,1.51,0)),
('Shoulder_R','Clavicle_R',(.301,1.464,.008)),
('Elbow_R','Shoulder_R',(.371,1.105,.023)),
('Wrist_R','Elbow_R',(.345,.844,.056)),
('Hand_R','Wrist_R',(.345,.765,.065)),
('Thumb_01_R','Hand_R',(.308,.743,.104)),
('Thumb_02_R','Thumb_01_R',(.292,.696,.134)),
('Index_01_R','Hand_R',(.374,.695,.113)),
('Index_02_R','Index_01_R',(.377,.651,.119)),
('FingerCurl_R','Hand_R',(.369,.678,.071)),
('Thigh_L','Pelvis',(-.156,.955,0)),
('Knee_L','Thigh_L',(-.171,.527,.039)),
('Ankle_L','Knee_L',(-.174,.137,.025)),
('Foot_L','Ankle_L',(-.174,.092,.098)),
('Toe_L','Foot_L',(-.174,.071,.201)),
('Thigh_R','Pelvis',(.156,.955,0)),
('Knee_R','Thigh_R',(.171,.527,.039)),
('Ankle_R','Knee_R',(.174,.137,.025)),
('Foot_R','Ankle_R',(.174,.092,.098)),
('Toe_R','Foot_R',(.174,.071,.201)),
]
assert len(J)==37
J_IDX={name:i for i,(name,_,_) in enumerate(J)}
J_POS={name:np.array(pos,dtype=np.float64) for name,_,pos in J}

# A mesh primitive stores positions + UVs + vertex colors + weights/joints.
# Each subpart is assigned weights by anatomy; deform joints are not independent
# disconnected bones, and the mix across elbows/knees is continuous.
class MeshPart:
    def __init__(self,name,mat,bone_hint='Spine',tint=(1,1,1)):
        self.name=name;self.mat=mat;self.bone_hint=bone_hint;self.tint=tint
        self.p=[];self.uv=[];self.cols=[];self.tris=[];self.norm=None
        self.joints=[];self.weights=[]
    def append(self,p,uv,faces,tint=None):
        n=len(self.p)
        self.p.extend(p);self.uv.extend(uv)
        self.cols.extend([tuple(tint or self.tint)]*len(p))
        self.tris.extend([(a+n,b+n,c+n) for a,b,c in faces])
    def skin(self):
        for x,y,z in self.p:
            joints,weights=weight_for((x,y,z),self.bone_hint)
            self.joints.append(joints);self.weights.append(weights)
    def compute_normals(self):
        p=np.asarray(self.p,dtype=np.float64)
        idx=np.asarray(self.tris,dtype=np.int32)
        n=np.zeros_like(p)
        v1=p[idx[:,1]]-p[idx[:,0]]
        v2=p[idx[:,2]]-p[idx[:,0]]
        face=np.cross(v1,v2)
        np.add.at(n,idx[:,0],face);np.add.at(n,idx[:,1],face);np.add.at(n,idx[:,2],face)
        lengths=np.linalg.norm(n,axis=1)
        n/=np.maximum(lengths[:,None],1e-7)
        self.norm=n.astype(np.float32)

PARTS=[]
def part(name,mat=MAT_JACKET,hint='Spine',tint=(1,1,1)):
    m=MeshPart(name,mat,hint,tint);PARTS.append(m);return m

def smoothstep(x):
    t=max(0.,min(1.,x));return t*t*(3-2*t)

def segment_weights(v,chain):
    # Chain = ordered Y-axis segment bone names; blend between nearest joints.
    p=np.array(v,dtype=float)
    candidates=[]
    for name in chain:
        center=J_POS[name]
        d=np.linalg.norm(p-center)
        candidates.append((d,name))
    candidates.sort()
    ds=candidates[:2]
    if len(ds)==1:return {ds[0][1]:1.0}
    a,b=ds
    # inverse-distance smooth blend across joint boundary
    d1=max(.012,a[0]);d2=max(.012,b[0]);wa=(d2*d2)/(d1*d1+d2*d2)
    return {a[1]:wa,b[1]:1-wa}

def weight_for(v,hint):
    x,y,z=v
    side='L' if x<0 else 'R'
    if hint=='Head':w=segment_weights(v,['Head','Neck'])
    elif hint=='Neck':w=segment_weights(v,['Neck','Spine_Upper'])
    elif hint=='Pelvis':w=segment_weights(v,['Pelvis','Spine_Lower'])
    elif hint=='Torso':w=segment_weights(v,['Pelvis','Spine_Lower','Spine','Spine_Upper','Neck'])
    elif hint=='Arm':w=segment_weights(v,[f'Shoulder_{side}',f'Elbow_{side}',f'Wrist_{side}',f'Hand_{side}'])
    elif hint=='Hands':w=segment_weights(v,[f'Wrist_{side}',f'Hand_{side}',f'Index_01_{side}',f'FingerCurl_{side}'])
    elif hint=='Leg':w=segment_weights(v,[f'Thigh_{side}',f'Knee_{side}',f'Ankle_{side}'])
    elif hint=='Foot':w=segment_weights(v,[f'Ankle_{side}',f'Foot_{side}',f'Toe_{side}'])
    elif hint=='Spine_Upper':w=segment_weights(v,['Spine_Upper','Neck','Clavicle_'+side])
    else:w={hint:1.}
    sorted_weights=sorted(w.items(),key=lambda pair:-pair[1])[:4]
    total=sum(wt for _,wt in sorted_weights)
    inds=[J_IDX[name] for name,_ in sorted_weights]
    vals=[wt/total for _,wt in sorted_weights]
    return tuple((inds+[0]*4)[:4]),tuple((vals+[0]*4)[:4])

# Elliptical cross-section loft. Better than ellipsoid 'capsules' for garments,
# especially with seams, realistic layered open collar and nonuniform silhouette.
def loft(m,rows,sides=W,fold=.0,front_bulge=0.,rotation=0.,cap=True):
    """Each row: (cx,y,cz,rx,rz), with Y along character height."""
    p=[];uv=[];faces=[]
    for j,(cx,y,cz,rx,rz) in enumerate(rows):
        for k in range(sides+1):
            a=2*math.pi*k/sides+rotation
            longwave=fold*(.43*math.sin(5*a+16*y)+.24*math.sin(9*a-13*y)+.15*math.sin(13*a+25*y))
            rad=1+longwave
            xx=cx+rx*math.cos(a)*rad
            zz=cz+rz*math.sin(a)*rad+front_bulge*max(0,math.sin(a))**4
            p.append((xx,y,zz));uv.append((k/sides,j/max(1,len(rows)-1)))
            if j>0 and k>0:
                curr=j*(sides+1)+k;prev=(j-1)*(sides+1)+k
                a0=(j-1)*(sides+1)+k-1;a1=a0+1
                b0=j*(sides+1)+k-1;b1=b0+1
                faces.extend([(a0,b0,a1),(a1,b0,b1)])
    if cap:
        for boundary,up in [(0,False),(len(rows)-1,True)]:
            center=len(p);row=rows[boundary]
            p.append((row[0],row[1],row[2]));uv.append((.5,.5))
            for k in range(sides):
                a=boundary*(sides+1)+k;b=a+1
                faces.append((center,a,b) if up else (center,b,a))
    m.append(p,uv,faces)

def sphere(m,center,radii,sides=24,rings=16,noise=0,headdetail=False):
    p=[];uv=[];faces=[];cx,cy,cz=center;rx,ry,rz=radii
    for j in range(rings+1):
        theta=math.pi*j/rings
        for k in range(sides+1):
            phi=2*math.pi*k/sides
            x=cx+rx*math.sin(theta)*math.cos(phi)
            y=cy+ry*math.cos(theta)
            z=cz+rz*math.sin(theta)*math.sin(phi)
            if headdetail:
                # subtle facial anatomy on the +Z side, eyes under brow ridge,
                # nose plane and cheek mass, no skull-mask exaggeration.
                front=max(0.,math.sin(phi))
                eyey=(y-1.76)/.042
                nosey=(y-1.704)/.058
                xc=x/.082
                z+=(.017*math.exp(-nosey*nosey)*math.exp(-xc*xc)
                    +.007*math.exp(-(eyey-1.5)**2)*front
                    -.004*math.exp(-eyey*eyey)*math.exp(-((abs(x)-.06)/.03)**2)) * front
                z+=.007*math.exp(-((y-1.68)/.05)**2)*math.exp(-((abs(x)-.1)/.04)**2)*front
            if noise:
                rad=(.5*math.sin(phi*5+theta*7)+.33*math.sin(phi*11-theta*5))
                x+=noise*rad*math.sin(theta)*math.cos(phi)
                z+=noise*rad*math.sin(theta)*math.sin(phi)
            p.append((x,y,z));uv.append((k/sides,1-j/rings))
            if j>0 and k>0:
                a=(j-1)*(sides+1)+k-1;b=a+sides+1
                faces.extend([(a,b,a+1),(a+1,b,b+1)])
    m.append(p,uv,faces)

def cylinder(m,a,b,r1,r2=None,sides=12,cap=True):
    r2=r1 if r2 is None else r2
    a=np.array(a,dtype=float);b=np.array(b,dtype=float)
    up=b-a;up/=max(1e-8,np.linalg.norm(up))
    axis=np.array([1.,0,0]) if abs(np.dot(up,(1,0,0)))<.9 else np.array([0.,0.,1.])
    u=np.cross(up,axis);u/=max(1e-8,np.linalg.norm(u));v=np.cross(up,u)
    p=[];uv=[];f=[]
    for row,(c,r) in enumerate([(a,r1),(b,r2)]):
        for k in range(sides+1):
            th=2*math.pi*k/sides;point=c+r*(u*math.cos(th)+v*math.sin(th))
            p.append(tuple(point));uv.append((k/sides,row))
            if row and k:
                j=k-1;f.extend([(j,sides+1+j,j+1),(j+1,sides+1+j,sides+1+j+1)])
    if cap:
        for row,c in [(0,a),(1,b)]:
            ii=len(p);p.append(tuple(c));uv.append((.5,.5))
            for k in range(sides):
                j=row*(sides+1)+k
                f.append((ii,j,j+1) if row==1 else (ii,j+1,j))
    m.append(p,uv,f)

def polyline(m,points,width=.0035,sides=6):
    for a,b in zip(points[:-1],points[1:]):cylinder(m,a,b,width,width,sides=sides)

def surface_patch(m,p00,p10,p01,p11,squares=(7,5),sag=.0):
    ucount,vcount=squares
    p=[];uv=[];f=[]
    p00=np.array(p00);p10=np.array(p10);p01=np.array(p01);p11=np.array(p11)
    for j in range(vcount+1):
        v=j/vcount
        for i in range(ucount+1):
            u=i/ucount
            pos=(p00*(1-u)*(1-v)+p10*u*(1-v)+p01*(1-u)*v+p11*u*v)
            pos[2]+=sag*math.sin(u*math.pi)*math.sin(v*math.pi)
            p.append(tuple(pos));uv.append((u,v))
            if i>0 and j>0:
                a=(j-1)*(ucount+1)+i-1;b=a+ucount+1
                f.extend([(a,b,a+1),(a+1,b,b+1)])
    m.append(p,uv,f)

# --- body (anatomical, not costume-mask) ---
skin=part('Body_Neck_Face',MAT_SKIN,'Head',(1.,1.,1.))
sphere(skin,(0,1.73,.017),(.128,.179,.123),sides=40,rings=28,headdetail=True)
neck=part('Exposed_neck',MAT_SKIN,'Neck')
loft(neck,[(0,1.50,-.004,.072,.076),(0,1.57,.001,.068,.070),(0,1.63,.018,.068,.071)],sides=28,fold=.008)
# Human nose distinct from face under hood, naturally projected from skull.
nose=part('Face_nose',MAT_SKIN,'Head')
sphere(nose,(0,1.695,.142),(.026,.039,.035),sides=18,rings=13)
sphere(nose,(-.020,1.676,.15),(.014,.011,.018),sides=12,rings=8)
sphere(nose,(.020,1.676,.15),(.014,.011,.018),sides=12,rings=8)
for side in [-1,1]:
    ears=part('Ear_'+str(side),MAT_SKIN,'Head',(.91,.92,.90))
    sphere(ears,(side*.131,1.725,.025),(.024,.046,.028),sides=14,rings=12)
    cheek=part('Cheek_'+str(side),MAT_SKIN,'Head',(1.02,.98,.96))
    sphere(cheek,(side*.067,1.685,.107),(.045,.046,.017),sides=16,rings=13)
    brow=part('Natural_brow_'+str(side),MAT_TRIM,'Head',(.17,.16,.15))
    polyline(brow,[(side*.045,1.780,.130),(side*.073,1.783,.132),(side*.105,1.775,.104)],.0045,8)
    eye=part('Eyes_socket_'+str(side),MAT_SKIN,'Head',(.31,.29,.27))
    sphere(eye,(side*.061,1.765,.136),(.024,.009,.004),sides=16,rings=10)
    # tiny unlit natural iris, never emissive.
    iris=part('Iris_'+str(side),MAT_TRIM,'Head',(.20,.22,.20))
    sphere(iris,(side*.064,1.767,.141),(.008,.007,.003),sides=12,rings=8)
mouth=part('Closed_mouth',MAT_TRIM,'Head',(.30,.22,.22))
polyline(mouth,[(-.041,1.644,.130),(-.015,1.64,.146),(.010,1.64,.147),(.037,1.645,.131)],.0027,8)

# Hoodie hair & soft cloth behind the human face.
hood=part('Soft_fabric_hood_shell',MAT_JACKET,'Head',(.38,.43,.47))
# Back-of-head shell not the front: keep human face exposed by half-dome mesh.
p=[];uv=[];faces=[]
for j in range(19):
    theta=j*math.pi/35 # top to below crown
    for k in range(33):
        phi=(.02+k/32*.98)*math.pi*2
        x=.167*math.sin(theta)*math.cos(phi)
        y=1.745+.178*math.cos(theta)
        z=-.032+.143*math.sin(theta)*math.sin(phi)
        p.append((x,y,z));uv.append((k/32,j/18))
        if j and k:
            a=(j-1)*33+k-1;b=a+33;faces.extend([(a,b,a+1),(a+1,b,b+1)])
hood.append(p,uv,faces)
# Separate fabric side flaps and scarf-like neck folds.
for side in [-1,1]:
    drape=part('Hood_side_drape_'+str(side),MAT_JACKET,'Head',(.44,.48,.52))
    rows=[]
    for t in range(12):
        y=1.55+t/11*.28
        rows.append((side*(.124+.012*math.sin(t*.5)),y,-.05,
                     .046+.009*math.sin(t*.37),.082+.009*math.sin(t*.45)))
    loft(drape,rows,sides=18,fold=.08)
    trim=part('Hood_edge_seam_'+str(side),MAT_TRIM,'Head',(.33,.35,.34))
    polyline(trim,[(side*.125,1.56,.095),(side*.148,1.64,.095),
                   (side*.153,1.76,.082),(side*.11,1.87,.032)],.0035)
# Uneven dark hair, partly under fabric brim.
hair=part('Forehead_hair',MAT_LEATHER,'Head',(.32,.31,.30))
for x,yy,zz,length in [(-.083,1.858,.105,.041),(-.037,1.865,.131,.046),(.02,1.870,.123,.046),(.073,1.861,.10,.032)]:
    cylinder(hair,(x,yy,zz),(x+.008,yy-length,zz+.022),.016,.002,sides=12)

# Upper jacket is a detailed cloth shell, underlayer visually separate.
under=part('Dark_tshirt_underlayer',MAT_JACKET,'Torso',(.69,.68,.64))
loft(under,[(0,1.02,-.006,.215,.134),(0,1.19,.002,.21,.140),
            (0,1.36,-.008,.245,.149),(0,1.50,-.01,.215,.12)],sides=34,fold=.02)
coat=part('Charcoal_jacket_shell',MAT_JACKET,'Torso',(.72,.76,.76))
rows=[]
for i in range(25):
    t=i/24;y=1.0+.52*t
    rx=.257+.026*math.sin(math.pi*t)+.025*t
    rz=.155+.045*math.sin(math.pi*t)
    cx=.009*math.sin(t*4)
    rows.append((cx,y,-.008,rx,rz))
loft(coat,rows,sides=40,fold=.049,front_bulge=.004)
# Jacket hem drops below waist for recognizable coat-vs-trouser silhouette.
hem=part('Hanging_jacket_hem',MAT_JACKET,'Pelvis',(.62,.65,.67))
rows=[(0,.86,-.002,.245,.141),(0,.91,-.002,.256,.161),
      (0,.98,-.002,.265,.166),(0,1.03,-.002,.255,.158)]
loft(hem,rows,sides=40,fold=.081)
# Front opening — narrow black inset, side jacket lapels, visible zipper.
opening=part('Unzipped_jacket_undershirt',MAT_JACKET,'Torso',(.41,.43,.43))
surface_patch(opening,(-.054,1.06,.178),(.048,1.06,.179),
                    (-.067,1.485,.141),(.060,1.486,.145),squares=(9,15),sag=.012)
for side in [-1,1]:
    lapel=part('Work_jacket_lapel_'+str(side),MAT_JACKET,'Torso',(.84,.84,.82))
    surface_patch(lapel,(side*.018,1.052,.180),(side*.132,1.07,.18),
                        (side*.047,1.48,.156),(side*.14,1.46,.146),squares=(8,20),sag=.014)
    seam=part('Visible_jacket_seam_'+str(side),MAT_TRIM,'Torso',(.45,.42,.36))
    polyline(seam,[(side*.08,1.025,.18),(side*.12,1.16,.191),
                   (side*.12,1.30,.187),(side*.085,1.49,.153)],.0035)
    pocket=part('Jacket_pocket_flap_'+str(side),MAT_JACKET,'Torso',(.78,.78,.75))
    surface_patch(pocket,(side*.095,1.165,.198),(side*.22,1.16,.159),
                          (side*.095,1.225,.20),(side*.22,1.22,.164),squares=(7,7),sag=.008)
    trim=part('Pocket_stitch_'+str(side),MAT_TRIM,'Torso',(.62,.55,.45))
    polyline(trim,[(side*.10,1.17,.206),(side*.21,1.173,.175)],.0028)
zipper=part('Dull_jacket_zipper',MAT_TRIM,'Torso',(.48,.46,.43))
polyline(zipper,[(.006,1.06,.184),(.014,1.22,.194),(.013,1.33,.190),(.018,1.48,.155)],.004,8)
for k in range(22):
    y=1.075+k*.017
    hardware=part('Zipper_tooth',MAT_TRIM,'Torso',(.5,.48,.46))
    cylinder(hardware,(.006,y,.192),(.022,y,.193),.0023,.0023,sides=6)

# Jacketed arms have broad shoulder, realistic elbows, gathered cuffs.
for side in [-1,1]:
    arm=part('Work_jacket_sleeve_'+str(side),MAT_JACKET,'Arm',(.74,.75,.75))
    rows=[]
    for i in range(22):
        t=i/21;y=.838+t*.65
        xx=side*(.349+.042*math.sin(t*math.pi))
        radius=.082+.040*t+.008*math.sin(t*math.pi)
        rows.append((xx,y,.03-.018*t,radius,radius*.94))
    loft(arm,rows,sides=28,fold=.063)
    outerSeam=part('Sleeve_stitch_'+str(side),MAT_TRIM,'Arm',(.42,.43,.42))
    polyline(outerSeam,[(side*.45,.85,.032),(side*.472,1.03,.03),
                       (side*.51,1.26,.01),(side*.463,1.43,.025)],.003)
    for k in range(4):
        y=.862+k*.016
        cuff=part('Sleeve_gather_'+str(side),MAT_JACKET,'Arm',(.54,.58,.60))
        a=[(side*.35,y,.025,.094,.094),(side*.35,y+.007,.025,.089,.090)]
        loft(cuff,a,sides=24,fold=.06)
    glove=part('Leather_work_glove_'+str(side),MAT_LEATHER,'Hands',(.81,.82,.78))
    loft(glove,[(side*.345,.692,.060,.063,.054),(side*.344,.756,.059,.067,.060),
                (side*.346,.816,.052,.080,.068),(side*.346,.846,.048,.081,.069)],sides=24,fold=.02)
    for finger in range(4):
        x=side*(.305+finger*.027)
        f=part('Glove_finger_'+str(side)+'_'+str(finger),MAT_LEATHER,'Hands',(.79,.79,.76))
        cylinder(f,(x,.715,.095),(x,.665+.005*(finger%2),.118),.014,.012,sides=10)
    thumb=part('Gloved_thumb_'+str(side),MAT_LEATHER,'Hands',(.84,.82,.80))
    cylinder(thumb,(side*.28,.76,.105),(side*.258,.698,.126),.020,.014,sides=12)
    if side<0:
        repair=part('Repaired_left_elbow_patch',MAT_JACKET,'Arm',(.95,.91,.86))
        surface_patch(repair,(-.47,1.06,.066),(-.31,1.065,.077),
                             (-.49,1.21,.063),(-.31,1.205,.081),squares=(12,15),sag=.018)
        seam=part('Repair_patch_sewing',MAT_TRIM,'Arm',(.57,.53,.50))
        polyline(seam,[(-.47,1.08,.075),(-.31,1.081,.085),(-.31,1.20,.081),
                       (-.48,1.198,.068),(-.47,1.08,.075)],.0025)

# Tapered work trousers, seam lines, reinforced knees.
for side in [-1,1]:
    pant=part('Tapered_work_trouser_'+str(side),MAT_JACKET,'Leg',(.58,.61,.62))
    rows=[]
    for i in range(25):
        t=i/24;y=.10+t*.94
        cx=side*(.172+.009*math.sin(t*math.pi))
        radius=.095+.050*t+.008*math.sin(t*3*math.pi)
        rows.append((cx,y,.032+.012*t,radius,radius*.94))
    loft(pant,rows,sides=28,fold=.061)
    seam=part('Trouser_side_stitch_'+str(side),MAT_TRIM,'Leg',(.35,.36,.35))
    polyline(seam,[(side*.270,.125,.04),(side*.280,.52,.051),
                   (side*.310,.79,.037),(side*.310,1.02,.023)],.0026)
    knee=part('Soft_wrinkle_knee_'+str(side),MAT_JACKET,'Leg',(.61,.62,.62))
    rows=[(side*.174,.480,.049,.132,.117),(side*.173,.500,.050,.135,.12),
          (side*.173,.515,.051,.133,.121)]
    loft(knee,rows,sides=28,fold=.11)
    # Worn boot body + sole + rounded toe, meets the floor.
    boots=part('Scuffed_work_boot_'+str(side),MAT_LEATHER,'Foot',(.72,.72,.67))
    loft(boots,[(side*.172,.047,.080,.107,.132),(side*.172,.104,.052,.111,.113),
                (side*.173,.16,.048,.107,.103),(side*.173,.255,.037,.091,.089)],sides=26,fold=.04)
    toe=part('Boot_round_toe_'+str(side),MAT_LEATHER,'Foot',(.76,.77,.73))
    sphere(toe,(side*.173,.072,.164),(.111,.060,.160),sides=24,rings=16)
    sole=part('Rubber_boot_sole_'+str(side),MAT_LEATHER,'Foot',(.49,.48,.47))
    loft(sole,[(side*.173,.015,.111,.116,.182),(side*.173,.041,.103,.117,.18)],sides=28,fold=.025)
    for k in range(3):
        lace=part('Dull_boot_laces_'+str(side),MAT_TRIM,'Foot',(.43,.42,.39))
        y=.128+k*.027
        polyline(lace,[(side*.118,y,.143),(side*.174,y+.008,.145),
                       (side*.225,y,.137)],.0029)

# Intentional human-scale variation and one jacket-patch asymmetry.
# Keep GLB material/draw-call count small by joining all component shapes by material.
for m in PARTS:
    m.skin();m.compute_normals()

# -- Texture generation: procedural PBR 1024 / 512, no external dependencies --
def clamp(x,a=0,b=255):return np.clip(x,a,b)
def texture_maps(which,size):
    seed=SEED+which*17
    rnd=np.random.default_rng(seed)
    yy,xx=np.indices((size,size),dtype=np.float32)
    noise=rnd.standard_normal((size,size)).astype(np.float32)
    if which==0:
        weave=np.sin(xx*.41)*np.sin(yy*.48)
        fine=np.sin(xx*.74+yy*.06)*.3
        detail=.5*weave+.30*fine+.20*noise
        rgb=(np.array([90,101,107])[None,None,:]+detail[:,:,None]*11).clip(0,255)
        rough=.88+.065*detail
        metallic=np.zeros_like(rough)
    elif which==1:
        pores=np.sin(xx*.31+noise*.2)*np.sin(yy*.32)
        detail=.65*pores+.35*noise
        rgb=(np.array([148,110,94])[None,None,:]+detail[:,:,None]*7).clip(0,255)
        rough=.78+.045*detail
        metallic=np.zeros_like(rough)
    elif which==2:
        grain=np.sin(yy*.78+xx*.05)
        detail=.48*grain+.52*noise
        rgb=(np.array([84,79,77])[None,None,:]+detail[:,:,None]*13).clip(0,255)
        rough=.79+.10*detail
        metallic=np.zeros_like(rough)
    else:
        detail=.35*np.sin(yy*.5)+.5*noise
        rgb=(np.array([119,115,110])[None,None,:]+detail[:,:,None]*8).clip(0,255)
        rough=.69+.085*detail
        metallic=(np.ones_like(rough)*.47)
    color=np.uint8(rgb)
    dx=np.roll(detail,-1,axis=1)-np.roll(detail,1,axis=1)
    dy=np.roll(detail,-1,axis=0)-np.roll(detail,1,axis=0)
    strength=.018 if which==1 else .046
    normals=np.dstack((-dx*strength,-dy*strength,np.ones_like(dx)))
    normals/=np.maximum(1e-8,np.linalg.norm(normals,axis=2))[:,:,None]
    nmap=np.uint8(clamp((normals*.5+.5)*255))
    orm=np.uint8(np.dstack((np.full((size,size),238,dtype=np.float32),
                clamp(rough*255),clamp(metallic*255))))
    out=[]
    for img in [color,nmap,orm]:
        buffer=io.BytesIO();Image.fromarray(img,'RGB').save(buffer,format='PNG',optimize=True)
        out.append(buffer.getvalue())
    return out

TEX_DEFS=[]
for mat in range(4):
    edge=1024 if mat==0 else 512
    TEX_DEFS.append(texture_maps(mat,edge))

class GLBPacker:
    def __init__(self):self.data=bytearray();self.views=[];self.accessors=[]
    def append(self,arr,target=None,minmax=False):
        arr=np.ascontiguousarray(arr)
        while len(self.data)%4:self.data.append(0)
        start=len(self.data);blob=arr.tobytes();self.data.extend(blob)
        view={'buffer':0,'byteOffset':start,'byteLength':len(blob)}
        if target:view['target']=target
        vi=len(self.views);self.views.append(view)
        if arr.dtype==np.float32:component=5126
        elif arr.dtype==np.uint16:component=5123
        elif arr.dtype==np.uint8:component=5121
        else:raise TypeError(arr.dtype)
        if arr.ndim==2:
            n=arr.shape[1];type_name={2:'VEC2',3:'VEC3',4:'VEC4',16:'MAT4'}.get(n)
            count=len(arr)
        else:type_name='SCALAR';count=len(arr)
        assert type_name,(arr.shape,arr.dtype)
        acc={'bufferView':vi,'componentType':component,'count':count,'type':type_name}
        if minmax and len(arr):
            source=arr if arr.ndim==2 else arr.reshape(-1,1)
            acc['min']=source.min(axis=0).tolist();acc['max']=source.max(axis=0).tolist()
        ai=len(self.accessors);self.accessors.append(acc)
        return ai
    def image(self,blob):
        while len(self.data)%4:self.data.append(0)
        start=len(self.data);self.data.extend(blob)
        vi=len(self.views);self.views.append({'buffer':0,'byteOffset':start,'byteLength':len(blob)})
        return vi

p=GLBPacker()
# Join all subparts by material into FOUR skinned primitives.
primitives=[]
TRIS=0
for mat in range(4):
    grouped=[i for i in PARTS if i.mat==mat]
    if not grouped:continue
    positions=[];normals=[];uv=[];color=[];joints=[];weights=[];indices=[]
    for item in grouped:
        start=len(positions)
        positions.extend(item.p);normals.extend(item.norm.tolist());uv.extend(item.uv)
        color.extend(item.cols);joints.extend(item.joints);weights.extend(item.weights)
        indices.extend((a+start,b+start,c+start) for a,b,c in item.tris)
    triangles=np.asarray(indices,dtype=np.uint16).flatten()
    assert max(triangles)<65536,'Use UINT32 indices if model exceeds 65535 vertices in a primitive'
    TRIS+=len(triangles)//3
    primitive={
     'attributes':{
      'POSITION':p.append(np.asarray(positions,dtype=np.float32),34962,True),
      'NORMAL':p.append(np.asarray(normals,dtype=np.float32),34962),
      'TEXCOORD_0':p.append(np.asarray(uv,dtype=np.float32),34962),
      'COLOR_0':p.append(np.asarray(color,dtype=np.float32),34962),
      'JOINTS_0':p.append(np.asarray(joints,dtype=np.uint8),34962),
      'WEIGHTS_0':p.append(np.asarray(weights,dtype=np.float32),34962)
     },'indices':p.append(triangles,34963),'material':mat,'mode':4
    }
    primitives.append(primitive)
assert TRIS <= 25000,(TRIS,'exceeded 25K hard budget')
assert TRIS>=18000,(TRIS,'need 18K+ for v2 detail budget')

# Nodes: index 0 is an unanimated mesh/root host, 1..37 skeleton bones.
nodes=[{'name':'TheUninvitedV2','mesh':0,'skin':0}]
for name,parent,world in J:
    if parent is None:local=np.asarray(world,dtype=float)
    else:local=np.asarray(world,dtype=float)-J_POS[parent]
    nodes.append({'name':name,'translation':local.tolist()})
for i,(name,parent,world) in enumerate(J):
    if parent is not None:
        parent_index=J_IDX[parent]+1
        nodes[parent_index].setdefault('children',[]).append(i+1)
# Inverse bind matrices convert mesh WORLD rest coordinates into joint local.
matrices=[]
for name,_,world in J:
    tx,ty,tz=world
    inverse=np.eye(4,dtype=np.float32)
    inverse[0,3]=-tx;inverse[1,3]=-ty;inverse[2,3]=-tz
    matrices.append(inverse.T.flatten()) # column-major for glTF
inv_acc=p.append(np.asarray(matrices,dtype=np.float32))

# Quaternion from Euler rotations about individual axes; joint rest rotation identity.
def quat(axis,deg):
    theta=math.radians(deg)*.5;s=math.sin(theta);c=math.cos(theta)
    return [s,0,0,c] if axis=='x' else [0,s,0,c] if axis=='y' else [0,0,s,c]

# Eight linear key poses normalized to support smooth sample points.
# Each sample list equals sample count 9 and matches first/last for loops.
CLIP_DESCS=[
 ('idle',3.6,True,{'Spine':('z',[0,1,0,-1,0,1,0,-1,0]),'Head':('y',[0,-2,-4,0,3,2,0,-1,0]),'Shoulder_R':('x',[0,-2,-1,1,0,-2,-1,1,0])}),
 ('walk',1.1,True,{'Thigh_L':('x',[27,19,0,-19,-27,-19,0,19,27]),'Thigh_R':('x',[-27,-19,0,19,27,19,0,-19,-27]),'Knee_L':('x',[-3,6,22,8,-3,6,22,8,-3]),'Knee_R':('x',[22,8,-3,6,22,8,-3,6,22]),'Shoulder_L':('x',[-19,-11,0,13,20,11,0,-12,-19]),'Shoulder_R':('x',[19,11,0,-13,-20,-11,0,12,19]),'Spine':('z',[0,-1,0,1,0,-1,0,1,0])}),
 ('attack',.52,False,{'Spine':('y',[-22,-20,-9,10,16,7,0,-5,0]),'Shoulder_R':('x',[-90,-60,-6,48,60,32,8,-3,0]),'Elbow_R':('x',[40,47,52,25,5,0,2,0,0]),'Head':('x',[2,-4,-10,-3,5,1,0,0,0]),'Shoulder_L':('x',[4,7,11,16,8,3,0,0,0])}),
 ('stagger',.8,False,{'Spine':('x',[0,10,19,16,8,0,-6,-3,0]),'Head':('x',[0,8,14,9,-4,-9,-1,0,0]),'Shoulder_R':('z',[0,12,23,14,4,-8,-2,0,0]),'Shoulder_L':('z',[0,-10,-17,-13,0,8,2,0,0])}),
 ('idle_listen',3.,True,{'Head':('y',[0,2,5,6,5,2,0,-1,0]),'Spine_Upper':('y',[0,1,2,2,1,0,0,-1,0])}),
 ('search',3.2,True,{'Head':('y',[-9,-17,-17,-7,9,22,17,6,-9]),'Neck':('x',[0,0,-3,-2,0,2,1,0,0]),'Spine':('y',[0,-1,-4,-3,0,5,5,2,0])}),
 ('notice',.65,False,{'Head':('x',[-4,-3,1,3,5,4,2,0,0]),'Shoulder_R':('x',[0,-2,-6,-8,-7,-4,-1,0,0])}),
 ('windup',.82,False,{'Spine':('y',[0,-3,-9,-15,-19,-22,-23,-23,-23]),'Spine_Upper':('x',[0,-2,-4,-9,-12,-13,-13,-13,-13]),'Shoulder_R':('x',[0,-10,-18,-37,-56,-75,-85,-90,-90]),'Elbow_R':('x',[0,2,4,14,25,37,41,44,44]),'Head':('y',[0,1,4,6,7,6,5,5,5])}),
 ('recover',1.25,False,{'Spine':('y',[16,10,6,0,-4,-3,0,0,0]),'Shoulder_R':('x',[45,23,5,-8,-2,0,0,0,0]),'Head':('x',[3,1,0,-1,0,0,0,0,0])}),
 ('pursue',.85,True,{'Spine':('x',[-6,-9,-6,-7,-6,-9,-6,-7,-6]),'Thigh_L':('x',[36,25,0,-26,-36,-25,0,26,36]),'Thigh_R':('x',[-36,-25,0,26,36,25,0,-26,-36]),'Knee_L':('x',[-4,12,26,16,-4,12,26,16,-4]),'Knee_R':('x',[26,16,-4,12,26,16,-4,12,26]),'Shoulder_L':('x',[-25,-15,0,16,25,15,0,-16,-25]),'Shoulder_R':('x',[25,15,0,-16,-25,-15,0,16,25])}),
 ('turn_left',.70,False,{'Pelvis':('y',[0,0,1,6,12,22,30,40,45]),'Head':('y',[0,-5,-8,-6,-3,0,0,0,0])}),
 ('turn_right',.70,False,{'Pelvis':('y',[0,0,-1,-6,-12,-22,-30,-40,-45]),'Head':('y',[0,5,8,6,3,0,0,0,0])})
]
animations=[]
for name,duration,loop,tracks in CLIP_DESCS:
    times=np.linspace(0,duration,9,dtype=np.float32)
    input_ai=p.append(times,minmax=True)
    samplers=[];channels=[]
    for bone,(axis,degs) in tracks.items():
        assert len(degs)==9
        quats=np.asarray([quat(axis,v) for v in degs],dtype=np.float32)
        output_ai=p.append(quats)
        si=len(samplers);samplers.append({'input':input_ai,'output':output_ai,'interpolation':'LINEAR'})
        channels.append({'sampler':si,'target':{'node':J_IDX[bone]+1,'path':'rotation'}})
    animations.append({'name':name,'samplers':samplers,'channels':channels,'extras':{'loop':loop}})

images=[];textures=[];mats=[]
for mi,name in enumerate(MAT_NAMES):
    texture_ids=[]
    for kind,blob in zip(('Basecolor','Normal','ORM'),TEX_DEFS[mi]):
        view=p.image(blob)
        images.append({'name':name+'_'+kind,'mimeType':'image/png','bufferView':view})
        texture_ids.append(len(textures))
        textures.append({'sampler':0,'source':len(images)-1})
    color_tex,normal_tex,orm_tex=texture_ids
    mats.append({
      'name':name,'doubleSided':True,
      'pbrMetallicRoughness':{'baseColorTexture':{'index':color_tex},'metallicRoughnessTexture':{'index':orm_tex},'baseColorFactor':[1,1,1,1],
          'metallicFactor':1 if mi==3 else 0.10,'roughnessFactor':1},
      'normalTexture':{'index':normal_tex,'scale':.35 if mi==0 else .20},
      'occlusionTexture':{'index':orm_tex,'strength':.28},
      'emissiveFactor':[0,0,0]
    })

GLTF={
 'asset':{'version':'2.0','generator':'3:17 AM Uninvited v2 original parametric skinned model v1'},
 'extensionsUsed':[],
 'scenes':[{'name':'The Uninvited v2','nodes':[0,1]}], 'scene':0,
 'nodes':nodes,
 'skins':[{'name':'TheUninvitedV2Skeleton','joints':[i+1 for i in range(len(J))],
             'skeleton':1,'inverseBindMatrices':inv_acc}],
 'meshes':[{'name':'SkinnedIntruderV2','primitives':primitives}],
 'materials':mats,
 'textures':textures,'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],
 'images':images,
 'animations':animations,
 'buffers':[{'byteLength':0}],
 'bufferViews':p.views,'accessors':p.accessors,
 'extras':{'triangles':TRIS,'skeleton_joints':len(J),'animation_clips':[c[0] for c in CLIP_DESCS],
          'source':'scripts/generate_intruder_v2.py','authoring_method':'reproducible_procedural_character',
          'not_blender_sculpt':True}
}
while len(p.data)%4:p.data.append(0)
GLTF['buffers'][0]['byteLength']=len(p.data)
json_bytes=json.dumps(GLTF,separators=(',',':'),ensure_ascii=True).encode('utf8')
json_bytes+=b' '*((-len(json_bytes))%4)
header=struct.pack('<4sII',b'glTF',2,12+8+len(json_bytes)+8+len(p.data))
asset=header+struct.pack('<II',len(json_bytes),0x4E4F534A)+json_bytes+struct.pack('<II',len(p.data),0x004E4942)+p.data
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
OUTPUT.write_bytes(asset)
print(json.dumps({'output':str(OUTPUT),'bytes':len(asset),'triangles':TRIS,
                  'bones':len(J),'animations':len(animations),'materials':len(mats),
                  'parts':len(PARTS)},indent=2))