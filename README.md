# Xesco · Portfolio jugable — xescoalabau.com

Portfolio de Francisco Alabau Calatayud (Xesco) convertido en un nivel de plataformas 2D: su minifigura de
bloques recorre el portfolio de izquierda a derecha saltando sobre los propios bloques de contenido, con un
fondo ilustrado inspirado en una aldea ninja. Con el botón «Ver CV rápido» (o `?cv` en la URL) el mismo
contenido se lee como una página normal.

- Diseño: [`docs/superpowers/specs/2026-10-08-portfolio-nivel-design.md`](docs/superpowers/specs/2026-10-08-portfolio-nivel-design.md)
- Plan: [`docs/superpowers/plans/2026-10-08-portfolio-nivel.md`](docs/superpowers/plans/2026-10-08-portfolio-nivel.md)

## Estructura

```
index.html            contenido (español), zonas del nivel, barra superior y controles táctiles
css/                  base, nivel, barra superior (hud) y modo CV rápido
js/main.js            arranque y orquestación
js/motor/             física (pura), bucle de paso fijo y entrada (teclado, táctil, rueda)
js/mundo/             escala, plataformas medidas del HTML y fondo parallax
js/juego/             muñeco, arrastre, cámara y objetos del nivel
js/ui/                idioma, CV rápido, contacto (Web3Forms), sonido y barra superior
i18n/en.json          textos en inglés
img/                  foto, apps, fondo (SVG) y hoja de sprites del muñeco
cv/                   CV en PDF (español e inglés), generado desde el modo CV
tests/                tests de las partes puras (node --test)
herramientas/         servidor local y generadores de recursos
minifigura/scripts/   modelo 3D del muñeco y sprites (Blender)
```

## Desarrollo

```bash
node herramientas/servidor.mjs     # http://localhost:8080
npm test                           # tests de física, escala, cámara y cielo
```

- `?cv` abre el modo CV rápido; `?depurar` dibuja los colisionadores y expone `window.__juego`.
- Controles: ← → (o A D) para andar, Espacio para saltar, ↓ para bajar de una plataforma y Shift (o el botón
  «Ninja» en móvil) para la carrera ninja. Cayendo contra el costado de un cartel o de un sólido se resbala y
  se puede saltar hacia el otro lado. El muñeco se puede coger y lanzar con el ratón o el dedo; la rueda del
  ratón lo hace correr.
- El muñeco comenta cada zona con un bocadillo (frases en `#frases` de `index.html`, traducidas en
  `i18n/en.json`), mira hacia el ratón, se ríe si se le pasa por encima y saluda tras 8 s quieto.
- Sensación de juego: el muñeco se estira al saltar, se aplasta al aterrizar (más cuanto más alto cae) y se echa
  hacia atrás al frenar; polvo al correr y aterrizar, chispas en el yunque, piezas de LEGO en los bloques
  sorpresa, temblor suave de pantalla, «+1» con la pieza volando al contador, flotación en la cima del salto,
  y estela y pataleo al cogerlo y lanzarlo. El salto ya perdonaba 0,1 s tras dejar un borde, recordaba la
  pulsación 0,12 s antes de aterrizar y era más alto cuanto más se mantenía Espacio.
- Premios por piezas: bandana de la Hoja (12), capa de Hokage (24) y aura de chakra (36).
- Ambiente: hojas que caen y se arremolinan al correr, matas desenfocadas en primer plano, cielo que va de la
  mañana a la noche con los farolillos encendiéndose y luciérnagas en el contacto, y la pantalla de entrada
  «MUNDO 1-1». Todo se apaga con `prefers-reduced-motion`.
- Tras 8 s quieto el muñeco se sienta (animación `sentado`); tras 4 s sin moverse aparece la ayuda «→ / Espacio»
  hasta que se ha andado y saltado.
- Meta: resumen con tiempo, piezas, secretos y rango (S/A/B/C), botones «Contáctame» y «Descargar CV en PDF»,
  compartir en LinkedIn (copia el texto y abre LinkedIn), tarjeta PNG de 1200 × 630 y «Jugar otra vez».
- Tuberías: en cada app hay una tubería verde; con ↓ encima (o tocándola) el muñeco baja a una sala con la app
  funcionando en un móvil, su enlace a la tienda y su stack, y vuelve por la tubería de salida. Sin vídeo, la
  sala anima las capturas; para usar un vídeo: `python3 herramientas/preparar_demo.py aldiax video.mp4`
  (lo comprime en `img/apps/aldiax/demo.mp4` y añade `data-demo` al artículo de la app).
- Secretos: una pieza morada muy arriba (se alcanza con la cama elástica de Una Neurona) y el código Konami
  (↑↑↓↓←→←→BA), que activa el modo Kyūbi.

## Regenerar recursos

- Fondo: `node herramientas/generar-fondo.mjs` (escribe `img/fondo/*.svg`, incluidas las luces de la aldea y el
  primer plano).
- Imágenes de las apps y foto: `herramientas/preparar_imagenes.py` dentro de Blender 5.1 (vía el MCP de
  Blender Lab).
- Muñeco: `minifigura/scripts/mf_build.py` (modelo) y `minifigura/scripts/mf_sprites.py` (hoja de sprites)
  dentro de Blender con `minifigura/minifigura_xesco.blend`.
- Solo la animación «sentado»: se renderizan sus fotogramas con `mf_sprites` y se añaden a la hoja con
  `python3 herramientas/anadir_sentado.py DIR` (con `--cara-lisa parado.png` si el modelo se construyó sin la foto
  de referencia: la cara se copia del primer fotograma de la hoja).
- CV en PDF: con el servidor local en marcha, `node herramientas/generar-cv-pdf.mjs` (necesita Playwright) escribe
  `cv/Francisco-Alabau-Calatayud-CV.pdf` y `-en.pdf` a partir del modo CV impreso.

## Despliegue

Sitio estático servido desde la raíz del repo (Vercel/Netlify, dominio en Cloudflare). Se conservan Google
Analytics, el dominio canónico y el formulario de Web3Forms. El material de trabajo (`material/`, `.blend`,
fotogramas) está en `.gitignore` para que no se publique.

## Contacto

- Xesco — [xescoalabaucalatayud2@gmail.com](mailto:xescoalabaucalatayud2@gmail.com)
- LinkedIn: [Francisco Alabau Calatayud](https://www.linkedin.com/in/francisco-alabau-calatayud-329196330/)
- GitHub: [xesc004](https://github.com/xesc004)
