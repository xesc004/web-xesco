"""Prepara el vídeo de demostración de una app para su sala (la que se abre al bajar por la tubería).

    python3 herramientas/preparar_demo.py aldiax ruta/al/video.mp4 [--desde 0] [--duracion 20]

Recorta, quita el audio y comprime el vídeo en vertical (540 px de ancho, sin sonido, listo para reproducirse
en bucle) en img/apps/<app>/demo.mp4 (H.264) y demo.webm (VP9, para navegadores sin H.264), y añade
data-demo="…" al <article id="app-<app>"> de index.html para que la sala lo use. Necesita ffmpeg.
"""
import argparse
import os
import re
import subprocess

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = ("aldiax", "yunque", "chatadn", "una-neurona")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("app", choices=APPS)
    p.add_argument("video")
    p.add_argument("--desde", type=float, default=0.0, help="segundo de inicio")
    p.add_argument("--duracion", type=float, default=20.0, help="segundos como máximo")
    args = p.parse_args()

    relativa = f"img/apps/{args.app}/demo.mp4"
    destino = os.path.join(WEB, relativa)
    entrada = ["ffmpeg", "-loglevel", "error", "-y", "-ss", str(args.desde), "-i", args.video, "-t", str(args.duracion),
               "-an", "-vf", "scale=540:-2:flags=lanczos,fps=30"]
    subprocess.run(entrada + ["-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p", "-crf", "28",
                              "-preset", "slow", "-movflags", "+faststart", destino], check=True)
    subprocess.run(entrada + ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1",
                              destino[:-4] + ".webm"], check=True)

    ruta_html = os.path.join(WEB, "index.html")
    html = open(ruta_html, encoding="utf-8").read()
    patron = re.compile(rf'<article class="app" id="app-{re.escape(args.app)}"(?: data-demo="[^"]*")?')
    html, n = patron.subn(f'<article class="app" id="app-{args.app}" data-demo="{relativa}"', html, count=1)
    if n != 1:
        raise SystemExit(f"No encuentro <article id=\"app-{args.app}\"> en index.html")
    open(ruta_html, "w", encoding="utf-8").write(html)
    webm = os.path.getsize(destino[:-4] + ".webm") // 1024
    print(f"{relativa}: {os.path.getsize(destino) // 1024} KB (+ webm {webm} KB) · data-demo añadido a index.html")


if __name__ == "__main__":
    main()
