#!/usr/bin/env python3
"""Blender-side preflight for The Uninvited v2.

Run inside Blender (not system Python):
    blender -b assets/source/blender/characters/char_intruder_v02.blend \\
      --python scripts/blender/validate_intruder_v2.py

This validates a *source .blend*, not an exported glTF. The Three.js/GLB gate
is implemented separately in tests/intruder-v2-contract.mjs.
"""
import json
import math
import sys
from pathlib import Path

try:
    import bpy
    from mathutils import Vector
except ImportError as exc:
    raise SystemExit("Run using Blender's Python: blender -b <file.blend> --python <this-script>") from exc


def main():
    repo = Path(__file__).resolve().parents[2]
    contract = json.loads((repo / "assets/characters/intruder-v2.contract.json").read_text(encoding="utf8"))
    issues = []
    warnings = []
    report = {"character": contract["character_id"], "source": bpy.data.filepath}

    if not bpy.data.filepath:
        issues.append("No .blend source file is open")
    export = bpy.data.collections.get("EXPORT")
    if export is None:
        print(json.dumps({"ok": False, "issues": ["Missing EXPORT collection"]}, indent=2))
        return 1

    objects = list(export.all_objects)
    arms = [o for o in objects if o.type == "ARMATURE"]
    if len(arms) != 1:
        issues.append("EXPORT must contain exactly one armature, found %d" % len(arms))
    arm = arms[0] if len(arms) == 1 else None
    expected_arm = contract["skeleton"]["armature_object"]
    if arm and arm.name != expected_arm:
        issues.append("Armature must be named %s, found %s" % (expected_arm, arm.name))

    meshes = [o for o in objects if o.type == "MESH"]
    if not meshes:
        issues.append("EXPORT has no mesh objects")

    for obj in objects:
        if obj.type not in {"MESH", "ARMATURE", "EMPTY"}:
            issues.append("Unexpected exported %s object: %s" % (obj.type, obj.name))
        if any(s <= 0 for s in obj.scale):
            issues.append("Non-positive scale on %s" % obj.name)
        if any(abs(s - 1) > 0.001 for s in obj.scale):
            issues.append("Unapplied scale on %s: %s" % (obj.name, list(obj.scale)))

    if arm:
        bones = {b.name: b for b in arm.data.bones}
        required = contract["skeleton"]["required_bones"]
        for name in required:
            if name not in bones:
                issues.append("Missing required bone: %s" % name)
        extra = sorted(set(bones) - set(required))
        if extra:
            warnings.append("Additional export bones (review for accidental controls): " + ", ".join(extra))
        if "Root" in bones and bones["Root"].use_deform:
            issues.append("Root must be marked non-deforming")
        for parent, children in contract["skeleton"]["hierarchy"].items():
            for child in children:
                if child in bones and bones[child].parent and bones[child].parent.name != parent:
                    issues.append("Bone %s must parent to %s (found %s)" %
                                  (child, parent, bones[child].parent.name))
                elif child in bones and bones[child].parent is None:
                    issues.append("Bone %s has no parent (expected %s)" % (child, parent))
        report["bone_count"] = len(bones)
        report["expected_bone_count"] = len(required)

    depsgraph = bpy.context.evaluated_depsgraph_get()
    original_pose_setting = arm.data.pose_position if arm else None
    if arm:
        arm.data.pose_position = "REST"
        bpy.context.view_layer.update()

    min_bounds = [float("inf")] * 3
    max_bounds = [float("-inf")] * 3
    triangle_count = 0
    material_names = set()
    max_influences_seen = 0
    has_unweighted = False
    try:
        for obj in meshes:
            if not obj.data.uv_layers:
                issues.append("Missing UV map: " + obj.name)

            modifiers = [m for m in obj.modifiers if m.type == "ARMATURE"]
            if arm and not any(m.object == arm for m in modifiers):
                issues.append("Missing armature modifier targeting %s on %s" % (arm.name, obj.name))

            for mat in obj.data.materials:
                if mat:
                    material_names.add(mat.name)
                    if not mat.use_nodes:
                        warnings.append("Material without node-based PBR: " + mat.name)
                    else:
                        for node in mat.node_tree.nodes:
                            if node.type == "TEX_IMAGE" and node.image:
                                w, h = node.image.size[:2]
                                cap = contract["geometry"]["max_texture_edge_px"]
                                if w > cap or h > cap:
                                    issues.append("Texture too large %s: %dx%d" % (node.image.name, w, h))

            for vertex in obj.data.vertices:
                active = [g for g in vertex.groups if g.weight > 0.001]
                max_influences_seen = max(max_influences_seen, len(active))
                if not active:
                    has_unweighted = True
                elif abs(sum(g.weight for g in active) - 1.0) > 0.02:
                    issues.append("Non-normalized weights on %s vertex %d" % (obj.name, vertex.index))
                    break

            # Evaluated geometry approximates what an exporter sees after modifiers.
            evaluated = obj.evaluated_get(depsgraph)
            evaluated_mesh = evaluated.to_mesh()
            try:
                triangle_count += sum(max(0, len(p.vertices) - 2) for p in evaluated_mesh.polygons)
                for corner in evaluated.bound_box:
                    pt = evaluated.matrix_world @ Vector(corner)
                    for axis in range(3):
                        min_bounds[axis] = min(min_bounds[axis], pt[axis])
                        max_bounds[axis] = max(max_bounds[axis], pt[axis])
            finally:
                evaluated.to_mesh_clear()
    finally:
        if arm:
            arm.data.pose_position = original_pose_setting
            bpy.context.view_layer.update()

    if max_influences_seen > contract["geometry"]["skin_influences_per_vertex_max"]:
        issues.append("Too many influences per vertex: %d" % max_influences_seen)
    if has_unweighted:
        issues.append("Some exported vertices have no nonzero skin weights")
    if triangle_count > contract["geometry"]["triangles_hard_cap"]:
        issues.append("Triangle count %d exceeds hard cap %d" %
                      (triangle_count, contract["geometry"]["triangles_hard_cap"]))
    if len(material_names) > contract["geometry"]["max_materials"]:
        issues.append("Material count %d exceeds cap %d" %
                      (len(material_names), contract["geometry"]["max_materials"]))

    if meshes:
        # In Blender, X=width, Z=height, Y=depth. Runtime glTF uses X,Y,Z.
        measured = [max_bounds[0] - min_bounds[0],
                    max_bounds[2] - min_bounds[2],
                    max_bounds[1] - min_bounds[1]]
        expected = contract["geometry"]["dimensions_xyz_m"]
        tolerances = contract["geometry"]["dimension_tolerance_relative"]
        for axis, (actual, target, tol) in enumerate(zip(measured, expected, tolerances)):
            if not math.isfinite(actual) or abs(actual - target) / target > tol:
                issues.append("Bounding dimension %d: %.3fm vs target %.3fm" %
                              (axis, actual, target))
        if abs(min_bounds[2]) > 0.04:
            issues.append("Boots must rest at Blender Z=0 (found %.3fm)" % min_bounds[2])
        report["dimensions_runtime_xyz_m"] = [round(x, 4) for x in measured]

    required_clips = [c for c in contract["animations"]["preferred_v2_clips"] if c["required_for_v2"]]
    by_name = {a.name: a for a in bpy.data.actions}
    fps = bpy.context.scene.render.fps / max(1e-6, bpy.context.scene.render.fps_base)
    for clip in required_clips:
        if clip["name"] not in by_name:
            issues.append("Missing named Blender action: " + clip["name"])
            continue
        action = by_name[clip["name"]]
        duration = (action.frame_range[1] - action.frame_range[0]) / fps
        tolerance = 0.10
        expected_seconds = clip["duration_ms"] / 1000
        if abs(duration - expected_seconds) > tolerance:
            warnings.append("Review action timing: %s %.3fs vs target %.3fs" %
                            (clip["name"], duration, expected_seconds))

    report.update({
        "mesh_objects": len(meshes),
        "evaluated_triangles": triangle_count,
        "materials": sorted(material_names),
        "maximum_vertex_influences": max_influences_seen,
        "named_actions": sorted(by_name),
        "fps": fps,
        "warnings": warnings,
        "issues": issues,
        "ok": len(issues) == 0
    })
    print(json.dumps(report, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
