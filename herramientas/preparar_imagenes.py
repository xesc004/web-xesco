"""Prepara las imágenes de la web (WebP) a partir del material original, que solo se lee.

Se ejecuta dentro de Blender 5.1 a través del MCP:

    import sys, importlib
    sys.path.insert(0, r"C:/Users/xesco/OneDrive/Escritorio/web-xesco/herramientas")
    import preparar_imagenes; importlib.reload(preparar_imagenes)
    preparar_imagenes.todo()
"""
import os
import tempfile
import zipfile

import bpy
import numpy as np

WEB = r"C:/Users/xesco/OneDrive/Escritorio/web-xesco"
IMG = os.path.join(WEB, "img")
FOTO = os.path.join(WEB, "material", "foto_xesco.jpg")
NEURONA_FOTOGRAMAS = os.path.join(WEB, "material", "una-neurona")

ICONOS = {
    "aldiax": r"C:/dev/aldiax/video/assets/icono.png",
    "yunque": r"C:/dev/yunque/assets/icon.png",
    "chatadn": r"C:/Users/xesco/ChatADN/mobile/assets/images/icon.png",
    "una-neurona": r"C:/Users/xesco/Lumiq/brand/originals/icon.png",
}
CHATADN = r"C:/Users/xesco/ChatADN/mobile/store-screenshots/exports/png/ios/iphone/1284x2778/es"
CAPTURAS = {
    "aldiax": [
        r"C:/dev/aldiax/video/assets/pantallas/inicio.png",
        r"C:/dev/aldiax/video/assets/pantallas/l-3-correcto.png",
        r"C:/dev/aldiax/video/horizontal/assets/pantallas/06-noticias.jpg",
    ],
    "chatadn": [os.path.join(CHATADN, n) for n in ("01-device-bottom.png", "02-two-devices.png", "03-device-top.png")],
    "una-neurona": [os.path.join(NEURONA_FOTOGRAMAS, n) for n in ("sala.png", "minijuegos.png", "resultado.png")],
}
YUNQUE_ZIP = r"C:/dev/yunque-app-store-captures/yunque-app-store-export.zip"
YUNQUE_EN_ZIP = [f"ios/iphone/1320x2868/es/{n}" for n in ("01-hero.png", "02-device-bottom.png", "03-device-bottom.png")]
NEURONA_MASCOTA = r"C:/Users/xesco/Lumiq/brand/originals/neurona.png"


def cargar(ruta):
    """Píxeles como array (alto, ancho, 4) con las filas de abajo arriba (convención de Blender)."""
    img = bpy.data.images.load(ruta, check_existing=False)
    ancho, alto = img.size
    px = np.empty(ancho * alto * 4, np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    return px.reshape(alto, ancho, 4)


def _escalar_blender(px, ancho, alto):
    h, w = px.shape[:2]
    img = bpy.data.images.new("tmp_escala", w, h, alpha=True)
    img.pixels.foreach_set(px.ravel())
    img.scale(ancho, alto)
    out = np.empty(ancho * alto * 4, np.float32)
    img.pixels.foreach_get(out)
    bpy.data.images.remove(img)
    return out.reshape(alto, ancho, 4)


def reducir(px, alto=None, ancho=None):
    """Reduce con promedios 2×2 mientras sobre al menos el doble y termina con el escalado de Blender."""
    h, w = px.shape[:2]
    if alto is None:
        alto = round(h * ancho / w)
    if ancho is None:
        ancho = round(w * alto / h)
    while px.shape[0] >= 2 * alto and px.shape[1] >= 2 * ancho:
        h2, w2 = px.shape[0] // 2 * 2, px.shape[1] // 2 * 2
        p = px[:h2, :w2]
        px = (p[0::2, 0::2] + p[1::2, 0::2] + p[0::2, 1::2] + p[1::2, 1::2]) / 4
    return _escalar_blender(np.ascontiguousarray(px, np.float32), ancho, alto)


def guardar_webp(px, ruta, calidad=85):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    h, w = px.shape[:2]
    img = bpy.data.images.new("tmp_webp", w, h, alpha=True)
    img.pixels.foreach_set(np.ascontiguousarray(px, np.float32).ravel())
    img.filepath_raw = ruta
    img.file_format = 'WEBP'
    img.save(quality=calidad)
    bpy.data.images.remove(img)
    return os.path.getsize(ruta)


def foto():
    px = cargar(FOTO)
    alto = px.shape[0]
    x0, y0, lado = 65, 378, 860  # recorte cuadrado (coordenadas desde arriba): de la cabeza a los hombros, cara centrada
    recorte = px[alto - (y0 + lado):alto - y0, x0:x0 + lado]
    return guardar_webp(reducir(recorte, 480, 480), os.path.join(IMG, "foto", "xesco.webp"), 88)


def iconos():
    return {app: guardar_webp(reducir(cargar(ruta), 256, 256), os.path.join(IMG, "apps", app, "icono.webp"), 90)
            for app, ruta in ICONOS.items()}


def capturas():
    tamanos = {}
    with tempfile.TemporaryDirectory() as tmp:
        rutas_yunque = []
        with zipfile.ZipFile(YUNQUE_ZIP) as z:
            for i, nombre in enumerate(YUNQUE_EN_ZIP, 1):
                destino = os.path.join(tmp, f"yunque-{i}.png")
                with z.open(nombre) as origen, open(destino, "wb") as f:
                    f.write(origen.read())
                rutas_yunque.append(destino)
        for app, rutas in dict(CAPTURAS, yunque=rutas_yunque).items():
            for i, ruta in enumerate(rutas, 1):
                destino = os.path.join(IMG, "apps", app, f"captura-{i}.webp")
                tamanos[f"{app}/{i}"] = guardar_webp(reducir(cargar(ruta), alto=600), destino, 82)
    return tamanos


def mascota_neurona():
    return guardar_webp(reducir(cargar(NEURONA_MASCOTA), ancho=360),
                        os.path.join(IMG, "apps", "una-neurona", "neurona.webp"), 88)


def todo():
    return {"foto": foto(), "iconos": iconos(), "capturas": capturas(), "neurona": mascota_neurona()}
