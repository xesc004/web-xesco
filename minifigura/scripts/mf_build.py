"""Minifigura de Xesco generada por código en Blender 5.1.

Se ejecuta dentro de Blender (por ejemplo a través del MCP):

    import sys, importlib
    sys.path.insert(0, r"C:/Users/xesco/OneDrive/Escritorio/web-xesco/minifigura/scripts")
    import mf_build; importlib.reload(mf_build)
    mf_build.build_all()

Unidades de Blender; la figura mide ~5,8 u de alto, apoya en z=0 y mira
hacia -Y (vista frontal = Numpad 1). El lado izquierdo del personaje es +X.
La cara se vectoriza a partir de la imagen de referencia (referencia/referencia.webp).
"""
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX_DIR = os.path.join(BASE_DIR, "texturas")
RENDER_DIR = os.path.join(BASE_DIR, "renders")
REF_IMAGE = os.path.join(BASE_DIR, "referencia", "referencia.webp")

COLL_FIG = "Minifigura"
COLL_STUDIO = "Estudio"
ROOT = "MF_Raiz"

# ── Medidas principales ─────────────────────────────────────────────
LEG_TOP = 1.66
HIP_Z0, HIP_Z1 = 1.58, 1.92
# Sudadera oversize: torso más ancho, más profundo y más largo (tapa parte de la cadera)
TORSO_Z0, TORSO_Z1 = 1.80, 3.62
TORSO_HW0, TORSO_HW1 = 1.10, 0.80   # media anchura abajo / arriba
TORSO_HD = 0.50                      # media profundidad
# Cabeza: bloque redondeado (sección superelipse) con orejas y cuello ancho
HEAD_Z0, HEAD_Z1 = 3.83, 5.12
HEAD_A, HEAD_B, HEAD_N = 0.80, 0.76, 3.0   # media anchura, media profundidad, exponente
NECK_R = 0.50

# Calibración del primer plano "Cara" de la referencia: centro de la cara, barbilla y píxeles por unidad
REF_CX, REF_CHIN_Y, REF_SCALE = 723.0, 958.0, 127.5

# ── Paleta (sRGB) ───────────────────────────────────────────────────
SKIN = "#EDA670"
HOODIE = "#F47B20"
CORD = "#FF9C47"
PANTS = "#1D2840"
HAIR = "#3A2418"


# ════════════════════════════════════════════════════════════════════
#  Utilidades
# ════════════════════════════════════════════════════════════════════
def hex_srgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_linear(h):
    return tuple(srgb_to_linear(c) for c in hex_srgb(h)) + (1.0,)


def smoothstep(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3.0 - 2.0 * t)


def get_collection(name):
    coll = bpy.data.collections.get(name)
    if coll is None:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    return coll


def remove_object(name):
    ob = bpy.data.objects.get(name)
    if ob is None:
        return
    data = ob.data
    bpy.data.objects.remove(ob, do_unlink=True)
    if data is None or data.users:
        return
    for coll in (bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        if data.name in coll and coll[data.name] == data:
            coll.remove(data)
            return


def root_empty():
    ob = bpy.data.objects.get(ROOT)
    if ob is None:
        ob = bpy.data.objects.new(ROOT, None)
        ob.empty_display_type = 'PLAIN_AXES'
        get_collection(COLL_FIG).objects.link(ob)
    return ob


def mesh_object(name, verts, faces, mat=None, *, uvs=None, recalc=True, smooth=True,
                sharp_angle=None, coll=COLL_FIG, parent=True):
    remove_object(name)
    me = bpy.data.meshes.new(name)
    vlist = verts.tolist() if isinstance(verts, np.ndarray) else [tuple(v) for v in verts]
    me.from_pydata(vlist, [], [list(f) for f in faces])
    if uvs is not None:
        layer = me.uv_layers.new(name="UVMap")
        layer.data.foreach_set("uv", np.asarray(uvs, dtype=np.float32).ravel())
    me.update()
    if recalc:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bm.to_mesh(me)
        bm.free()
    if smooth:
        me.shade_smooth()
        if sharp_angle is not None:
            me.set_sharp_from_angle(angle=math.radians(sharp_angle))
    if mat is not None:
        me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    get_collection(coll).objects.link(ob)
    if parent:
        ob.parent = root_empty()
    return ob


def add_bevel(ob, width, segments=4, angle=30.0):
    mod = ob.modifiers.new("Bisel", 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(angle)
    mod.harden_normals = True
    mod.use_clamp_overlap = True
    return mod


class Geo:
    """Acumula vértices y caras de varias piezas para crear un único mesh."""

    def __init__(self):
        self.verts, self.faces = [], []

    def add(self, geo):
        verts, faces = geo
        offset = len(self.verts)
        self.verts.extend(tuple(v) for v in verts)
        self.faces.extend(tuple(i + offset for i in f) for f in faces)
        return self


# ════════════════════════════════════════════════════════════════════
#  Primitivas
# ════════════════════════════════════════════════════════════════════
def catmull_rom(points, samples=16):
    P = [Vector(p) for p in points]
    ext = [P[0] + (P[0] - P[1])] + P + [P[-1] + (P[-1] - P[-2])]
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        for k in range(samples):
            t = k / samples
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1].copy())
    return np.array([tuple(v) for v in out])


def resample(pts, n):
    """Remuestrea una polilínea a n puntos equidistantes. Devuelve (pts, t∈[0,1], longitud)."""
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    t = np.linspace(0.0, s[-1], n)
    out = np.stack([np.interp(t, s, pts[:, i]) for i in range(3)], axis=1)
    return out, t / s[-1], s[-1]


def tube(pts, radii, nseg=16, cap0="round", cap1="round", cap_rings=4, squash=1.0):
    """Barre un círculo por una polilínea (marcos de transporte paralelo).

    cap0/cap1: "round" (semiesfera), "flat" (tapa plana) o None.
    """
    P = [Vector(p) for p in pts]
    R = [float(r) for r in radii]
    n = len(P)
    T = [(P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized() for i in range(n)]
    ref = Vector((0, 0, 1)) if abs(T[0].z) < 0.9 else Vector((1, 0, 0))
    N = [(ref - T[0] * ref.dot(T[0])).normalized()]
    for i in range(1, n):
        axis = T[i - 1].cross(T[i])
        if axis.length < 1e-9:
            N.append(N[-1].copy())
        else:
            ang = T[i - 1].angle(T[i])
            N.append((Matrix.Rotation(ang, 3, axis.normalized()) @ N[-1]).normalized())

    verts, faces, rings = [], [], []

    def ring(c, Ni, Bi, r):
        idx = []
        for k in range(nseg):
            a = 2 * math.pi * k / nseg
            verts.append(tuple(c + Ni * (math.cos(a) * r) + Bi * (math.sin(a) * r * squash)))
            idx.append(len(verts) - 1)
        return idx

    def pole(c):
        verts.append(tuple(c))
        return [len(verts) - 1]

    if cap0 == "round":
        Ti, Ni = T[0], N[0]
        Bi = Ti.cross(Ni)
        rings.append(pole(P[0] - Ti * R[0]))
        for j in range(cap_rings - 1, 0, -1):
            th = j / cap_rings * math.pi / 2
            rings.append(ring(P[0] - Ti * (R[0] * math.sin(th)), Ni, Bi, R[0] * math.cos(th)))
    for i in range(n):
        rings.append(ring(P[i], N[i], T[i].cross(N[i]), R[i]))
    if cap1 == "round":
        Ti, Ni = T[-1], N[-1]
        Bi = Ti.cross(Ni)
        for j in range(1, cap_rings):
            th = j / cap_rings * math.pi / 2
            rings.append(ring(P[-1] + Ti * (R[-1] * math.sin(th)), Ni, Bi, R[-1] * math.cos(th)))
        rings.append(pole(P[-1] + Ti * R[-1]))

    for a, b in zip(rings[:-1], rings[1:]):
        for k in range(nseg):
            k2 = (k + 1) % nseg
            if len(a) == 1:
                faces.append((a[0], b[k2], b[k]))
            elif len(b) == 1:
                faces.append((a[k], a[k2], b[0]))
            else:
                faces.append((a[k], a[k2], b[k2], b[k]))
    if cap0 == "flat":
        faces.append(tuple(reversed(rings[0])))
    if cap1 == "flat":
        faces.append(tuple(rings[-1]))
    return verts, faces


def ellipsoid(center, radii, nu=32, nv=16):
    cx, cy, cz = center
    rx, ry, rz = radii
    verts = [(cx, cy, cz - rz)]
    for i in range(1, nv):
        th = -math.pi / 2 + math.pi * i / nv
        for j in range(nu):
            ph = 2 * math.pi * j / nu
            verts.append((cx + rx * math.cos(th) * math.cos(ph),
                          cy + ry * math.cos(th) * math.sin(ph),
                          cz + rz * math.sin(th)))
    verts.append((cx, cy, cz + rz))
    top = len(verts) - 1
    faces = []
    for j in range(nu):
        faces.append((0, 1 + (j + 1) % nu, 1 + j))
    for i in range(nv - 2):
        a, b = 1 + i * nu, 1 + (i + 1) * nu
        for j in range(nu):
            j2 = (j + 1) % nu
            faces.append((a + j, a + j2, b + j2, b + j))
    a = 1 + (nv - 2) * nu
    for j in range(nu):
        faces.append((a + j, a + (j + 1) % nu, top))
    return verts, faces


def frustum_box(z0, z1, hw0, hw1, hd0, hd1):
    v = [(-hw0, -hd0, z0), (hw0, -hd0, z0), (hw0, hd0, z0), (-hw0, hd0, z0),
         (-hw1, -hd1, z1), (hw1, -hd1, z1), (hw1, hd1, z1), (-hw1, hd1, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f


def prism(outline, axis, a0, a1):
    """Extruye un contorno 2D: axis 'X' → contorno en (y, z); axis 'Y' → contorno en (x, z)."""
    n = len(outline)
    verts = []
    for a in (a0, a1):
        for p, q in outline:
            verts.append((a, p, q) if axis == 'X' else (p, a, q))
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    return verts, faces


def rounded_rect(x0, x1, y0, y1, rc, n=4):
    pts = []
    for cx, cy, a0 in ((x1 - rc, y0 + rc, -90), (x1 - rc, y1 - rc, 0),
                       (x0 + rc, y1 - rc, 90), (x0 + rc, y0 + rc, 180)):
        for a in np.linspace(a0, a0 + 90, n):
            pts.append((cx + rc * math.cos(math.radians(a)), cy + rc * math.sin(math.radians(a))))
    return pts


def bezier2(p0, p1, p2, n):
    t = np.linspace(0.0, 1.0, n)[:, None]
    p0, p1, p2 = (np.asarray(p, float) for p in (p0, p1, p2))
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2


# ════════════════════════════════════════════════════════════════════
#  Materiales
# ════════════════════════════════════════════════════════════════════
def _principled(name):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (500, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (150, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat, nt, bsdf


def plastic(name, hexcol, rough=0.3, coat=0.0, spec=0.5):
    mat, nt, bsdf = _principled(name)
    col = hex_linear(hexcol)
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Specular IOR Level"].default_value = spec
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.08
    mat.diffuse_color = col
    mat.roughness = rough
    return mat


def make_materials():
    mats = {
        "piel": plastic("MF_Piel", SKIN, rough=0.28),
        "pantalon": plastic("MF_Pantalon", PANTS, rough=0.30, coat=0.15),
        "pelo": plastic("MF_Pelo", HAIR, rough=0.30, coat=0.35),
        "pelo_base": plastic("MF_Pelo_Base", "#22140D", rough=0.65, spec=0.3),
        "cordon": plastic("MF_Cordon", CORD, rough=0.45),
    }
    # Sudadera: plástico mate con un relieve de ruido suave (tejido)
    mat = plastic("MF_Sudadera", HOODIE, rough=0.55)
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    tc.location = (-700, -150)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.location = (-500, -150)
    noise.inputs["Scale"].default_value = 14.0
    noise.inputs["Detail"].default_value = 3.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.location = (-250, -150)
    bump.inputs["Strength"].default_value = 0.07
    bump.inputs["Distance"].default_value = 0.02
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["sudadera"] = mat
    return mats


# ════════════════════════════════════════════════════════════════════
#  Cuerpo: piernas, cadera, sudadera oversize, brazos y manos
# ════════════════════════════════════════════════════════════════════
def torso_half_width(z):
    return TORSO_HW0 + (TORSO_HW1 - TORSO_HW0) * (z - TORSO_Z0) / (TORSO_Z1 - TORSO_Z0)


def build_legs(m):
    outline = [(0.36, 0.0), (-0.79, 0.0), (-0.79, 0.40), (-0.36, 0.40), (-0.36, LEG_TOP), (0.36, LEG_TOP)]
    for s, tag in ((1, "L"), (-1, "R")):
        x0, x1 = sorted((s * 0.03, s * 0.99))
        leg = mesh_object(f"MF_Pierna_{tag}", *prism(outline, 'X', x0, x1), m["pantalon"])
        # Hueco circular en la parte trasera de cada pierna
        cx = s * 0.51
        cut_pts = [(cx, 0.12 + 0.48 * i / 4, 0.52) for i in range(5)]
        cutter = mesh_object(f"MF_Cortador_{tag}", *tube(cut_pts, [0.25] * 5, nseg=48, cap0="flat", cap1="flat"))
        cutter.display_type = 'WIRE'
        cutter.hide_render = True
        boolean = leg.modifiers.new("Hueco", 'BOOLEAN')
        boolean.operation = 'DIFFERENCE'
        boolean.solver = 'EXACT'
        boolean.object = cutter
        add_bevel(leg, 0.045, segments=3)
        cutter.hide_set(True)


def build_hips(m):
    hips = mesh_object("MF_Cadera", *frustum_box(HIP_Z0, HIP_Z1, 1.0, 1.0, 0.43, 0.43), m["pantalon"])
    add_bevel(hips, 0.05, segments=4)


def pocket_outline():
    right = [(0.0, 2.64)]
    right += [tuple(p) for p in bezier2((0.46, 2.64), (0.65, 2.58), (0.70, 2.30), 10)]
    right += [(0.70, 2.08)]
    for a in np.linspace(0, -90, 6)[1:]:
        right.append((0.63 + 0.07 * math.cos(math.radians(a)), 2.08 + 0.07 * math.sin(math.radians(a))))
    right += [(0.0, 2.01)]
    left = [(-x, z) for x, z in reversed(right[1:-1])]
    return right + left


def hood_back():
    """Capucha caída sobre la espalda: escudo ancho arriba, en punta abajo, con costura central."""
    zc, rz = 3.25, 0.55
    verts, faces = ellipsoid((0.0, TORSO_HD - 0.02, zc), (0.92, 0.19, rz), nu=64, nv=32)
    out = []
    for x, y, z in verts:
        h = min(max((z - (zc - rz)) / (2 * rz), 0.0), 1.0)      # 0 abajo, 1 arriba
        x *= 0.45 + 0.55 * smoothstep(0.0, 0.75, h)
        if y > TORSO_HD:
            y -= 0.04 * math.exp(-(x / 0.04) ** 2)                # costura
        out.append((x, y, z))
    return out, faces


def build_torso(m):
    torso = mesh_object("MF_Torso", *frustum_box(TORSO_Z0, TORSO_Z1, TORSO_HW0, TORSO_HW1, TORSO_HD, TORSO_HD),
                        m["sudadera"])
    add_bevel(torso, 0.12, segments=6)

    z0, z1 = TORSO_Z0, TORSO_Z0 + 0.16
    hem = mesh_object("MF_Dobladillo", *frustum_box(z0, z1, torso_half_width(z0) + 0.016,
                                                    torso_half_width(z1) + 0.016, TORSO_HD + 0.016,
                                                    TORSO_HD + 0.016), m["sudadera"])
    add_bevel(hem, 0.035, segments=3)

    pocket = mesh_object("MF_Bolsillo", *prism(pocket_outline(), 'Y', -TORSO_HD + 0.015, -TORSO_HD - 0.035),
                         m["sudadera"])
    add_bevel(pocket, 0.014, segments=3)

    # Capucha: cuello enrollado alrededor del cuello + volumen caído en la espalda
    half = [(-0.06, -0.565, 3.25), (-0.26, -0.565, 3.44), (-0.50, -0.48, 3.60), (-0.68, -0.17, 3.69),
            (-0.66, 0.24, 3.73), (-0.42, 0.56, 3.75), (0.0, 0.67, 3.76)]
    ctrl = half + [(-x, y, z) for x, y, z in reversed(half[:-1])]
    pts, t, _ = resample(catmull_rom(ctrl, 14), 160)
    radii = 0.10 + 0.055 * np.sin(np.pi * t) ** 0.6
    hood = Geo().add(tube(pts, radii, nseg=20, squash=0.85))
    hood.add(hood_back())
    mesh_object("MF_Capucha", hood.verts, hood.faces, m["sudadera"], recalc=False)

    cords = Geo()
    y = -TORSO_HD - 0.032
    for s in (-1, 1):
        ctrl = [(s * 0.22, y - 0.07, 3.46), (s * 0.235, y - 0.03, 3.20), (s * 0.245, y - 0.003, 2.95),
                (s * 0.25, y, 2.84)]
        pts, _, _ = resample(catmull_rom(ctrl, 10), 40)
        cords.add(tube(pts, [0.026] * 40, nseg=10))
        aglet = [(s * 0.25, y, 2.86 - 0.13 * i / 4) for i in range(5)]
        cords.add(tube(aglet, [0.036] * 5, nseg=12))
    mesh_object("MF_Cordones", cords.verts, cords.faces, m["cordon"], recalc=False)


ARM_CTRL = [(0.62, 0.00, 3.36), (0.93, 0.00, 3.33), (1.18, 0.00, 3.02),
            (1.34, -0.06, 2.66), (1.42, -0.21, 2.38), (1.47, -0.32, 2.08)]


def build_arms(m):
    for s, tag in ((1, "L"), (-1, "R")):
        raw = catmull_rom([(s * x, y, z) for x, y, z in ARM_CTRL], 12)
        pts, t, length = resample(raw, 170)
        radii = np.interp(t, [0.0, 0.12, 0.35, 0.6, 0.8, 1.0], [0.26, 0.325, 0.35, 0.345, 0.33, 0.31])
        arc = t * length
        cuff_start = length - 0.28
        # Manga holgada que se frunce antes del puño
        folds = (arc > cuff_start - 0.40) & (arc <= cuff_start)
        radii = radii + np.where(folds, 0.022 * np.sin(np.pi * (arc - cuff_start + 0.40) / 0.20) ** 2, 0.0)
        ribs = 0.285 + 0.010 * np.cos(2 * np.pi * (arc - cuff_start) / 0.05)
        radii = np.where(arc > cuff_start, ribs, radii)
        mesh_object(f"MF_Brazo_{tag}", *tube(pts, radii, nseg=28, cap0="round", cap1="flat"), m["sudadera"],
                    recalc=False, sharp_angle=60)
        wrist = Vector(pts[-1])
        fdir = (Vector(pts[-1]) - Vector(pts[-12])).normalized()
        build_hand(f"MF_Mano_{tag}", s, wrist, fdir, m["piel"])


def build_hand(name, s, wrist, f, mat):
    """Mano en forma de C con perno de muñeca."""
    a0 = Vector((s * 0.6, -0.8, 0.0))   # eje del aro a medio camino entre frente y lateral
    axis = (a0 - f * a0.dot(f)).normalized()
    e1 = -f
    e1 = (e1 - axis * e1.dot(axis)).normalized()
    e2 = axis.cross(e1)
    psi = math.radians(75)
    sign = max((1, -1), key=lambda sg: (-s) * (e1 * math.cos(psi) + e2 * (sg * math.sin(psi))).x)
    gap = math.radians(70)
    a_start = sign * psi + gap / 2
    a_end = sign * psi + 2 * math.pi - gap / 2

    pin_len = 0.16
    center = wrist + f * (pin_len + 0.215)
    prof = rounded_rect(0.112, 0.252, -0.135, 0.135, 0.048, 4)
    steps = 40
    verts, faces, sections = [], [], []
    for i in range(steps + 1):
        ang = a_start + (a_end - a_start) * i / steps
        d = e1 * math.cos(ang) + e2 * math.sin(ang)
        idx = []
        for rr, hh in prof:
            verts.append(tuple(center + d * rr + axis * hh))
            idx.append(len(verts) - 1)
        sections.append(idx)
    k = len(prof)
    for A, B in zip(sections[:-1], sections[1:]):
        for j in range(k):
            j2 = (j + 1) % k
            faces.append((A[j], A[j2], B[j2], B[j]))
    faces.append(tuple(reversed(sections[0])))
    faces.append(tuple(sections[-1]))
    hand = Geo().add((verts, faces))
    p0, p1 = wrist - f * 0.08, wrist + f * (pin_len + 0.04)
    hand.add(tube([p0.lerp(p1, i / 6) for i in range(7)], [0.11] * 7, nseg=20, cap0="flat", cap1="flat"))
    mesh_object(name, hand.verts, hand.faces, mat, sharp_angle=50)


def build_body(m=None):
    m = m or make_materials()
    build_legs(m)
    build_hips(m)
    build_torso(m)
    build_arms(m)


# ════════════════════════════════════════════════════════════════════
#  Cabeza (bloque redondeado con orejas) y cara vectorizada de la referencia
# ════════════════════════════════════════════════════════════════════
def se_radius(dx, dy, a=HEAD_A, b=HEAD_B, n=HEAD_N):
    """Radio de la sección superelipse de la cabeza en la dirección unitaria (dx, dy)."""
    return 1.0 / ((abs(dx) / a) ** n + (abs(dy) / b) ** n) ** (1.0 / n)


def head_uv(x, y, z):
    """Proyección plana frontal para la cara (u∈[0.25, 0.75]); la nuca usa el resto de la textura."""
    v = min(max((z - HEAD_Z0) / (HEAD_Z1 - HEAD_Z0), 0.0), 1.0)
    q = min(max(x / HEAD_A, -1.0), 1.0)
    if y <= 0:
        u = 0.5 + q / 4
    elif x >= 0:
        u = 0.75 + (1 - q) / 4
    else:
        u = 0.25 - (1 + q) / 4
    return u, v


def head_rings():
    """Anillos (escala, z, tipo) de abajo arriba: 'c' círculo de radio escala, 's' superelipse escalada."""
    rf = 0.17
    rings = [(0.0, 3.50, 'c'), (NECK_R - 0.03, 3.50, 'c'), (NECK_R, 3.53, 'c'), (NECK_R, HEAD_Z0, 'c')]
    for a in np.linspace(-90, 0, 9):
        rings.append(((HEAD_A - rf + rf * math.cos(math.radians(a))) / HEAD_A,
                      HEAD_Z0 + rf + rf * math.sin(math.radians(a)), 's'))
    for z in np.linspace(HEAD_Z0 + rf, HEAD_Z1 - rf, 8)[1:-1]:
        rings.append((1.0, z, 's'))
    for a in np.linspace(0, 90, 9):
        rings.append(((HEAD_A - rf + rf * math.cos(math.radians(a))) / HEAD_A,
                      HEAD_Z1 - rf + rf * math.sin(math.radians(a)), 's'))
    rings += [(0.49, HEAD_Z1, 'c'), (0.48, HEAD_Z1 + 0.13, 'c'), (0.45, HEAD_Z1 + 0.16, 'c'), (0.0, HEAD_Z1 + 0.16, 'c')]
    return rings


def head_geometry(nseg=128):
    verts, idx_rings = [], []
    for scale, z, kind in head_rings():
        if scale < 1e-6:
            verts.append((0.0, 0.0, z))
            idx_rings.append([len(verts) - 1])
            continue
        idx = []
        for j in range(nseg):
            th = (j / nseg - 0.5) * 2 * math.pi - math.pi / 2
            dx, dy = math.cos(th), math.sin(th)
            r = scale * (se_radius(dx, dy) if kind == 's' else 1.0)
            verts.append((r * dx, r * dy, z))
            idx.append(len(verts) - 1)
        idx_rings.append(idx)
    faces = []
    for a, b in zip(idx_rings[:-1], idx_rings[1:]):
        for j in range(nseg):
            j2 = (j + 1) % nseg
            if len(a) == 1:
                faces.append((a[0], b[j2], b[j]))
            elif len(b) == 1:
                faces.append((a[j], a[j2], b[0]))
            else:
                faces.append((a[j], a[j2], b[j2], b[j]))
    uvs = []
    for f in faces:
        corner = [head_uv(*verts[i]) for i in f]
        us = [c[0] for c in corner]
        if max(us) - min(us) > 0.5:          # cara que cruza la costura de la nuca
            corner = [(u + 1.0 if u < 0.5 else u, v) for u, v in corner]
        uvs.extend(corner)
    return verts, faces, uvs


def ear(s):
    """Oreja: elipsoide aplastado con un cuenco interior, pegado al lateral de la cabeza."""
    cx, cy, cz, rx, ry, rz = s * 0.86, 0.03, HEAD_Z0 + 0.55, 0.12, 0.13, 0.24
    verts, faces = ellipsoid((cx, cy, cz), (rx, ry, rz), nu=32, nv=20)
    out = []
    for x, y, z in verts:
        rr = ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2
        if (x - cx) * s > 0 and rr < 0.55:
            x -= s * 0.07 * (1 - rr / 0.55) ** 1.5
        out.append((x, y, z))
    return out, faces


# Colores de la cara medidos en la referencia (sRGB)
FACE_BROW = hex_srgb("#211A14")
FACE_LID = hex_srgb("#140D0A")
FACE_IRIS_IN = hex_srgb("#5A3119")
FACE_IRIS_OUT = hex_srgb("#2E170B")
FACE_SCLERA = hex_srgb("#F7EBDF")
FACE_MOUTH = hex_srgb("#4A1608")
FACE_WHITE = (1.0, 1.0, 1.0)
# Labio inferior y pliegue del párpado: relación de color respecto a la piel en la referencia
LIP_RATIO = np.array(hex_srgb("#E58859")) / np.array(hex_srgb("#EFA870"))
CREASE_RATIO = np.array(hex_srgb("#DD9055")) / np.array(hex_srgb("#EFA870"))


def load_reference():
    img = bpy.data.images.load(REF_IMAGE, check_existing=False)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    return px.reshape(h, w, 4)[::-1, :, :3]          # filas desde arriba, valores sRGB


def cubic_matrix(n_src, coords):
    """Matriz de remuestreo Catmull-Rom: (len(coords) × n_src)."""
    i = np.floor(coords).astype(int)
    t = coords - i
    rows = np.arange(len(coords))
    M = np.zeros((len(coords), n_src), np.float32)
    for o in (-1, 0, 1, 2):
        x = np.abs(t - o)
        w = np.where(x < 1, 1.5 * x ** 3 - 2.5 * x ** 2 + 1,
                     np.where(x < 2, -0.5 * x ** 3 + 2.5 * x ** 2 - 4 * x + 2, 0.0))
        np.add.at(M, (rows, np.clip(i + o, 0, n_src - 1)), w)
    return M


def blur3(img):
    k = np.array([0.25, 0.5, 0.25], np.float32)
    out = img.copy()
    out[1:-1] = k[0] * img[:-2] + k[1] * img[1:-1] + k[2] * img[2:]
    tmp = out.copy()
    out[:, 1:-1] = k[0] * tmp[:, :-2] + k[1] * tmp[:, 1:-1] + k[2] * tmp[:, 2:]
    return out


def sd_stroke(points, radii):
    pts = np.asarray(points, float)
    rad = np.asarray(radii, float)

    def f(X, Z):
        d = np.full(np.broadcast(X, Z).shape, 1e9)
        for i in range(len(pts) - 1):
            ax, az = pts[i]
            vx, vz = pts[i + 1][0] - ax, pts[i + 1][1] - az
            t = np.clip(((X - ax) * vx + (Z - az) * vz) / (vx * vx + vz * vz + 1e-12), 0, 1)
            dist = np.hypot(X - (ax + t * vx), Z - (az + t * vz)) - (rad[i] + t * (rad[i + 1] - rad[i]))
            np.minimum(d, dist, out=d)
        return d
    return f


def sd_ellipse(cx, cz, a, b):
    def f(X, Z):
        dx, dz = X - cx, Z - cz
        k = np.sqrt((dx / a) ** 2 + (dz / b) ** 2) + 1e-9
        g = np.sqrt((dx / a ** 2) ** 2 + (dz / b ** 2) ** 2) / k + 1e-9
        return (k - 1) / g
    return f


def make_face_texture(width=4096, height=2048):
    """Textura de la cabeza: rasgos extraídos de la referencia y repintados con colores limpios."""
    hz = HEAD_Z1 - HEAD_Z0
    skin = np.array(hex_srgb(SKIN), np.float32)
    tex = np.empty((height, width, 3), np.float32)
    tex[:] = skin

    # Zona de la cara en la textura (X∈±0.78, Z∈[0.15, 1.15] sobre la base de la cabeza)
    i0, i1 = int(width * (0.5 - 0.78 / (4 * HEAD_A))), int(width * (0.5 + 0.78 / (4 * HEAD_A)))
    k0, k1 = int(height * 0.15 / hz), int(height * 1.15 / hz)
    X = ((np.arange(i0, i1) + 0.5) / width - 0.5) * 4 * HEAD_A
    Z = (np.arange(k0, k1) + 0.5) / height * hz
    Xg, Zg = X[None, :], Z[:, None]

    # Remuestreo bicúbico de la referencia a la resolución de la textura
    ref = load_reference()
    xs, ys = REF_CX + X * REF_SCALE, REF_CHIN_Y - Z * REF_SCALE
    x_lo, x_hi = int(xs.min()) - 3, int(xs.max()) + 4
    y_lo, y_hi = int(ys.min()) - 3, int(ys.max()) + 4
    crop = blur3(blur3(np.ascontiguousarray(ref[y_lo:y_hi, x_lo:x_hi])))
    Mx, My = cubic_matrix(crop.shape[1], xs - x_lo), cubic_matrix(crop.shape[0], ys - y_lo)
    up = np.clip(np.stack([My @ crop[..., c] @ Mx.T for c in range(3)], axis=-1), 0.0, 1.0)
    lum = up @ np.array([0.2126, 0.7152, 0.0722], np.float32)

    def below(v, t, w):
        return np.clip((t - v) / w + 0.5, 0.0, 1.0)

    def above(v, t, w):
        return np.clip((v - t) / w + 0.5, 0.0, 1.0)

    def box(x0, x1, z0, z1):
        return ((Xg >= x0) & (Xg <= x1) & (Zg >= z0) & (Zg <= z1)).astype(np.float32)

    eyes = box(-0.64, -0.04, 0.56, 0.89) + box(0.04, 0.64, 0.56, 0.89)
    brows = box(-0.70, -0.04, 0.89, 1.10) + box(0.04, 0.70, 0.89, 1.10)
    mouth = box(-0.42, 0.42, 0.22, 0.47)
    feat = below(lum, 0.40, 0.06)
    dark = below(lum, 0.135, 0.04)
    sclera = above(up[..., 2], 0.62, 0.08) * eyes

    face = np.empty(up.shape, np.float32)
    face[:] = skin

    def mix(mask, color):
        a = np.clip(mask, 0.0, 1.0)[..., None]
        face[:] = face * (1 - a) + np.asarray(color, np.float32) * a

    def stroke_cov(sdf, aa=0.0016):
        return np.clip(0.5 - sdf(Xg, Zg) / aa, 0.0, 1.0)

    # Pliegue fino sobre el párpado (parte interior de cada ojo)
    crease = skin * CREASE_RATIO
    for pts in (bezier2((-0.248, 0.866), (-0.19, 0.876), (-0.126, 0.846), 16),
                bezier2((0.186, 0.846), (0.24, 0.876), (0.292, 0.866), 16)):
        mix(stroke_cov(sd_stroke(pts, np.interp(np.linspace(0, 1, 16), [0, 0.5, 1], [0.003, 0.0055, 0.003]))) * 0.85,
            crease)

    # Ojos: blanco, iris con degradado, párpado/pupila y brillo
    mix(sclera, FACE_SCLERA)
    iris = feat * (1 - dark) * eyes
    for side in (-1, 1):
        sel = eyes * (np.sign(Xg) == side) * (Zg < 0.80) * feat
        w = sel.sum()
        cx, cz = (sel * Xg).sum() / w, (sel * Zg).sum() / w
        dist = np.hypot(Xg - cx, Zg - cz)
        g = np.clip((dist - 0.03) / 0.055, 0.0, 1.0)[..., None]
        iris_col = np.asarray(FACE_IRIS_IN) * (1 - g) + np.asarray(FACE_IRIS_OUT) * g
        a = (iris * (np.sign(Xg) == side))[..., None]
        face[:] = face * (1 - a) + iris_col * a
        hl = above(lum, 0.90, 0.05) * (dist < 0.075) * eyes
        mix(dark * eyes * (np.sign(Xg) == side), FACE_LID)
        mix(hl, FACE_WHITE)

    # Cejas
    mix(feat * brows, FACE_BROW)

    # Labio inferior (debajo de la línea de la boca) y boca
    sel = feat * mouth
    w = sel.sum()
    mx, mz = (sel * Xg).sum() / w, (sel * Zg).sum() / w
    mix(np.clip(0.5 - sd_ellipse(mx + 0.005, mz - 0.045, 0.118, 0.036)(Xg, Zg) / 0.004, 0, 1) * 0.8, skin * LIP_RATIO)
    mix(sel, FACE_MOUTH)

    tex[k0:k1, i0:i1] = face
    rgba = np.ones((height, width, 4), np.float32)
    rgba[..., :3] = tex
    old = bpy.data.images.get("MF_Cara")
    if old is not None:
        bpy.data.images.remove(old)
    img = bpy.data.images.new("MF_Cara", width, height, alpha=False)
    img.pixels.foreach_set(rgba.ravel())
    os.makedirs(TEX_DIR, exist_ok=True)
    img.filepath_raw = os.path.join(TEX_DIR, "cara_xesco.png")
    img.file_format = 'PNG'
    img.save()
    img.pack()
    return img


def head_material(img):
    mat, nt, bsdf = _principled("MF_Cara")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.location = (-350, 0)
    tex.image = img
    tex.interpolation = 'Cubic'
    tex.extension = 'EXTEND'
    uv = nt.nodes.new("ShaderNodeUVMap")
    uv.location = (-550, 0)
    uv.uv_map = "UVMap"
    nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.28
    mat.diffuse_color = hex_linear(SKIN)
    return mat


def build_head(m=None):
    m = m or make_materials()
    img = make_face_texture()
    verts, faces, uvs = head_geometry()
    head = mesh_object("MF_Cabeza", verts, faces, head_material(img), uvs=uvs, recalc=False, sharp_angle=45)
    ears = Geo().add(ear(1)).add(ear(-1))
    mesh_object("MF_Orejas", ears.verts, ears.faces, m["piel"], recalc=False)
    return head


# ════════════════════════════════════════════════════════════════════
#  Pelo rizado: casquete + cientos de rizos en espiral
# ════════════════════════════════════════════════════════════════════
HAIR_C = (0.0, 0.03, 4.78)
HAIR_R = (0.89, 0.92, 0.82)
ZB_BETA = [0, 30, 42, 55, 68, 80, 90, 100, 120, 150, 180]
ZB_Z = [5.00, 4.98, 4.90, 4.68, 4.54, 4.58, 4.62, 4.58, 4.32, 4.15, 4.10]


def hair_zb(beta_deg):
    return float(np.interp(abs(beta_deg), ZB_BETA, ZB_Z))


def hair_point(beta, elev):
    d = Vector((math.sin(beta) * math.cos(elev), -math.cos(beta) * math.cos(elev), math.sin(elev)))
    rx, ry, rz = HAIR_R
    p = Vector(HAIR_C) + d * (1.0 / math.sqrt((d.x / rx) ** 2 + (d.y / ry) ** 2 + (d.z / rz) ** 2))
    zb = hair_zb(math.degrees(math.atan2(p.x, -p.y)))
    rh = math.hypot(p.x, p.y)
    if rh > 1e-6:
        rmin = se_radius(p.x / rh, p.y / rh) + 0.04      # siempre por fuera de la cabeza
        if rh >= rmin:
            rh_new = rmin + (rh - rmin) * smoothstep(zb, zb + 0.45, p.z)
        else:
            rh_new = rmin if p.z < HEAD_Z1 else rh
        p.x *= rh_new / rh
        p.y *= rh_new / rh
    return p, zb


def hair_shell(nu=160, nv=90):
    elevs = np.radians(np.linspace(-70, 90, nv + 1))[:-1]
    verts, keep, grid = [], [], []
    for e in elevs:
        row = []
        for j in range(nu):
            beta = -math.pi + 2 * math.pi * j / nu
            p, zb = hair_point(beta, e)
            verts.append(tuple(p))
            keep.append(p.z >= zb - 0.005)
            row.append(len(verts) - 1)
        grid.append(row)
    verts.append((HAIR_C[0], HAIR_C[1], HAIR_C[2] + HAIR_R[2]))
    keep.append(True)
    top = len(verts) - 1
    faces, boundary = [], []
    for i in range(nv - 1):
        for j in range(nu):
            j2 = (j + 1) % nu
            q = (grid[i][j], grid[i][j2], grid[i + 1][j2], grid[i + 1][j])
            if all(keep[v] for v in q):
                faces.append(q)
    for j in range(nu):
        faces.append((grid[-1][j], grid[-1][(j + 1) % nu], top))
        for i in range(1, nv):
            if keep[grid[i][j]] and not keep[grid[i - 1][j]]:
                boundary.append(grid[i][j])
                break
    return np.array(verts), faces, boundary


def curl_proto(radius, turns, rise, tube_r, nseg=8):
    n = max(int(turns * 22), 8)
    t = np.linspace(0.0, 1.0, n)
    ang = 2 * np.pi * turns * t
    pts = np.stack([radius * np.cos(ang), radius * np.sin(ang), rise * (t - 0.5)], 1)
    radii = tube_r * (0.72 + 0.28 * np.sin(np.pi * t))
    verts, faces = tube(pts, radii, nseg=nseg, cap0="round", cap1="round", cap_rings=2)
    quads = np.array([f for f in faces if len(f) == 4])
    tris = np.array([f for f in faces if len(f) == 3])
    return np.array(verts), quads, tris


def instance(proto, frames, positions, scales):
    V, quads, tris = proto
    W = np.einsum('nij,vj->nvi', frames, V) * scales[:, None, None] + positions[:, None, :]
    offs = (np.arange(len(positions)) * len(V))[:, None, None]
    faces = (quads[None] + offs).reshape(-1, 4).tolist() + (tris[None] + offs).reshape(-1, 3).tolist()
    return W.reshape(-1, 3), faces


def frames_from_normals(normals, tilts, spins, rng):
    n = normals / np.linalg.norm(normals, axis=1)[:, None]
    rnd = rng.normal(size=n.shape)
    t1 = np.cross(n, rnd)
    t1 /= np.linalg.norm(t1, axis=1)[:, None]
    t2 = np.cross(n, t1)
    z = n * np.cos(tilts)[:, None] + t1 * np.sin(tilts)[:, None]
    x = t2 * np.cos(spins)[:, None] + np.cross(z, t2) * np.sin(spins)[:, None]
    y = np.cross(z, x)
    return np.stack([x, y, z], axis=-1)


def poisson_filter(points, dmin):
    grid, keep, d2 = {}, [], dmin * dmin
    pts = [tuple(p) for p in points]
    for i, (px, py, pz) in enumerate(pts):
        cx, cy, cz = int(px // dmin), int(py // dmin), int(pz // dmin)
        ok = True
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    for j in grid.get((cx + dx, cy + dy, cz + dz), ()):
                        qx, qy, qz = pts[j]
                        if (px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2 < d2:
                            ok = False
                            break
                    if not ok:
                        break
                if not ok:
                    break
            if not ok:
                break
        if ok:
            keep.append(i)
            grid.setdefault((cx, cy, cz), []).append(i)
    return np.array(keep, dtype=int)


def build_hair(m=None, seed=7, spacing=0.13):
    m = m or make_materials()
    rng = np.random.default_rng(seed)
    V, faces, boundary = hair_shell()
    base = mesh_object("MF_Pelo_Base", V, faces, m["pelo_base"], recalc=False)
    sol = base.modifiers.new("Grosor", 'SOLIDIFY')
    sol.thickness = 0.04
    sol.offset = -1.0
    geo_v, geo_f, count = [], [], 0

    # Muestreo uniforme (por área) de puntos sobre el casquete
    quads = np.array([f for f in faces if len(f) == 4])
    tri = np.concatenate([quads[:, [0, 1, 2]], quads[:, [0, 2, 3]]])
    A, B, C = V[tri[:, 0]], V[tri[:, 1]], V[tri[:, 2]]
    cr = np.cross(B - A, C - A)
    area = 0.5 * np.linalg.norm(cr, axis=1)
    normals = cr / (2 * area[:, None] + 1e-12)
    samples = 14000
    idx = rng.choice(len(tri), size=samples, p=area / area.sum())
    r1, r2 = np.sqrt(rng.random(samples)), rng.random(samples)
    P = (1 - r1)[:, None] * A[idx] + (r1 * (1 - r2))[:, None] * B[idx] + (r1 * r2)[:, None] * C[idx]
    Nn = normals[idx]
    outward = P - np.array([0.0, 0.03, 4.55])
    Nn[np.einsum('ij,ij->i', Nn, outward) < 0] *= -1
    keep = poisson_filter(P, spacing)
    P, Nn = P[keep], Nn[keep]
    k = len(P)

    # Rizos gruesos y apretados (radio del tubo ≈ radio de la espiral, sin hueco central)
    protos = {
        "espiral": curl_proto(0.068, 1.5, 0.12, 0.066, nseg=10),
        "c": curl_proto(0.080, 0.95, 0.06, 0.068, nseg=10),
    }
    kind = rng.random(k)
    groups = {
        "plano": (kind < 0.5, "espiral", (0.0, 0.5), 0.0),
        "de_pie": ((kind >= 0.5) & (kind < 0.82), "espiral", (0.95, 1.45), 0.03),
        "c": (kind >= 0.82, "c", (0.0, 0.7), 0.015),
    }
    # Rizos algo más grandes arriba que en los bordes
    height = np.clip((P[:, 2] - 4.3) / 1.3, 0.0, 1.0)
    size = 0.85 + 0.30 * height
    for mask, proto, (t0, t1), lift in groups.values():
        n = int(mask.sum())
        if not n:
            continue
        frames = frames_from_normals(Nn[mask], rng.uniform(t0, t1, n), rng.uniform(0, 2 * np.pi, n), rng)
        pos = P[mask] + Nn[mask] * lift
        verts, fcs = instance(protos[proto], frames, pos, size[mask] * rng.uniform(0.9, 1.15, n))
        geo_v.append(verts)
        geo_f.extend([[i + count for i in f] for f in fcs])
        count += len(verts)

    # Tirabuzones colgando del borde inferior (nuca y laterales, dejando libres las orejas)
    ringlet = curl_proto(0.052, 1.9, 0.22, 0.054, nseg=10)
    bpts = V[np.array(boundary)]
    beta = np.abs(np.degrees(np.arctan2(bpts[:, 0], -bpts[:, 1])))
    sel = (beta > 52) & ((beta < 70) | (beta > 112)) & (rng.random(len(bpts)) < 0.55)
    bpts = bpts[sel]
    if len(bpts):
        radial = bpts.copy()
        radial[:, 2] = 0
        radial /= np.linalg.norm(radial, axis=1)[:, None]
        down = np.tile(np.array([0.0, 0.0, -1.0]), (len(bpts), 1))
        spins = rng.uniform(0, 2 * np.pi, len(bpts))
        x = radial * np.cos(spins)[:, None] + np.cross(down, radial) * np.sin(spins)[:, None]
        frames = np.stack([x, np.cross(down, x), down], axis=-1)
        scales = rng.uniform(0.85, 1.15, len(bpts))
        pos = bpts + radial * 0.05 + down * (0.06 * scales)[:, None]
        verts, fcs = instance(ringlet, frames, pos, scales)
        geo_v.append(verts)
        geo_f.extend([[i + count for i in f] for f in fcs])

    return mesh_object("MF_Pelo", np.concatenate(geo_v), geo_f, m["pelo"], recalc=False)


# ════════════════════════════════════════════════════════════════════
#  Estudio: suelo, luces, fondo y cámaras de cada vista
# ════════════════════════════════════════════════════════════════════
def area_light(name, loc, target, power, size, shadow=True):
    remove_object(name)
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.size = size
    data.use_shadow = shadow
    if hasattr(data, "use_shadow_jitter"):
        data.use_shadow_jitter = True
    ob = bpy.data.objects.new(name, data)
    get_collection(COLL_STUDIO).objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


def camera(name, loc, target, lens=70.0):
    remove_object(name)
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_fit = 'VERTICAL'
    data.sensor_height = 24.0
    data.clip_start = 0.1
    data.clip_end = 300.0
    ob = bpy.data.objects.new(name, data)
    get_collection(COLL_STUDIO).objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


VIEWS = {
    # nombre: (cámara, posición, objetivo, resolución)
    "frontal": ("CAM_Frontal", (0.0, -19.4, 3.2), (0.0, 0.0, 2.9), (1000, 1500)),
    "trasera": ("CAM_Trasera", (0.0, 19.4, 3.2), (0.0, 0.0, 2.9), (1000, 1500)),
    "lado_izquierdo": ("CAM_Izquierda", (19.4, 0.0, 3.2), (0.0, 0.0, 2.9), (1000, 1500)),
    "lado_derecho": ("CAM_Derecha", (-19.4, 0.0, 3.2), (0.0, 0.0, 2.9), (1000, 1500)),
    "cara": ("CAM_Cara", (0.0, -8.2, 4.78), (0.0, 0.0, 4.74), (1200, 900)),
}


def build_studio(world_light=0.45):
    for name in ("Cube", "Light", "Camera"):
        remove_object(name)
    sc = bpy.context.scene

    # Suelo que solo recoge sombras: el fondo del render queda transparente
    floor_mat = plastic("MF_Suelo", "#FFFFFF", rough=0.9, spec=0.2)
    floor = mesh_object("MF_Suelo", [(-60, -60, -0.002), (60, -60, -0.002), (60, 60, -0.002), (-60, 60, -0.002)],
                        [(0, 1, 2, 3)], floor_mat, recalc=False, coll=COLL_STUDIO, parent=False)
    floor.is_shadow_catcher = True

    # Solo la luz principal (alta) proyecta sombra: queda una sombra suave pegada a los pies
    area_light("LUZ_Principal", (-4.5, -6.5, 11.5), (0.0, 0.0, 2.8), 1000, 6.0)
    area_light("LUZ_Relleno", (8.0, -5.0, 4.5), (0.0, 0.0, 2.8), 180, 7.0, shadow=False)
    area_light("LUZ_Contra", (2.0, 9.0, 8.5), (0.0, 0.0, 3.5), 350, 5.0, shadow=False)

    world = sc.world or bpy.data.worlds.new("World")
    sc.world = world
    if world.node_tree is None:
        world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    lit = nt.nodes.new("ShaderNodeBackground")
    lit.inputs["Strength"].default_value = world_light
    seen = nt.nodes.new("ShaderNodeBackground")
    seen.inputs["Strength"].default_value = 1.0
    for bg in (lit, seen):
        bg.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    path = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(lit.outputs["Background"], mix.inputs[1])
    nt.links.new(seen.outputs["Background"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    for cam_name, loc, target, _ in VIEWS.values():
        camera(cam_name, loc, target)
    sc.camera = bpy.data.objects["CAM_Frontal"]

    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = 128
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.02
    cy.use_denoising = True
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.max_bounces = 6
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 3
    cy.transmission_bounces = 0
    cy.volume_bounces = 0
    cy.transparent_max_bounces = 4
    sc.render.film_transparent = True
    try:
        sc.view_settings.view_transform = 'Khronos PBR Neutral'
    except TypeError:
        sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0


def render_view(view, samples=128, suffix="", percent=100):
    cam_name, _, _, (rx, ry) = VIEWS[view]
    sc = bpy.context.scene
    sc.camera = bpy.data.objects[cam_name]
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    sc.render.resolution_percentage = percent
    sc.cycles.samples = samples
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    os.makedirs(RENDER_DIR, exist_ok=True)
    sc.render.filepath = os.path.join(RENDER_DIR, f"{view}{suffix}.png")
    bpy.ops.render.render(write_still=True)
    fade_shadow_edges(sc.render.filepath)
    return sc.render.filepath


def fade_shadow_edges(path, border=0.08):
    """Desvanece la sombra del suelo (píxeles negros semitransparentes) cerca de los bordes de la imagen,
    para que al componer sobre blanco no se noten los límites del render."""
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    bx, by = border * w, border * h
    xs, ys = np.arange(w) + 0.5, np.arange(h) + 0.5
    fx = np.clip(np.minimum(xs, w - xs) / bx, 0.0, 1.0)
    fy = np.clip(np.minimum(ys, h - ys) / by, 0.0, 1.0)
    edge = (fy[:, None] * fx[None, :]) ** 1.5
    shadow = (px[..., :3].max(axis=2) < 0.02) & (px[..., 3] < 0.98)
    px[..., 3] = np.where(shadow, px[..., 3] * edge, px[..., 3])
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


def queue_renders(views=("frontal", "trasera", "lado_izquierdo", "lado_derecho", "cara"), samples=56,
                  body_percent=80):
    """Encola los renders en un temporizador de Blender para no bloquear al cliente MCP.
    El progreso queda en bpy.app.driver_namespace["mf_render_state"]."""
    state = {"pending": list(views), "done": [], "error": None}

    def job():
        if not state["pending"]:
            bpy.ops.wm.save_mainfile()
            return None
        view = state["pending"].pop(0)
        try:
            render_view(view, samples=samples, percent=100 if view == "cara" else body_percent)
            state["done"].append(view)
        except Exception as ex:  # se informa en el estado y se sigue con la cola
            state["error"] = f"{view}: {ex}"
        return 0.2

    bpy.app.driver_namespace["mf_render_state"] = state
    bpy.app.timers.register(job, first_interval=1.0)
    return state


def setup_viewport():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type != 'VIEW_3D':
                continue
            space = area.spaces.active
            space.shading.type = 'MATERIAL'
            r3d = space.region_3d
            r3d.view_perspective = 'PERSP'
            r3d.view_location = (0.0, 0.0, 2.9)
            r3d.view_distance = 15.0
            r3d.view_rotation = Euler((math.radians(82), 0.0, math.radians(-28))).to_quaternion()


def build_all():
    m = make_materials()
    build_studio()
    build_body(m)
    build_head(m)
    build_hair(m)
    setup_viewport()
