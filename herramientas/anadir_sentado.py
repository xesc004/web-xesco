"""Añade la animación «sentado» a la hoja de sprites sin volver a renderizar las demás.

Los fotogramas se renderizan con minifigura/scripts/mf_sprites.py (pose «sentado»). Si el modelo se reconstruyó
sin la foto de referencia (la cara sale lisa), --cara-lisa indica el render de «parado» con esa misma cara lisa:
la cara se copia entonces del primer fotograma de la hoja, que tiene la misma cabeza y el mismo giro.

    python3 herramientas/anadir_sentado.py DIR_FOTOGRAMAS [--cara-lisa parado_plano.png]

DIR_FOTOGRAMAS contiene sentado_00.png … sentado_NN.png (320 × 320, RGBA).
"""
import argparse
import json
import os
import re

import numpy as np
from PIL import Image, ImageFilter

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOJA = os.path.join(WEB, "img", "personaje", "muneco.webp")
META = os.path.join(WEB, "img", "personaje", "sprites.json")
TAM = 320
PIEL = np.array([0xED, 0xA6, 0x70], np.float32)


def leer(ruta):
    return np.array(Image.open(ruta).convert("RGBA")).astype(np.float32)


def mascara_cara(lisa):
    """Piel de la cara en el render liso (sin pelo ni sudadera), con el borde suavizado."""
    rgb = lisa[..., :3]
    proporcion = rgb / np.maximum(rgb.sum(axis=2, keepdims=True), 1)
    piel = (np.abs(proporcion - PIEL / PIEL.sum()).sum(axis=2) < 0.06) & (lisa[..., 3] > 250) & (rgb.sum(axis=2) > 250)
    zona = np.zeros_like(piel)
    zona[55:122, 95:225] = True
    m = Image.fromarray(((piel & zona) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    return np.array(m).astype(np.float32) / 255 * (lisa[..., 3] > 250)


def desplazamiento(lisa, fotograma):
    """Cuánto ha bajado la cabeza: se busca dónde encaja el pelo del render de pie."""
    errores = [np.abs(lisa[15:60] - fotograma[15 + dy:60 + dy]).mean() for dy in range(0, TAM - 60)]
    return int(np.argmin(errores))


def poner_cara(fotograma, lisa, cara, mascara):
    dy = desplazamiento(lisa, fotograma)
    m = np.zeros_like(mascara)
    m[dy:] = mascara[:TAM - dy]
    origen = np.zeros_like(cara)
    origen[dy:] = cara[:TAM - dy]
    salida = fotograma.copy()
    salida[..., :3] = fotograma[..., :3] * (1 - m[..., None]) + origen[..., :3] * m[..., None]
    return salida


def altura_pelo(fotograma):
    """Fila (a 160 de alto) donde empieza el pelo: la usa la bandana para colocarse."""
    f = np.array(Image.fromarray(fotograma.astype(np.uint8)).resize((160, 160), Image.LANCZOS)).astype(int)
    r, g, b, a = (f[:, 45:115, i] for i in range(4))
    pelo = (a > 128) & (r < 130) & (g < 100) & (b < 80) & (r >= b)
    return int(np.nonzero(pelo[:120].any(axis=1))[0].min())


def main():
    p = argparse.ArgumentParser()
    p.add_argument("dir")
    p.add_argument("--cara-lisa")
    args = p.parse_args()
    nombres = sorted(n for n in os.listdir(args.dir) if n.startswith("sentado_") and n[8:10].isdigit())
    fotogramas = [leer(os.path.join(args.dir, n)) for n in nombres]
    hoja = leer(HOJA)
    meta = json.load(open(META, encoding="utf-8"))
    if args.cara_lisa:
        lisa = leer(args.cara_lisa)
        cara = hoja[0:TAM, 0:TAM]
        mascara = mascara_cara(lisa)
        fotogramas = [poner_cara(f, lisa, cara, mascara) for f in fotogramas]

    anims = meta["animaciones"]
    anims.pop("sentado", None)
    inicio = max(a["inicio"] + a["n"] for a in anims.values())
    total = inicio + len(fotogramas)
    columnas = meta["columnas"]
    filas = -(-total // columnas)
    nueva = np.zeros((filas * TAM, columnas * TAM, 4), np.float32)
    alto = min(hoja.shape[0], filas * TAM)
    nueva[:alto] = hoja[:alto]
    for i, f in enumerate(fotogramas):
        k = inicio + i
        y, x = (k // columnas) * TAM, (k % columnas) * TAM
        nueva[y:y + TAM, x:x + TAM] = f
    Image.fromarray(np.clip(nueva, 0, 255).astype(np.uint8)).save(HOJA, "WEBP", quality=90, method=6)

    anims["sentado"] = {"inicio": inicio, "n": len(fotogramas), "fps": 3, "bucle": True}
    meta["filas"] = filas
    meta["cabeza"] = meta["cabeza"][:inicio] + [altura_pelo(f) for f in fotogramas]
    # La lista de alturas en una sola línea, como el resto del archivo
    texto = re.sub(r'"cabeza": \[[^\]]*\]', '"cabeza": ' + json.dumps(meta["cabeza"]),
                   json.dumps(meta, ensure_ascii=False, indent=2))
    with open(META, "w", encoding="utf-8") as f:
        f.write(texto + "\n")
    print(f"sentado: fotogramas {inicio}–{total - 1}, hoja de {filas} filas, {os.path.getsize(HOJA) // 1024} KB")


if __name__ == "__main__":
    main()
