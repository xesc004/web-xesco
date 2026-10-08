"""Genera la hoja de animaciones (sprites) de la minifigura para la web.

Se ejecuta dentro de Blender 5.1 con minifigura_xesco.blend abierto (vía MCP):

    import sys, importlib
    sys.path.insert(0, r"C:/Users/xesco/OneDrive/Escritorio/web-xesco/minifigura/scripts")
    import mf_sprites; importlib.reload(mf_sprites)
    mf_sprites.preparar()          # pivotes, cámara y ajustes de render
    mf_sprites.encolar_render()    # renderiza los 40 fotogramas en segundo plano
    mf_sprites.empaquetar()        # cuando acabe: hoja WebP + sprites.json en img/personaje/
    mf_sprites.restaurar()         # deja la escena como estaba (Cycles, cámara frontal) y guarda
"""
import json
import math
import os

import bpy
import numpy as np
from mathutils import Vector

WEB = r"C:/Users/xesco/OneDrive/Escritorio/web-xesco"
DIR_FOTOGRAMAS = os.path.join(WEB, "minifigura", "sprites")
DIR_SALIDA = os.path.join(WEB, "img", "personaje")
TAM = 320          # píxeles por fotograma (se muestra a 160 unidades)
COLUMNAS = 8
PIE = 6            # unidades entre el borde inferior del fotograma y los pies
CAMARA = "CAM_Sprites"
CLAVE_RUTA_RENDER = "mf_sprites_ruta_render"   # ruta de salida original, para restaurarla

# Pivote (posición en el espacio de MF_Raiz) y piezas que gira cada uno
PIVOTES = {
    "PIV_Pierna_L": ((0.51, 0.0, 1.50), ("MF_Pierna_L", "MF_Cortador_L")),
    "PIV_Pierna_R": ((-0.51, 0.0, 1.50), ("MF_Pierna_R", "MF_Cortador_R")),
    "PIV_Brazo_L": ((0.93, 0.0, 3.33), ("MF_Brazo_L", "MF_Mano_L")),
    "PIV_Brazo_R": ((-0.93, 0.0, 3.33), ("MF_Brazo_R", "MF_Mano_R")),
}


def _ciclo(n):
    return [2 * math.pi * i / n for i in range(n)]


def animaciones():
    """(nombre, fps, bucle, poses). Ángulos en grados; negativo = pie o mano hacia delante (−Y)."""
    return [
        ("parado", 3, True, [dict(giro=8, brazos=(-6, -6), altura=0.012 * math.sin(f)) for f in _ciclo(4)]),
        ("saludar", 10, False, [dict(giro=10, brazos=(-150 + 16 * math.sin(f), -6)) for f in _ciclo(8)]),
        ("giro", 30, False, [dict(giro=g) for g in (20, 34, 46)]),
        ("andar", 12, True, [dict(giro=50, piernas=(28 * math.sin(f), -28 * math.sin(f)),
                                  brazos=(-24 * math.sin(f), 24 * math.sin(f)), altura=0.03 * abs(math.cos(f)),
                                  apoyar=True)
                             for f in _ciclo(8)]),
        ("saltar", 8, False, [dict(giro=50, piernas=(-34, 24), brazos=(-150, -40), apoyar=True),
                              dict(giro=50, piernas=(-30, 20), brazos=(-160, -50), apoyar=True)]),
        ("caer", 6, True, [dict(giro=50, piernas=(-14, 14), brazos=(-120, -110), apoyar=True),
                           dict(giro=50, piernas=(-18, 18), brazos=(-126, -104), apoyar=True)]),
        ("aterrizar", 1, False, [dict(giro=50, brazos=(-20, -20))]),
        ("colgado", 8, True, [dict(giro=14, piernas=(18 * math.sin(f), -18 * math.sin(f)), brazos=(-172, -172))
                              for f in _ciclo(6)]),
        ("celebrar", 8, True, [dict(giro=0, brazos=(-165 + 15 * math.sin(f), -165 - 15 * math.sin(f)),
                                    altura=0.18 * abs(math.sin(f))) for f in _ciclo(6)]),
    ]


def _z_min_piernas():
    """Altura mínima (mundo) de las piernas ya evaluadas (con el hueco y el bisel)."""
    dg = bpy.context.evaluated_depsgraph_get()
    z = math.inf
    for nombre in ("MF_Pierna_L", "MF_Pierna_R"):
        ob = bpy.data.objects[nombre].evaluated_get(dg)
        me = ob.to_mesh()
        co = np.empty(len(me.vertices) * 3, np.float32)
        me.vertices.foreach_get("co", co)
        ob.to_mesh_clear()
        m = np.array(ob.matrix_world, np.float32)
        z = min(z, float((co.reshape(-1, 3) @ m[:3, :3].T + m[:3, 3])[:, 2].min()))
    return z


def aplicar_pose(giro=0.0, piernas=(0.0, 0.0), brazos=(0.0, 0.0), altura=0.0, apoyar=False):
    """apoyar: sube el cuerpo lo que se hunda la puntera de la pierna trasera (piernas rígidas al andar)."""
    raiz = bpy.data.objects["MF_Raiz"]
    raiz.rotation_euler = (0.0, 0.0, math.radians(giro))
    raiz.location = (0.0, 0.0, 0.0 if apoyar else altura)
    for nombre, angulo in (("PIV_Pierna_L", piernas[0]), ("PIV_Pierna_R", piernas[1]),
                           ("PIV_Brazo_L", brazos[0]), ("PIV_Brazo_R", brazos[1])):
        bpy.data.objects[nombre].rotation_euler = (math.radians(angulo), 0.0, 0.0)
    bpy.context.view_layer.update()
    if apoyar:
        raiz.location = (0.0, 0.0, altura + max(0.0, -_z_min_piernas()))
        bpy.context.view_layer.update()


def _camara():
    cam = bpy.data.objects.get(CAMARA)
    if cam is None:
        cam = bpy.data.objects.new(CAMARA, bpy.data.cameras.new(CAMARA))
        bpy.data.collections["Estudio"].objects.link(cam)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 6.4
    cam.data.clip_start = 0.1
    cam.data.clip_end = 100.0
    objetivo = Vector((0.0, 0.0, 2.95))
    direccion = Vector((0.0, 1.0, -math.tan(math.radians(6)))).normalized()
    cam.location = objetivo - direccion * 30.0
    cam.rotation_euler = direccion.to_track_quat('-Z', 'Y').to_euler()
    return cam


def preparar():
    # Se guarda una sola vez la ruta de render original: los renders de sprites la sobrescriben
    bpy.app.driver_namespace.setdefault(CLAVE_RUTA_RENDER, bpy.context.scene.render.filepath)
    # Pose de reposo sin aplicar_pose(): la primera vez los pivotes aún no existen (cada uno se pone a cero abajo)
    raiz = bpy.data.objects["MF_Raiz"]
    raiz.rotation_euler = (0.0, 0.0, 0.0)
    raiz.location = (0.0, 0.0, 0.0)
    for nombre, (posicion, hijos) in PIVOTES.items():
        piv = bpy.data.objects.get(nombre)
        if piv is None:
            piv = bpy.data.objects.new(nombre, None)
            piv.empty_display_type = 'SPHERE'
            piv.empty_display_size = 0.15
            bpy.data.collections["Minifigura"].objects.link(piv)
        piv.parent = raiz
        piv.matrix_parent_inverse.identity()
        piv.location = posicion
        piv.rotation_euler = (0.0, 0.0, 0.0)
        bpy.context.view_layer.update()
        for hijo in hijos:
            ob = bpy.data.objects[hijo]
            if ob.parent == piv:
                continue
            mundo = ob.matrix_world.copy()
            ob.parent = piv
            ob.matrix_parent_inverse = piv.matrix_world.inverted()
            ob.matrix_world = mundo
    sc = bpy.context.scene
    sc.camera = _camara()
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 32
    sc.render.resolution_x = TAM
    sc.render.resolution_y = TAM
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    bpy.data.objects["MF_Suelo"].hide_render = True
    bpy.context.view_layer.update()
    return sorted(PIVOTES)


def encolar_render():
    os.makedirs(DIR_FOTOGRAMAS, exist_ok=True)
    trabajos = [(f"{nombre}_{i:02d}", pose) for nombre, _, _, poses in animaciones() for i, pose in enumerate(poses)]
    estado = {"pendientes": trabajos, "hechos": 0, "total": len(trabajos), "error": None}

    def siguiente():
        if not estado["pendientes"]:
            aplicar_pose()
            return None
        nombre, pose = estado["pendientes"].pop(0)
        try:
            aplicar_pose(**pose)
            bpy.context.scene.render.filepath = os.path.join(DIR_FOTOGRAMAS, nombre + ".png")
            bpy.ops.render.render(write_still=True)
            estado["hechos"] += 1
        except Exception as ex:  # se informa en el estado y se sigue con la cola
            estado["error"] = f"{nombre}: {ex}"
        return 0.05

    bpy.app.driver_namespace["mf_sprites_estado"] = estado
    bpy.app.timers.register(siguiente, first_interval=0.5)
    return estado["total"]


def empaquetar():
    anims = animaciones()
    total = sum(len(poses) for _, _, _, poses in anims)
    filas = math.ceil(total / COLUMNAS)
    hoja = np.zeros((filas * TAM, COLUMNAS * TAM, 4), np.float32)   # filas de abajo arriba (Blender)
    meta = {"imagen": "muneco.webp", "fotograma": 160, "columnas": COLUMNAS, "filas": filas, "pie": PIE,
            "animaciones": {}}
    indice = 0
    for nombre, fps, bucle, poses in anims:
        meta["animaciones"][nombre] = {"inicio": indice, "n": len(poses), "fps": fps, "bucle": bucle}
        for i in range(len(poses)):
            img = bpy.data.images.load(os.path.join(DIR_FOTOGRAMAS, f"{nombre}_{i:02d}.png"), check_existing=False)
            px = np.empty(TAM * TAM * 4, np.float32)
            img.pixels.foreach_get(px)
            bpy.data.images.remove(img)
            columna, fila = indice % COLUMNAS, indice // COLUMNAS
            y0 = (filas - 1 - fila) * TAM
            hoja[y0:y0 + TAM, columna * TAM:(columna + 1) * TAM] = px.reshape(TAM, TAM, 4)
            indice += 1
    os.makedirs(DIR_SALIDA, exist_ok=True)
    img = bpy.data.images.new("MF_Sprites", COLUMNAS * TAM, filas * TAM, alpha=True)
    img.pixels.foreach_set(hoja.ravel())
    img.filepath_raw = os.path.join(DIR_SALIDA, "muneco.webp")
    img.file_format = 'WEBP'
    img.save(quality=88)
    bpy.data.images.remove(img)
    with open(os.path.join(DIR_SALIDA, "sprites.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    return {"fotogramas": indice, "bytes_webp": os.path.getsize(os.path.join(DIR_SALIDA, "muneco.webp"))}


def restaurar():
    aplicar_pose()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.camera = bpy.data.objects["CAM_Frontal"]
    sc.render.resolution_x, sc.render.resolution_y = 1000, 1500
    sc.render.filepath = bpy.app.driver_namespace.get(CLAVE_RUTA_RENDER, sc.render.filepath)
    bpy.data.objects["MF_Suelo"].hide_render = False
    bpy.ops.wm.save_mainfile()
    return bpy.data.filepath
