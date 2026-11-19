#!/usr/bin/env python3
"""Import The Uninvited v2 candidate GLB into an editable Blender .blend.

Run with Blender installed:
  blender -b --python scripts/blender/import_intruder_v2.py

The result is editable starting geometry/rig from the procedural GLB,
NOT a hand-sculpted or professionally retopologized Blender hero asset.
"""
from pathlib import Path
import bpy

repo = Path(__file__).resolve().parents[2]
model = repo / 'assets/models/characters/char_intruder_v02.glb'
output = repo / 'assets/source/blender/characters/char_intruder_v02.blend'
if not model.exists():
    raise FileNotFoundError('Generate the candidate GLB first: ' + str(model))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(model))

export_collection = bpy.data.collections.new('EXPORT')
bpy.context.scene.collection.children.link(export_collection)
for obj in list(bpy.context.scene.objects):
    if obj.type not in {'MESH', 'ARMATURE', 'EMPTY'}:
        continue
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    export_collection.objects.link(obj)

armatures = [obj for obj in export_collection.objects if obj.type == 'ARMATURE']
if len(armatures) != 1:
    raise RuntimeError('Expected one imported armature, found ' + str(len(armatures)))
arm = armatures[0]
arm.name = 'ARM_IntruderV2'
arm.data.name = 'ARM_IntruderV2_Data'

required_bones = {'Root', 'Pelvis', 'Spine', 'Neck', 'Head', 'Shoulder_L',
                  'Shoulder_R', 'Elbow_L', 'Elbow_R', 'Thigh_L', 'Thigh_R',
                  'Knee_L', 'Knee_R'}
present = set(arm.data.bones.keys())
missing = required_bones - present
if missing:
    raise RuntimeError('Imported GLB missing bones: ' + ', '.join(sorted(missing)))

for obj in export_collection.objects:
    if obj.type != 'MESH':
        continue
    if not obj.data.uv_layers:
        raise RuntimeError('Missing UV coordinates: ' + obj.name)
    if not any(mod.type == 'ARMATURE' and mod.object == arm for mod in obj.modifiers):
        mod = obj.modifiers.new('IntruderSkin', 'ARMATURE')
        mod.object = arm

for name in ['RIG_CONTROLS', 'COLLISION_REFERENCE', 'BAKE', 'LOOKDEV']:
    if not bpy.data.collections.get(name):
        bpy.context.scene.collection.children.link(bpy.data.collections.new(name))

bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0
bpy.context.scene.render.fps = 30

output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(output))
print('Editable Blender starter character saved:', str(output))
print('Bones:', len(arm.data.bones), 'Actions:', len(bpy.data.actions))
