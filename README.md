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
- Premios por piezas: bandana de la Hoja (12), capa de Hokage (24) y aura de chakra (36).
- Ambiente: hojas que caen y se arremolinan al correr, matas desenfocadas en primer plano, cielo que va de la
  mañana a la noche con los farolillos encendiéndose y luciérnagas en el contacto, y la pantalla de entrada
  «MUNDO 1-1». Todo se apaga con `prefers-reduced-motion`.
- Si se añade una animación `sentado` a la hoja de sprites, el muñeco la usará al esperar en vez de saludar.

## Regenerar recursos

- Fondo: `node herramientas/generar-fondo.mjs` (escribe `img/fondo/*.svg`, incluidas las luces de la aldea y el
  primer plano).
- Imágenes de las apps y foto: `herramientas/preparar_imagenes.py` dentro de Blender 5.1 (vía el MCP de
  Blender Lab).
- Muñeco: `minifigura/scripts/mf_build.py` (modelo) y `minifigura/scripts/mf_sprites.py` (hoja de sprites)
  dentro de Blender con `minifigura/minifigura_xesco.blend`.

## Despliegue

Sitio estático servido desde la raíz del repo (Vercel/Netlify, dominio en Cloudflare). Se conservan Google
Analytics, el dominio canónico y el formulario de Web3Forms. El material de trabajo (`material/`, `.blend`,
fotogramas) está en `.gitignore` para que no se publique.

## Contacto

- Xesco — [xescoalabaucalatayud2@gmail.com](mailto:xescoalabaucalatayud2@gmail.com)
- LinkedIn: [Francisco Alabau Calatayud](https://www.linkedin.com/in/francisco-alabau-calatayud-329196330/)
- GitHub: [xesc004](https://github.com/xesc004)
