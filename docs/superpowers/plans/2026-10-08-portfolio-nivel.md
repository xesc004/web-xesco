# Portfolio-nivel — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `xescoalabau.com` en un portfolio jugable: la minifigura de Xesco recorre de izquierda a derecha un nivel de plataformas 2D cuyas plataformas son los propios bloques de contenido, sobre un fondo propio inspirado en una aldea ninja.

**Architecture:** Sitio estático en la raíz del repo `web-xesco` (HTML real + CSS + JavaScript en módulos ES, sin frameworks ni compilación). El contenido vive en `index.html`; el juego mide sus cajas y las convierte en plataformas para un motor de física propio de funciones puras. El muñeco es una hoja de sprites renderizada desde el modelo de Blender; el fondo son cuatro capas SVG generadas por código. El mismo HTML se recoloca en vertical para el modo «CV rápido».

**Tech Stack:** HTML5, CSS3, JavaScript (módulos ES), Node 24 (`node --test`, servidor local de desarrollo), Blender 5.1.1 vía el MCP de Blender Lab (sprites e imágenes), ffmpeg 8.1 (fotogramas de vídeo), Google Fonts (Fredoka, Inter), Web3Forms.

**Spec:** `docs/superpowers/specs/2026-10-08-portfolio-nivel-design.md`

## Global Constraints

- Repo: `C:\Users\xesco\OneDrive\Escritorio\web-xesco`. Todas las rutas del plan son relativas a esa raíz salvo que se indique otra.
- **No hacer commits.** El usuario hará el commit más tarde (decisión del 2026-10-08). Donde la skill pondría «commit», este plan solo pide comprobar `git status`.
- Sitio estático servido desde la raíz del repo; sin frameworks ni paso de compilación; JavaScript en módulos ES con punto y coma y 2 espacios.
- Se conservan: Google Analytics `G-7QXF2EDSVY`, canónico `https://xescoalabau.com/`, Web3Forms `access_key` `11003856-d192-4b60-9d0c-4ad8a9e5654d`, `subject` «Nuevo contacto desde xescoalabau.com», `from_name` «Web xescoalabau.com», casilla `botcheck`.
- Contacto: `+34 658 240 032` (teléfono y WhatsApp `https://wa.me/34658240032`), `xescoalabaucalatayud2@gmail.com`, LinkedIn `https://www.linkedin.com/in/francisco-alabau-calatayud-329196330/`, GitHub `https://github.com/xesc004`.
- Propiedad intelectual: sin nombre ni logo de LEGO, sin arte oficial de Naruto ni su emblema, sin recursos de Nintendo (no hay bloques con «?»).
- Unidades de diseño: alto del mundo 900, suelo en y = 780, ancho del mundo 18 500.
- Paleta: naranja `#F47B20`, naranja oscuro `#C85A0E`, azul marino `#1D2840`, crema `#FFF6EC`, madera `#8B5A2B`, verde hoja `#5E9E3F`, texto `#1D2030`; cielo mañana `#A9DCF5` → mediodía `#6EC1F0` → atardecer `#F7A35C`.
- Tipografías: Fredoka (títulos) e Inter (texto) desde Google Fonts.
- Idiomas: español en el HTML (`data-i18n`), inglés en `i18n/en.json`.
- App Store (comprobado el 2026-10-08): Aldiax `https://apps.apple.com/es/app/aldiax/id6801093580`, Yunque `https://apps.apple.com/es/app/yunque/id6808992256`, ChatADN `https://apps.apple.com/es/app/chatadn/id6817065918`; Una Neurona (`id6818739554`) da 404 → «Próximamente en App Store», sin enlace.
- Material de origen (`C:\dev\aldiax`, `C:\dev\yunque*`, `C:\Users\xesco\ChatADN`, `C:\Users\xesco\Lumiq`, `material/`): solo lectura. Nunca abrir `.env`, credenciales, tokens ni `.private`.
- Blender: Blender 5.1.1 abierto con el add-on «MCP» de Blender Lab y su servidor arrancado; el código se ejecuta con `mcp__Blender__execute_blender_code`. Las llamadas del MCP se cortan a los ~2 min aunque Blender siga trabajando: los renders largos van en una cola con `bpy.app.timers` y se espera por los archivos desde PowerShell.
- Presupuesto: carga inicial < 2,5 MB; las capturas de las apps se cargan con `loading="lazy"`.

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `package.json` | `"type": "module"` y `npm test` → `node --test` |
| `index.html` | Todo el contenido (ES), zonas del nivel, HUD, controles táctiles |
| `css/base.css` | Tokens, tipografía, utilidades |
| `css/nivel.css` | Mundo, zonas, carteles, objetos, fondo, muñeco |
| `css/hud.css` | Barra superior, minimapa, controles táctiles, aviso de meta |
| `css/cv.css` | Modo CV rápido e impresión |
| `js/main.js` | Arranque y orquestación |
| `js/motor/fisica.js` | Física y colisiones (puras) |
| `js/motor/bucle.js` | Bucle de paso fijo |
| `js/motor/entrada.js` | Teclado, táctil y rueda → estado de entrada |
| `js/mundo/escala.js` | Constantes del mundo y escala diseño ↔ pantalla (puras) |
| `js/mundo/plataformas.js` | Mide el HTML y devuelve colisionadores |
| `js/mundo/fondo.js` | Color del cielo (puro) y parallax |
| `js/juego/jugador.js` | Estados y animación del muñeco |
| `js/juego/arrastre.js` | Coger, balancear y lanzar con el puntero |
| `js/juego/camara.js` | Seguimiento y límites (puras) |
| `js/juego/objetos.js` | Piezas, sorpresas, yunque, neurona, robots, clones, banderas, meta |
| `js/ui/hud.js` | Minimapa, progreso, contador, sonido |
| `js/ui/i18n.js` | Cambio de idioma |
| `js/ui/cv-rapido.js` | Modo CV rápido |
| `js/ui/contacto.js` | Envío del formulario a Web3Forms |
| `js/ui/sonido.js` | Efectos con Web Audio |
| `i18n/en.json` | Textos en inglés |
| `img/foto/`, `img/apps/<app>/`, `img/personaje/`, `img/fondo/` | Recursos generados |
| `tests/*.test.js` | Tests de las partes puras |
| `herramientas/servidor.mjs` | Servidor estático local |
| `herramientas/preparar_imagenes.py` | Foto, iconos, capturas y mascota en WebP (Blender) |
| `herramientas/generar-fondo.mjs` | Capas SVG del fondo |
| `minifigura/scripts/mf_sprites.py` | Hoja de sprites del muñeco (Blender) |
| `.claude/launch.json` | Configuración del panel de vista previa |

---

### Tarea 1: Motor de física (TDD)

**Files:**
- Create: `package.json`
- Create: `js/motor/fisica.js`
- Test: `tests/fisica.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `FISICA` (objeto de constantes).
  - `crearCuerpo({ x, y, w, h })` → cuerpo `{ x, y, w, h, vx, vy, enSuelo, sobre, tiempoAire, memoriaSalto, saltando, atravesando, tiempoAtravesar }` (`x, y` = esquina superior izquierda).
  - `paso(cuerpo, entrada, colisionadores, dt)` → `Array<{ tipo: 'salta' } | { tipo: 'aterriza', id } | { tipo: 'golpeaTecho', id } | { tipo: 'rebota', id }>`. `entrada = { izquierda, derecha, saltar, saltoPulsado, bajar }` (`saltar` y `bajar` son flancos de pulsación). `colisionador = { id, x, y, w, h, tipo }` con `tipo ∈ 'unSentido' | 'solido' | 'elastico' | 'sorpresa'`.
  - `desatascar(cuerpo, colisionadores)` → empuja el cuerpo hacia arriba fuera de cualquier sólido.

- [ ] **Paso 1: Comprobar Node**

Run: `node --version`
Expected: `v24.x` (vale cualquier versión ≥ 20).

- [ ] **Paso 2: Crear `package.json`**

```json
{
  "name": "web-xesco",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Paso 3: Escribir los tests que fallan** en `tests/fisica.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCuerpo, paso, desatascar } from '../js/motor/fisica.js';

const DT = 1 / 120;
const nada = { izquierda: false, derecha: false, saltar: false, saltoPulsado: false, bajar: false };
const suelo = { id: 'suelo', x: -1000, y: 780, w: 5000, h: 400, tipo: 'solido' };

function simular(c, colisionadores, segundos, entrada = nada) {
  const eventos = [];
  const pasos = Math.round(segundos / DT);
  for (let i = 0; i < pasos; i++) {
    const e = typeof entrada === 'function' ? entrada(i) : entrada;
    eventos.push(...paso(c, e, colisionadores, DT));
  }
  return eventos;
}

test('cae por gravedad y aterriza sobre el suelo', () => {
  const c = crearCuerpo({ x: 100, y: 300, w: 60, h: 140 });
  const eventos = simular(c, [suelo], 2);
  assert.equal(c.enSuelo, true);
  assert.equal(c.y + c.h, 780);
  assert.ok(eventos.some((e) => e.tipo === 'aterriza' && e.id === 'suelo'));
});

test('una plataforma de un sentido se atraviesa desde abajo y sostiene desde arriba', () => {
  const plataforma = { id: 'p', x: 0, y: 650, w: 300, h: 40, tipo: 'unSentido' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  simular(c, [suelo, plataforma], 0.5);
  assert.equal(c.y + c.h, 780);
  simular(c, [suelo, plataforma], 1.2, (i) => ({ ...nada, saltar: i === 0, saltoPulsado: i < 60 }));
  assert.equal(c.enSuelo, true);
  assert.equal(c.y + c.h, 650);
});

test('con bajar se deja caer desde una plataforma de un sentido', () => {
  const plataforma = { id: 'p', x: 0, y: 650, w: 300, h: 40, tipo: 'unSentido' };
  const c = crearCuerpo({ x: 100, y: 500, w: 60, h: 140 });
  simular(c, [suelo, plataforma], 0.3);
  assert.equal(c.y + c.h, 650);
  simular(c, [suelo, plataforma], 1, (i) => ({ ...nada, bajar: i === 0 }));
  assert.equal(c.y + c.h, 780);
});

test('un sólido frena el avance lateral', () => {
  const muro = { id: 'muro', x: 300, y: 500, w: 100, h: 280, tipo: 'solido' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  simular(c, [suelo, muro], 2, { ...nada, derecha: true });
  assert.equal(c.x + c.w, 300);
  assert.equal(c.vx, 0);
});

test('se puede saltar justo después de salir de un borde', () => {
  const plataforma = { id: 'p', x: 0, y: 650, w: 200, h: 40, tipo: 'unSentido' };
  const c = crearCuerpo({ x: 130, y: 510, w: 60, h: 140 });
  simular(c, [suelo, plataforma], 0.2);
  assert.equal(c.enSuelo, true);
  let pasosEnAire = 0;
  const eventos = simular(c, [suelo, plataforma], 0.6, () => {
    if (!c.enSuelo && c.vy >= 0) pasosEnAire++;
    return { ...nada, derecha: true, saltar: pasosEnAire === 6, saltoPulsado: pasosEnAire >= 6 && pasosEnAire < 40 };
  });
  assert.ok(eventos.some((e) => e.tipo === 'salta'));
});

test('no se puede saltar en el aire pasado el margen', () => {
  const c = crearCuerpo({ x: 100, y: 0, w: 60, h: 140 });
  const eventos = simular(c, [suelo], 0.3, (i) => ({ ...nada, saltar: i === 30, saltoPulsado: i >= 30 }));
  assert.ok(!eventos.some((e) => e.tipo === 'salta'));
});

test('el salto se memoriza si se pulsa justo antes de aterrizar', () => {
  const c = crearCuerpo({ x: 100, y: 560, w: 60, h: 140 });
  let pedido = false;
  const eventos = simular(c, [suelo], 0.5, () => {
    const cerca = !pedido && !c.enSuelo && c.vy > 0 && 780 - (c.y + c.h) < 15;
    if (cerca) pedido = true;
    return { ...nada, saltar: cerca, saltoPulsado: pedido };
  });
  assert.ok(eventos.some((e) => e.tipo === 'salta'));
});

test('soltar el salto pronto lo hace más bajo', () => {
  const alto = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  const bajo = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  let minAlto = Infinity;
  let minBajo = Infinity;
  for (let i = 0; i < 90; i++) {
    paso(alto, { ...nada, saltar: i === 0, saltoPulsado: true }, [suelo], DT);
    paso(bajo, { ...nada, saltar: i === 0, saltoPulsado: i < 6 }, [suelo], DT);
    minAlto = Math.min(minAlto, alto.y);
    minBajo = Math.min(minBajo, bajo.y);
  }
  assert.ok(minBajo > minAlto + 60);
});

test('la cama elástica devuelve al muñeco hacia arriba', () => {
  const cama = { id: 'neurona-cama', x: 0, y: 620, w: 200, h: 160, tipo: 'elastico' };
  const c = crearCuerpo({ x: 50, y: 330, w: 60, h: 140 });
  const eventos = simular(c, [suelo, cama], 0.4);
  assert.ok(eventos.some((e) => e.tipo === 'rebota' && e.id === 'neurona-cama'));
  assert.ok(c.vy < 0);
});

test('golpear un bloque sorpresa desde abajo emite golpeaTecho', () => {
  const bloque = { id: 'sorpresa-aldiax', x: 80, y: 420, w: 96, h: 96, tipo: 'sorpresa' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  const eventos = simular(c, [suelo, bloque], 0.6, (i) => ({ ...nada, saltar: i === 0, saltoPulsado: true }));
  assert.ok(eventos.some((e) => e.tipo === 'golpeaTecho' && e.id === 'sorpresa-aldiax'));
});

test('desatascar saca al muñeco de un sólido hacia arriba', () => {
  const caja = { id: 'caja', x: 0, y: 600, w: 200, h: 180, tipo: 'solido' };
  const c = crearCuerpo({ x: 50, y: 650, w: 60, h: 140 });
  desatascar(c, [suelo, caja]);
  assert.equal(c.y + c.h, 600);
});
```

- [ ] **Paso 4: Ejecutar los tests y ver que fallan**

Run: `npm test`
Expected: FAIL con `Cannot find module '…/js/motor/fisica.js'`.

- [ ] **Paso 5: Implementar `js/motor/fisica.js`**

```js
// Física del muñeco: funciones puras sin DOM, en unidades de diseño (el mundo mide 900 de alto).
export const FISICA = {
  gravedad: 2600,
  velocidadMax: 380,
  aceleracion: 2400,
  frenado: 3000,
  controlAereo: 0.6,
  salto: 1000,
  corteSalto: 0.45,
  caidaMax: 1400,
  margenSalto: 0.1,
  memoriaSalto: 0.12,
  rebote: 1500,
  tiempoAtravesar: 0.25,
};

const EPS = 0.01;
const SOLIDOS = new Set(['solido', 'sorpresa']);

export function crearCuerpo({ x, y, w, h }) {
  return {
    x, y, w, h,
    vx: 0,
    vy: 0,
    enSuelo: false,
    sobre: null,
    tiempoAire: 0,
    memoriaSalto: 0,
    saltando: false,
    atravesando: null,
    tiempoAtravesar: 0,
  };
}

function solapaX(a, b) {
  return a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS;
}

function solapa(a, b) {
  return solapaX(a, b) && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;
}

function aterrizar(c, p) {
  c.vy = 0;
  c.enSuelo = true;
  c.sobre = p;
  c.saltando = false;
}

export function paso(c, entrada, colisionadores, dt) {
  const F = FISICA;
  const eventos = [];
  const estabaEnSuelo = c.enSuelo;

  // Movimiento horizontal: acelera con la entrada y frena sin ella (menos control en el aire)
  const dir = (entrada.derecha ? 1 : 0) - (entrada.izquierda ? 1 : 0);
  const control = c.enSuelo ? 1 : F.controlAereo;
  if (dir !== 0) {
    c.vx = Math.max(-F.velocidadMax, Math.min(F.velocidadMax, c.vx + dir * F.aceleracion * control * dt));
  } else {
    const frena = F.frenado * control * dt;
    c.vx = Math.abs(c.vx) <= frena ? 0 : c.vx - Math.sign(c.vx) * frena;
  }

  // Salto: margen tras salir de un borde y memoria si se pulsa justo antes de aterrizar
  c.tiempoAire = c.enSuelo ? 0 : c.tiempoAire + dt;
  c.memoriaSalto = entrada.saltar ? F.memoriaSalto : Math.max(0, c.memoriaSalto - dt);
  if (c.memoriaSalto > 0 && !c.saltando && (c.enSuelo || c.tiempoAire <= F.margenSalto)) {
    c.vy = -F.salto;
    c.saltando = true;
    c.enSuelo = false;
    c.sobre = null;
    c.memoriaSalto = 0;
    c.tiempoAire = F.margenSalto + dt;
    eventos.push({ tipo: 'salta' });
  }
  if (c.saltando && c.vy < 0 && !entrada.saltoPulsado) {
    c.vy *= F.corteSalto;
    c.saltando = false;
  }

  // Bajar de una plataforma de un sentido
  if (entrada.bajar && c.enSuelo && c.sobre?.tipo === 'unSentido') {
    c.atravesando = c.sobre.id;
    c.tiempoAtravesar = F.tiempoAtravesar;
    c.enSuelo = false;
    c.sobre = null;
    c.tiempoAire = F.margenSalto + dt;
  }
  if (c.tiempoAtravesar > 0) {
    c.tiempoAtravesar -= dt;
    if (c.tiempoAtravesar <= 0) c.atravesando = null;
  }

  c.vy = Math.min(c.vy + F.gravedad * dt, F.caidaMax);

  // Eje X: choques laterales con sólidos
  c.x += c.vx * dt;
  for (const p of colisionadores) {
    if (!SOLIDOS.has(p.tipo) || !solapa(c, p)) continue;
    if (c.vx > 0) c.x = p.x - c.w;
    else if (c.vx < 0) c.x = p.x + p.w;
    c.vx = 0;
  }

  // Eje Y: suelos, techos, plataformas de un sentido y camas elásticas
  const pieAntes = c.y + c.h;
  c.y += c.vy * dt;
  c.enSuelo = false;
  c.sobre = null;
  for (const p of colisionadores) {
    if (p.id === c.atravesando || !solapaX(c, p)) continue;
    if (SOLIDOS.has(p.tipo)) {
      if (!solapa(c, p)) continue;
      if (c.vy > 0) {
        c.y = p.y - c.h;
        aterrizar(c, p);
      } else if (c.vy < 0) {
        c.y = p.y + p.h;
        c.vy = 0;
        c.saltando = false;
        if (p.tipo === 'sorpresa') eventos.push({ tipo: 'golpeaTecho', id: p.id });
      }
    } else if (c.vy >= 0 && pieAntes <= p.y + 0.5 && c.y + c.h >= p.y) {
      c.y = p.y - c.h;
      if (p.tipo === 'elastico') {
        c.vy = -F.rebote;
        c.saltando = false;
        c.tiempoAire = F.margenSalto + dt;
        eventos.push({ tipo: 'rebota', id: p.id });
      } else {
        aterrizar(c, p);
      }
    }
  }
  if (c.enSuelo && !estabaEnSuelo) eventos.push({ tipo: 'aterriza', id: c.sobre.id });
  return eventos;
}

// Saca el cuerpo de cualquier sólido empujándolo hacia arriba (tras redimensionar o soltar al muñeco)
export function desatascar(c, colisionadores) {
  for (let intento = 0; intento < 6; intento++) {
    const atrapado = colisionadores.find((p) => SOLIDOS.has(p.tipo) && solapa(c, p));
    if (!atrapado) return;
    c.y = atrapado.y - c.h;
    c.vy = 0;
  }
}
```

- [ ] **Paso 6: Ejecutar los tests y ver que pasan**

Run: `npm test`
Expected: `# pass 11`, `# fail 0`.

- [ ] **Paso 7: Punto de control (sin commit)**

Run: `git status --short`
Expected: aparecen `package.json`, `js/motor/` y `tests/` como nuevos. No hacer commit.

---

### Tarea 2: Escala, cámara y color del cielo (TDD)

**Files:**
- Create: `js/mundo/escala.js`
- Create: `js/juego/camara.js`
- Create: `js/mundo/fondo.js`
- Test: `tests/escala.test.js`, `tests/camara.test.js`, `tests/fondo.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `escala.js`: `ALTO_MUNDO = 900`, `Y_SUELO = 780`, `ANCHO_MUNDO = 18500`, `ANCHO_MINIMO_VISIBLE = 560`, `calcularEscala(anchoVentana, altoVentana)` → número, `anchoVisible(anchoVentana, escala)` → unidades.
  - `camara.js`: `crearCamara()` → `{ x }`, `limitarCamara(x, anchoVisible, anchoMundo)` → número, `seguirCamara(cam, centroJugador, mirando, anchoVisible, anchoMundo, dt)` → cam, `centrarCamara(cam, centroJugador, anchoVisible, anchoMundo)` → cam.
  - `fondo.js`: `colorCielo(progreso)` → `{ arriba: 'rgb(r,g,b)', abajo: 'rgb(r,g,b)' }`, `crearFondo(escena)`, `medirFondo(fondo)`, `actualizarFondo(fondo, desplazamientoPx, progreso, reducido)`.

- [ ] **Paso 1: Escribir los tests que fallan**

`tests/escala.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularEscala, anchoVisible, ALTO_MUNDO } from '../js/mundo/escala.js';

test('en escritorio la escala la marca el alto de la ventana', () => {
  assert.equal(calcularEscala(1440, 900), 1);
  assert.equal(calcularEscala(1920, 1080), 1.2);
});

test('en un móvil en vertical la escala la limita el ancho mínimo visible', () => {
  const escala = calcularEscala(390, 844);
  assert.ok(Math.abs(escala - 390 / 560) < 1e-9);
  assert.ok(Math.abs(anchoVisible(390, escala) - 560) < 1e-9);
  assert.ok(ALTO_MUNDO * escala < 844);
});
```

`tests/camara.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCamara, seguirCamara, centrarCamara, limitarCamara } from '../js/juego/camara.js';

test('la cámara no sale del mundo por ningún lado', () => {
  assert.equal(limitarCamara(-300, 1000, 18500), 0);
  assert.equal(limitarCamara(99999, 1000, 18500), 17500);
});

test('si el mundo cabe entero, la cámara se queda en 0', () => {
  assert.equal(limitarCamara(50, 20000, 18500), 0);
});

test('centrar deja al jugador al 40 % del ancho visible', () => {
  const cam = centrarCamara(crearCamara(), 5000, 1000, 18500);
  assert.equal(cam.x, 4600);
});

test('seguir se acerca al objetivo con adelanto hacia donde mira', () => {
  const cam = crearCamara();
  for (let i = 0; i < 600; i++) seguirCamara(cam, 5000, 1, 1000, 18500, 1 / 120);
  assert.ok(Math.abs(cam.x - 4700) < 1);
});
```

`tests/fondo.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorCielo } from '../js/mundo/fondo.js';

test('el cielo pasa de la mañana al mediodía y al atardecer', () => {
  assert.equal(colorCielo(0).arriba, 'rgb(169,220,245)');
  assert.equal(colorCielo(0.5).arriba, 'rgb(110,193,240)');
  assert.equal(colorCielo(1).arriba, 'rgb(247,163,92)');
});

test('el progreso fuera de rango se recorta', () => {
  assert.deepEqual(colorCielo(-1), colorCielo(0));
  assert.deepEqual(colorCielo(3), colorCielo(1));
});
```

- [ ] **Paso 2: Ejecutar y ver que fallan**

Run: `npm test`
Expected: FAIL en los tres archivos nuevos (`Cannot find module`); los 11 de física siguen pasando.

- [ ] **Paso 3: Implementar `js/mundo/escala.js`**

```js
// Constantes del mundo en unidades de diseño y conversión a píxeles de pantalla.
export const ALTO_MUNDO = 900;
export const Y_SUELO = 780;
export const ANCHO_MUNDO = 18500;
export const ANCHO_MINIMO_VISIBLE = 560;

export function calcularEscala(anchoVentana, altoVentana) {
  return Math.min(altoVentana / ALTO_MUNDO, anchoVentana / ANCHO_MINIMO_VISIBLE);
}

export function anchoVisible(anchoVentana, escala) {
  return anchoVentana / escala;
}
```

- [ ] **Paso 4: Implementar `js/juego/camara.js`**

```js
// Cámara horizontal: sigue al muñeco con suavizado y adelanto, sin salirse del mundo.
export function crearCamara() {
  return { x: 0 };
}

export function limitarCamara(x, anchoVisible, anchoMundo) {
  return Math.max(0, Math.min(Math.max(0, anchoMundo - anchoVisible), x));
}

export function seguirCamara(cam, centroJugador, mirando, anchoVisible, anchoMundo, dt) {
  const deseado = centroJugador - anchoVisible * 0.4 + mirando * anchoVisible * 0.1;
  cam.x += (deseado - cam.x) * Math.min(1, dt * 5);
  cam.x = limitarCamara(cam.x, anchoVisible, anchoMundo);
  return cam;
}

export function centrarCamara(cam, centroJugador, anchoVisible, anchoMundo) {
  cam.x = limitarCamara(centroJugador - anchoVisible * 0.4, anchoVisible, anchoMundo);
  return cam;
}
```

- [ ] **Paso 5: Implementar `js/mundo/fondo.js`**

```js
// Fondo: color del cielo según el progreso (puro) y desplazamiento parallax de las capas SVG.
const CIELO = [
  { p: 0, arriba: [169, 220, 245], abajo: [232, 246, 253] },
  { p: 0.5, arriba: [110, 193, 240], abajo: [214, 238, 251] },
  { p: 1, arriba: [247, 163, 92], abajo: [255, 221, 170] },
];

function mezclar(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export function colorCielo(progreso) {
  const p = Math.max(0, Math.min(1, progreso));
  const i = p < 0.5 ? 0 : 1;
  const a = CIELO[i];
  const b = CIELO[i + 1];
  const t = (p - a.p) / (b.p - a.p);
  return {
    arriba: `rgb(${mezclar(a.arriba, b.arriba, t).join(',')})`,
    abajo: `rgb(${mezclar(a.abajo, b.abajo, t).join(',')})`,
  };
}

export function crearFondo(escena) {
  return {
    capas: [...escena.querySelectorAll('[data-parallax]')].map((el) => ({
      el,
      factor: Number(el.dataset.parallax),
      proporcion: Number(el.dataset.proporcion),
      tesela: 1,
    })),
    cielo: escena.querySelector('.cielo'),
    ultimoProgreso: -1,
  };
}

export function medirFondo(fondo) {
  for (const capa of fondo.capas) capa.tesela = Math.max(1, capa.el.offsetHeight * capa.proporcion);
}

export function actualizarFondo(fondo, desplazamientoPx, progreso, reducido) {
  for (const capa of fondo.capas) {
    const d = reducido ? 0 : (desplazamientoPx * capa.factor) % capa.tesela;
    capa.el.style.transform = `translate3d(${(-d).toFixed(1)}px, 0, 0)`;
  }
  if (Math.abs(progreso - fondo.ultimoProgreso) > 0.002) {
    const { arriba, abajo } = colorCielo(progreso);
    fondo.cielo.style.setProperty('--cielo-arriba', arriba);
    fondo.cielo.style.setProperty('--cielo-abajo', abajo);
    fondo.ultimoProgreso = progreso;
  }
}
```

- [ ] **Paso 6: Ejecutar y ver que pasan**

Run: `npm test`
Expected: `# pass 19`, `# fail 0`.

- [ ] **Paso 7: Punto de control (sin commit)**

Run: `git status --short`
Expected: nuevos `js/mundo/`, `js/juego/` y los tres tests. No hacer commit.

---

### Tarea 3: Imágenes de la web y enlaces de App Store

**Files:**
- Create: `herramientas/preparar_imagenes.py`
- Create (generados): `img/foto/xesco.webp`, `img/apps/{aldiax,yunque,chatadn,una-neurona}/icono.webp`, `img/apps/*/captura-{1,2,3}.webp`, `img/apps/una-neurona/neurona.webp`, `img/apps/aldiax/robot.svg`
- Create (intermedios, fuera de git): `material/una-neurona/{sala,minijuegos,resultado}.png`

**Interfaces:**
- Consumes: Blender abierto con el servidor MCP; `material/foto_xesco.jpg`.
- Produces: las rutas de imagen anteriores, que `index.html` (Tarea 4) referencia tal cual.

- [ ] **Paso 1: Volver a comprobar los enlaces de App Store**

Run (Bash):

```bash
for id in 6801093580 6808992256 6817065918 6818739554; do curl -sL -o /dev/null -A "Mozilla/5.0" -w "$id %{http_code} %{url_effective}\n" "https://apps.apple.com/es/app/id$id"; done
```

Expected: `6801093580 200 …/aldiax/…`, `6808992256 200 …/yunque/…`, `6817065918 200 …/chatadn/…`, `6818739554 404`. Si Una Neurona ya devuelve 200, anotar su URL final: en la Tarea 4 su botón será un enlace igual que los demás en lugar del texto «Próximamente».

- [ ] **Paso 2: Extraer tres fotogramas del vídeo promocional de Una Neurona**

Run (Bash, desde la raíz del repo):

```bash
mkdir -p material/una-neurona
V="/c/Users/xesco/Lumiq/store/promo/out/una-neurona-promo-9x16-sin-musica.mp4"
ffmpeg -loglevel error -y -ss 7.8 -i "$V" -frames:v 1 material/una-neurona/sala.png
ffmpeg -loglevel error -y -ss 9.4 -i "$V" -frames:v 1 material/una-neurona/minijuegos.png
ffmpeg -loglevel error -y -ss 15.6 -i "$V" -frames:v 1 material/una-neurona/resultado.png
ls -la material/una-neurona
```

Expected: tres PNG de 1080×1920. Abrirlos con Read: `sala.png` debe mostrar la sala con jugadores y «¡Empezar partida!», `minijuegos.png` el «100 minijuegos» con móviles y `resultado.png` la tarjeta «El Más Tonto». Si alguno cae en mitad de una transición, repetir ese comando moviendo `-ss` ±0,3 s.

- [ ] **Paso 3: Copiar la mascota de Aldiax**

Run (Bash):

```bash
mkdir -p img/apps/aldiax && cp /c/dev/aldiax/recursosGraficos/mascota/robot-happy.svg img/apps/aldiax/robot.svg && ls -la img/apps/aldiax
```

Expected: `robot.svg` de unos 10 KB.

- [ ] **Paso 4: Crear `herramientas/preparar_imagenes.py`**

```python
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
    x0, y0, lado = 64, 420, 820  # recorte cuadrado (coordenadas desde arriba): de la cabeza a los hombros
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
```

- [ ] **Paso 5: Ejecutarlo en Blender** con `mcp__Blender__execute_blender_code`:

```python
import sys, importlib
sys.path.insert(0, r"C:/Users/xesco/OneDrive/Escritorio/web-xesco/herramientas")
import preparar_imagenes
importlib.reload(preparar_imagenes)
result = preparar_imagenes.todo()
```

Expected: `{"status": "ok", "result": {...}}` con tamaños en bytes: foto ~20–60 KB, cada icono ~10–40 KB, cada captura ~20–80 KB, neurona ~20–60 KB.

- [ ] **Paso 6: Revisar visualmente**

Abrir con Read `img/foto/xesco.webp` (encuadre de la cabeza a los hombros, centrado), `img/apps/una-neurona/neurona.webp` (fondo transparente) y una captura de cada app. Si el recorte de la foto corta el pelo o queda descentrado, ajustar `x0, y0, lado` en `foto()` y repetir el Paso 5.

- [ ] **Paso 7: Punto de control (sin commit)**

Run: `ls -R img | head -40` y `git status --short`
Expected: existen las 4 carpetas de `img/apps/` con `icono.webp` y 3 capturas, más `img/foto/xesco.webp`. No hacer commit.

---

## Contratos compartidos (los usan todas las tareas y agentes)

### Contrato del DOM (lo que el motor de juego lee del HTML)

| Selector / atributo | Significado |
|---|---|
| `html.cv` / `html.juego` | Modo CV rápido / modo juego. El HTML se sirve con `class="cv"`; un script en `<head>` lo cambia a `juego` salvo que la URL lleve `?cv`. |
| `#mundo.mundo` | Contenedor del nivel (18 500 × 900 unidades). JS le pone `transform: translate3d(-camX·escala px,0,0) scale(escala)`. |
| `.zona[data-zona]` y `.app[data-zona]` | Zonas del nivel; `style="--x;--ancho"` en unidades. `.app` va anidada dentro de `#proyectos`. Ids de `data-zona`: `inicio, perfil, formacion, experiencia, proyectos, aldiax, yunque, chatadn, una-neurona, habilidades, metodologia, charlas, idiomas, contacto`. |
| Hijos directos de `.zona` (salvo `.app`), de `.app` y `li` de `.torres` | Posición absoluta con `style="--x;--y;--w"` (y `--h` en torres), relativa a su zona. |
| `[data-plataforma]` | Colisionador. Valores: `unSentido` (se atraviesa desde abajo), `solido`, `elastico` (rebota), `sorpresa` (sólido que avisa al golpearlo desde abajo). El id del colisionador es el `id` del elemento o `plataforma-N`. |
| `.pieza` | Pieza coleccionable (36 × 36). |
| `.bandera` | Bandera de control de una zona (hijo directo de la zona; 84 × 260). `.bandera.meta`: bandera de meta (580 de alto). Clase `izada` al alcanzarla. |
| `button.sorpresa#sorpresa-<app>` | Bloque sorpresa (96 × 96) con `aria-controls="capturas-<app>"` y `aria-expanded`. |
| `.capturas#capturas-<app>[hidden]` | Panel de capturas que abre su bloque. |
| `#forja` (`.forja`) | Yunque sólido (90 de alto): «clang» al aterrizar. |
| `#neurona-cama` (`.cama-elastica`) | Cama elástica (160 de alto). Clase `rebota` al botar. |
| `.robot` | Mascota de Aldiax; clase `saluda` cuando el muñeco está cerca. |
| `.letra` | Letras del nombre (plataformas `unSentido`); clase `pisada` al aterrizar. |
| `#muneco.muneco` | Muñeco (160 × 160). Variables CSS `--columnas` y `--filas`; clase `listo` cuando está cargado; `agarrado` al arrastrarlo; `humo` al viajar. |
| `.decor` | Decorado: se oculta en modo CV. |
| `.solo-juego`, `.solo-raton`, `.solo-tactil` | Textos solo visibles en juego / con ratón / en táctil. |
| `.minimapa [data-ir]` | Botones del minimapa (mismos ids que `data-zona`, sin `proyectos`). `.minimapa-zona` muestra la zona actual; `.minimapa-marcador` marca el progreso. |
| `#contador-piezas`, `#boton-idioma`, `#boton-sonido[aria-pressed]`, `#boton-cv`, `#boton-volver` | Controles de la barra superior. |
| `#mensaje-meta[data-plantilla]` | Aviso de meta; la plantilla contiene `{n}` y `{total}`. |
| `.tactil-boton[data-control]` | Controles táctiles: `izquierda`, `derecha`, `saltar`. |
| `#formulario-contacto[data-error]` | Formulario Web3Forms; `.form-exito[hidden]` dentro. |
| `[data-i18n]` / `[data-i18n-attr="attr:clave;attr2:clave2"]` | Textos y atributos traducibles. |

### Alturas que fija el CSS (el motor depende de ellas)

`.escalon` 40 · `.pieza` 36 × 36 · `.sorpresa` 96 × 96 · `.forja` 90 · `.cama-elastica` 160 · `.escenario` 90 · `.coche` 90 · `.burbuja` 58 · `.bandera` 260 (`.meta` 580) · `.torre` `calc(var(--h) * 1px)` · `.muneco` 160 × 160.

### Formato de `img/personaje/sprites.json`

```json
{
  "imagen": "muneco.webp",
  "fotograma": 160,
  "columnas": 8,
  "filas": 5,
  "pie": 6,
  "animaciones": {
    "parado": { "inicio": 0, "n": 4, "fps": 3, "bucle": true },
    "saludar": { "inicio": 4, "n": 8, "fps": 10, "bucle": false },
    "giro": { "inicio": 12, "n": 3, "fps": 30, "bucle": false },
    "andar": { "inicio": 15, "n": 8, "fps": 12, "bucle": true },
    "saltar": { "inicio": 23, "n": 2, "fps": 8, "bucle": false },
    "caer": { "inicio": 25, "n": 2, "fps": 6, "bucle": true },
    "aterrizar": { "inicio": 27, "n": 1, "fps": 1, "bucle": false },
    "colgado": { "inicio": 28, "n": 6, "fps": 8, "bucle": true },
    "celebrar": { "inicio": 34, "n": 6, "fps": 8, "bucle": true }
  }
}
```

Los fotogramas están en la hoja de izquierda a derecha y de arriba abajo (índice → columna `i % columnas`, fila `⌊i / columnas⌋`). Cada fotograma se muestra a 160 × 160 unidades; los pies quedan `pie` unidades por encima del borde inferior. Las animaciones de lado miran a la derecha (se reflejan con `scaleX(-1)` para la izquierda); `parado`, `saludar`, `celebrar` y `colgado` miran a cámara.

---

### Tarea 4: Contenido, estilos, idiomas y modo CV rápido

**Files:**
- Modify (reescribir): `index.html`, `js/main.js`
- Create: `css/base.css`, `css/nivel.css`, `css/hud.css`, `css/cv.css`, `js/ui/i18n.js`, `js/ui/cv-rapido.js`, `js/ui/contacto.js`, `i18n/en.json`, `herramientas/servidor.mjs`, `.claude/launch.json`

**Interfaces:**
- Consumes: imágenes de la Tarea 3 (`img/foto/xesco.webp`, `img/apps/*`), capas de `img/fondo/` (Tarea 5) y sprites (Tarea 6) por ruta; si aún no existen, el navegador muestra huecos y no pasa nada.
- Produces: el contrato del DOM de arriba; `i18n.js` → `idiomaInicial()`, `idiomaActual()`, `aplicarIdioma(idioma)` (emite el evento `idioma` en `document`); `cv-rapido.js` → `enModoCV()`, `activarCV()`, `desactivarCV()`; `contacto.js` → `activarFormulario(form)`.

- [ ] **Paso 1: Escribir `index.html` completo**

```html
<!DOCTYPE html>
<html lang="es" class="cv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <script>if (!/[?&]cv(=|&|$)/.test(location.search)) document.documentElement.classList.replace('cv', 'juego');</script>

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-7QXF2EDSVY"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-7QXF2EDSVY');
  </script>

  <title data-i18n="meta.titulo">Xesco · Francisco Alabau Calatayud · Portfolio</title>
  <meta name="description" data-i18n-attr="content:meta.descripcion" content="Portfolio de Francisco Alabau Calatayud (Xesco), estudiante de Ingeniería Informática: apps publicadas, desarrollo de software con IA y automatización. Recórrelo como un nivel de plataformas." />
  <link rel="canonical" href="https://xescoalabau.com/" />
  <meta property="og:title" content="Xesco · Portfolio" />
  <meta property="og:description" content="Recorre el portfolio de Francisco Alabau Calatayud como un nivel de plataformas." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://xescoalabau.com/" />
  <meta property="og:image" content="https://xescoalabau.com/img/foto/xesco.webp" />
  <meta name="theme-color" content="#F47B20" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/nivel.css" />
  <link rel="stylesheet" href="css/hud.css" />
  <link rel="stylesheet" href="css/cv.css" />
  <script type="module" src="js/main.js"></script>
</head>

<body>
  <a class="saltar-cv" href="?cv" data-i18n="hud.saltar">Saltar al CV</a>

  <div class="escena" aria-hidden="true">
    <div class="cielo"></div>
    <div class="capa capa-montana" data-parallax="0.1" data-proporcion="4" style="--proporcion:4"></div>
    <div class="capa capa-colinas" data-parallax="0.25" data-proporcion="2.6667" style="--proporcion:2.6667"></div>
    <div class="capa capa-aldea" data-parallax="0.5" data-proporcion="3.1111" style="--proporcion:3.1111"></div>
    <div class="capa capa-arboles" data-parallax="0.8" data-proporcion="2.2222" style="--proporcion:2.2222"></div>
  </div>

  <header class="hud">
    <a class="hud-marca" href="#inicio">Xesco</a>
    <nav class="minimapa" aria-label="Mapa del nivel" data-i18n-attr="aria-label:hud.mapa">
      <ol class="minimapa-zonas">
        <li><button type="button" data-ir="inicio"><span class="sr" data-i18n="mapa.inicio">Inicio</span></button></li>
        <li><button type="button" data-ir="perfil"><span class="sr" data-i18n="mapa.perfil">Perfil</span></button></li>
        <li><button type="button" data-ir="formacion"><span class="sr" data-i18n="mapa.formacion">Formación</span></button></li>
        <li><button type="button" data-ir="experiencia"><span class="sr" data-i18n="mapa.experiencia">Experiencia</span></button></li>
        <li><button type="button" data-ir="aldiax"><span class="sr" data-i18n="mapa.aldiax">Aldiax</span></button></li>
        <li><button type="button" data-ir="yunque"><span class="sr" data-i18n="mapa.yunque">Yunque</span></button></li>
        <li><button type="button" data-ir="chatadn"><span class="sr" data-i18n="mapa.chatadn">ChatADN</span></button></li>
        <li><button type="button" data-ir="una-neurona"><span class="sr" data-i18n="mapa.neurona">Una Neurona</span></button></li>
        <li><button type="button" data-ir="habilidades"><span class="sr" data-i18n="mapa.habilidades">Habilidades</span></button></li>
        <li><button type="button" data-ir="metodologia"><span class="sr" data-i18n="mapa.metodologia">Metodología</span></button></li>
        <li><button type="button" data-ir="charlas"><span class="sr" data-i18n="mapa.charlas">Charlas</span></button></li>
        <li><button type="button" data-ir="idiomas"><span class="sr" data-i18n="mapa.idiomas">Idiomas</span></button></li>
        <li><button type="button" data-ir="contacto"><span class="sr" data-i18n="mapa.contacto">Contacto</span></button></li>
        <li class="minimapa-marcador" aria-hidden="true"></li>
      </ol>
      <span class="minimapa-zona" aria-live="polite">Inicio</span>
    </nav>
    <p class="hud-piezas"><span class="hud-pieza" aria-hidden="true"></span><span id="contador-piezas">0/0</span><span class="sr" data-i18n="hud.piezas">piezas</span></p>
    <button type="button" class="hud-boton" id="boton-idioma" data-i18n="hud.idioma" data-i18n-attr="aria-label:hud.idioma.etiqueta" aria-label="Switch to English">EN</button>
    <button type="button" class="hud-boton" id="boton-sonido" aria-pressed="false" data-i18n-attr="aria-label:hud.sonido" aria-label="Sonido">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="ondas" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <button type="button" class="hud-cv" id="boton-cv" data-i18n="hud.cv">Ver CV rápido</button>
    <button type="button" class="hud-cv" id="boton-volver" data-i18n="hud.volver">Volver al nivel</button>
  </header>

  <main id="mundo" class="mundo">
    <div class="suelo decor" aria-hidden="true"></div>

    <section class="zona" id="inicio" data-zona="inicio" style="--x:0;--ancho:1500">
      <div class="cartel pista" data-plataforma="unSentido" style="--x:40;--y:500;--w:300">
        <p class="solo-raton" data-i18n="inicio.pista.raton">Muévete con ← →, salta con Espacio y arrastra al muñeco con el ratón.</p>
        <p class="solo-tactil" data-i18n="inicio.pista.tactil">Usa ◀ ▶ y Saltar, o arrastra al muñeco con el dedo.</p>
      </div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:380;--y:640;--w:120"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:470;--y:520;--w:110"></div>
      <h1 class="titulo" style="--x:520;--y:110;--w:960">
        <span class="sr">Francisco Alabau Calatayud</span>
        <span class="titulo-linea titulo-linea-1" aria-hidden="true"><span class="letra" data-plataforma="unSentido">F</span><span class="letra" data-plataforma="unSentido">r</span><span class="letra" data-plataforma="unSentido">a</span><span class="letra" data-plataforma="unSentido">n</span><span class="letra" data-plataforma="unSentido">c</span><span class="letra" data-plataforma="unSentido">i</span><span class="letra" data-plataforma="unSentido">s</span><span class="letra" data-plataforma="unSentido">c</span><span class="letra" data-plataforma="unSentido">o</span></span>
        <span class="titulo-linea titulo-linea-2" aria-hidden="true"><span class="letra" data-plataforma="unSentido">A</span><span class="letra" data-plataforma="unSentido">l</span><span class="letra" data-plataforma="unSentido">a</span><span class="letra" data-plataforma="unSentido">b</span><span class="letra" data-plataforma="unSentido">a</span><span class="letra" data-plataforma="unSentido">u</span> <span class="letra" data-plataforma="unSentido">C</span><span class="letra" data-plataforma="unSentido">a</span><span class="letra" data-plataforma="unSentido">l</span><span class="letra" data-plataforma="unSentido">a</span><span class="letra" data-plataforma="unSentido">t</span><span class="letra" data-plataforma="unSentido">a</span><span class="letra" data-plataforma="unSentido">y</span><span class="letra" data-plataforma="unSentido">u</span><span class="letra" data-plataforma="unSentido">d</span></span>
      </h1>
      <div class="cartel cartel-titular" data-plataforma="unSentido" style="--x:600;--y:380;--w:780">
        <p class="titular" data-i18n="inicio.titular">Estudiante de Ingeniería Informática</p>
        <p class="subtitular" data-i18n="inicio.sub">Desarrollo de software con IA · Automatización · Apps</p>
      </div>
      <span class="pieza decor" style="--x:440;--y:585"></span>
      <span class="pieza decor" style="--x:520;--y:460"></span>
      <span class="pieza decor" style="--x:820;--y:310"></span>
      <span class="pieza decor" style="--x:1150;--y:150"></span>
    </section>

    <section class="zona" id="perfil" data-zona="perfil" style="--x:1500;--ancho:1400">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:470;--w:100"></div>
      <figure class="cartel foto" data-plataforma="unSentido" style="--x:280;--y:300;--w:380">
        <img src="img/foto/xesco.webp" width="320" height="320" alt="Retrato de Francisco Alabau Calatayud" data-i18n-attr="alt:perfil.foto" />
        <figcaption data-i18n="perfil.pie">Francisco Alabau Calatayud · Xesco</figcaption>
      </figure>
      <article class="cartel" data-plataforma="unSentido" style="--x:730;--y:330;--w:600">
        <h2 data-i18n="perfil.titulo">Perfil</h2>
        <p data-i18n="perfil.texto">Estudiante de 3.º de Ingeniería Informática con FP Superior en Desarrollo de Aplicaciones Multiplataforma (DAM). Me centro en el desarrollo de software, la automatización y el uso de agentes de inteligencia artificial para acelerar la creación de productos digitales. Tengo experiencia real creando aplicaciones, automatizando procesos y comunicando sobre IA aplicada a la educación.</p>
      </article>
      <span class="pieza decor" style="--x:180;--y:420"></span>
      <span class="pieza decor" style="--x:450;--y:240"></span>
      <span class="pieza decor" style="--x:1010;--y:270"></span>
    </section>

    <section class="zona" id="formacion" data-zona="formacion" style="--x:2900;--ancho:1300">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
      <article class="cartel" data-plataforma="unSentido" style="--x:250;--y:490;--w:520">
        <h2 data-i18n="formacion.titulo">Formación</h2>
        <h3 data-i18n="formacion.fp.titulo">FP Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)</h3>
        <p>CEU</p>
        <p class="etiqueta" data-i18n="formacion.fp.estado">Finalizado antes del grado</p>
      </article>
      <article class="cartel" data-plataforma="unSentido" style="--x:830;--y:330;--w:440">
        <h3 data-i18n="formacion.grado.titulo">Grado en Ingeniería Informática</h3>
        <p data-i18n="formacion.grado.centro">Universitat Politècnica de València (Campus d'Alcoi)</p>
        <p class="etiqueta" data-i18n="formacion.grado.estado">Actualmente en 3.º curso</p>
      </article>
      <span class="pieza decor" style="--x:470;--y:430"></span>
      <span class="pieza decor" style="--x:1030;--y:270"></span>
    </section>

    <section class="zona" id="experiencia" data-zona="experiencia" style="--x:4200;--ancho:1300">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
      <article class="cartel" data-plataforma="unSentido" style="--x:290;--y:400;--w:520">
        <h2 data-i18n="experiencia.titulo">Experiencia</h2>
        <h3 data-i18n="experiencia.premea.titulo">Prácticas en Premea</h3>
        <p data-i18n="experiencia.premea.texto">Desarrollo de un software para automatizar la generación de documentos.</p>
      </article>
      <article class="cartel" data-plataforma="unSentido" style="--x:880;--y:450;--w:380">
        <h3 data-i18n="experiencia.delaware.titulo">Atención al público en Delaware (EE. UU.)</h3>
        <p data-i18n="experiencia.delaware.texto">Trabajo de cara al público durante un verano en Estados Unidos.</p>
      </article>
      <span class="pieza decor" style="--x:190;--y:450"></span>
      <span class="pieza decor" style="--x:560;--y:340"></span>
      <span class="pieza decor" style="--x:1050;--y:390"></span>
    </section>

    <section class="zona" id="proyectos" data-zona="proyectos" style="--x:5500;--ancho:5900">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
      <div class="cartel" data-plataforma="unSentido" style="--x:290;--y:380;--w:380">
        <h2 data-i18n="proyectos.titulo">Proyectos</h2>
        <p data-i18n="proyectos.texto">Cuatro apps propias, de la idea a la App Store.</p>
        <p class="nota solo-juego" data-i18n="proyectos.pista">Golpea cada icono desde abajo para ver sus capturas.</p>
      </div>
      <span class="pieza decor" style="--x:450;--y:320"></span>

      <article class="app" id="app-aldiax" data-zona="aldiax" style="--x:700;--ancho:1300">
        <div class="bandera decor" style="--x:30;--y:520"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
        <div class="cartel ficha" data-plataforma="unSentido" style="--x:290;--y:340;--w:560">
          <div class="ficha-cabecera">
            <img class="ficha-icono" src="img/apps/aldiax/icono.webp" width="72" height="72" alt="" />
            <div>
              <h3>Aldiax</h3>
              <p class="ficha-frase" data-i18n="aldiax.frase">Aprende a usar la IA con ejercicios cortos, al estilo Duolingo.</p>
            </div>
          </div>
          <ul class="ficha-puntos">
            <li data-i18n="aldiax.p1">Un agente renueva cada día las noticias de IA y crea niveles a partir de ellas.</li>
            <li data-i18n="aldiax.p2">Vocabulario de IA y 100 niveles gratis.</li>
            <li data-i18n="aldiax.p3">Disponible en español, inglés, italiano y francés.</li>
          </ul>
          <p class="ficha-tec">Expo · React Native · Supabase · Edge Functions con IA</p>
          <a class="boton-tienda" href="https://apps.apple.com/es/app/aldiax/id6801093580" target="_blank" rel="noopener" data-i18n="app.tienda">Ver en la App Store</a>
        </div>
        <button type="button" class="sorpresa" id="sorpresa-aldiax" data-plataforma="sorpresa" aria-expanded="false" aria-controls="capturas-aldiax" style="--x:930;--y:420">
          <img src="img/apps/aldiax/icono.webp" width="70" height="70" alt="" /><span class="sr" data-i18n="app.capturas.aldiax">Ver capturas de Aldiax</span>
        </button>
        <div class="capturas" id="capturas-aldiax" hidden style="--x:860;--y:80;--w:440">
          <img src="img/apps/aldiax/captura-1.webp" loading="lazy" width="128" height="277" alt="Aldiax: pantalla de inicio" data-i18n-attr="alt:aldiax.c1" />
          <img src="img/apps/aldiax/captura-2.webp" loading="lazy" width="128" height="277" alt="Aldiax: ejercicio resuelto" data-i18n-attr="alt:aldiax.c2" />
          <img src="img/apps/aldiax/captura-3.webp" loading="lazy" width="128" height="277" alt="Aldiax: noticias de IA del día" data-i18n-attr="alt:aldiax.c3" />
        </div>
        <img class="robot decor" src="img/apps/aldiax/robot.svg" alt="" style="--x:1100;--y:630;--w:150" />
        <span class="pieza decor" style="--x:420;--y:280"></span>
        <span class="pieza decor" style="--x:960;--y:360"></span>
      </article>

      <article class="app" id="app-yunque" data-zona="yunque" style="--x:2000;--ancho:1300">
        <div class="bandera decor" style="--x:30;--y:520"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
        <div class="cartel ficha" data-plataforma="unSentido" style="--x:290;--y:340;--w:560">
          <div class="ficha-cabecera">
            <img class="ficha-icono" src="img/apps/yunque/icono.webp" width="72" height="72" alt="" />
            <div>
              <h3>Yunque</h3>
              <p class="ficha-frase" data-i18n="yunque.frase">Hábitos para subir la testosterona de forma natural.</p>
            </div>
          </div>
          <ul class="ficha-puntos">
            <li data-i18n="yunque.p1">Versión gratuita y versión de pago.</li>
            <li data-i18n="yunque.p2">Widgets en la pantalla de inicio para no perder el ritmo.</li>
            <li data-i18n="yunque.p3">Todo se guarda en el móvil: sin cuentas ni servidores.</li>
          </ul>
          <p class="ficha-tec">Expo · React Native · SQLite · HealthKit</p>
          <a class="boton-tienda" href="https://apps.apple.com/es/app/yunque/id6808992256" target="_blank" rel="noopener" data-i18n="app.tienda">Ver en la App Store</a>
        </div>
        <button type="button" class="sorpresa" id="sorpresa-yunque" data-plataforma="sorpresa" aria-expanded="false" aria-controls="capturas-yunque" style="--x:930;--y:420">
          <img src="img/apps/yunque/icono.webp" width="70" height="70" alt="" /><span class="sr" data-i18n="app.capturas.yunque">Ver capturas de Yunque</span>
        </button>
        <div class="capturas" id="capturas-yunque" hidden style="--x:860;--y:80;--w:440">
          <img src="img/apps/yunque/captura-1.webp" loading="lazy" width="128" height="277" alt="Yunque: captura 1" data-i18n-attr="alt:yunque.c1" />
          <img src="img/apps/yunque/captura-2.webp" loading="lazy" width="128" height="277" alt="Yunque: captura 2" data-i18n-attr="alt:yunque.c2" />
          <img src="img/apps/yunque/captura-3.webp" loading="lazy" width="128" height="277" alt="Yunque: captura 3" data-i18n-attr="alt:yunque.c3" />
        </div>
        <div class="forja decor" id="forja" data-plataforma="solido" style="--x:1080;--y:690;--w:200"><span class="forja-forma"></span><span class="chispas"></span></div>
        <span class="pieza decor" style="--x:420;--y:280"></span>
        <span class="pieza decor" style="--x:960;--y:360"></span>
      </article>

      <article class="app" id="app-chatadn" data-zona="chatadn" style="--x:3300;--ancho:1300">
        <div class="bandera decor" style="--x:30;--y:520"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
        <div class="cartel ficha" data-plataforma="unSentido" style="--x:290;--y:340;--w:560">
          <div class="ficha-cabecera">
            <img class="ficha-icono" src="img/apps/chatadn/icono.webp" width="72" height="72" alt="" />
            <div>
              <h3>ChatADN</h3>
              <p class="ficha-frase" data-i18n="chatadn.frase">Convierte un chat de WhatsApp en una historia visual.</p>
            </div>
          </div>
          <ul class="ficha-puntos">
            <li data-i18n="chatadn.p1">Mensajes, tiempos de respuesta, palabras y emojis más usados.</li>
            <li data-i18n="chatadn.p2">Análisis 100 % en el dispositivo: tus chats no salen del móvil.</li>
            <li data-i18n="chatadn.p3">Compra única para desbloquear la versión Pro.</li>
          </ul>
          <p class="ficha-tec">Expo · React Native · RevenueCat</p>
          <a class="boton-tienda" href="https://apps.apple.com/es/app/chatadn/id6817065918" target="_blank" rel="noopener" data-i18n="app.tienda">Ver en la App Store</a>
        </div>
        <button type="button" class="sorpresa" id="sorpresa-chatadn" data-plataforma="sorpresa" aria-expanded="false" aria-controls="capturas-chatadn" style="--x:930;--y:420">
          <img src="img/apps/chatadn/icono.webp" width="70" height="70" alt="" /><span class="sr" data-i18n="app.capturas.chatadn">Ver capturas de ChatADN</span>
        </button>
        <div class="capturas" id="capturas-chatadn" hidden style="--x:860;--y:80;--w:440">
          <img src="img/apps/chatadn/captura-1.webp" loading="lazy" width="128" height="277" alt="ChatADN: captura 1" data-i18n-attr="alt:chatadn.c1" />
          <img src="img/apps/chatadn/captura-2.webp" loading="lazy" width="128" height="277" alt="ChatADN: captura 2" data-i18n-attr="alt:chatadn.c2" />
          <img src="img/apps/chatadn/captura-3.webp" loading="lazy" width="128" height="277" alt="ChatADN: captura 3" data-i18n-attr="alt:chatadn.c3" />
        </div>
        <div class="burbuja decor" data-plataforma="unSentido" style="--x:1060;--y:650;--w:140"></div>
        <div class="burbuja decor" data-plataforma="unSentido" style="--x:1150;--y:530;--w:140"></div>
        <div class="burbuja decor" data-plataforma="unSentido" style="--x:1060;--y:410;--w:140"></div>
        <span class="pieza decor" style="--x:420;--y:280"></span>
        <span class="pieza decor" style="--x:960;--y:360"></span>
      </article>

      <article class="app" id="app-una-neurona" data-zona="una-neurona" style="--x:4600;--ancho:1300">
        <div class="bandera decor" style="--x:30;--y:520"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
        <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
        <div class="cartel ficha" data-plataforma="unSentido" style="--x:290;--y:340;--w:560">
          <div class="ficha-cabecera">
            <img class="ficha-icono" src="img/apps/una-neurona/icono.webp" width="72" height="72" alt="" />
            <div>
              <h3>Una Neurona</h3>
              <p class="ficha-frase" data-i18n="neurona.frase">Juego de fiesta para descubrir quién es el más tonto del grupo.</p>
            </div>
          </div>
          <ul class="ficha-puntos">
            <li data-i18n="neurona.p1">100 minijuegos en 12 categorías; en cada partida tocan 5 al azar.</li>
            <li data-i18n="neurona.p2">Salas de hasta 8 amigos y un IQ de broma al final.</li>
            <li data-i18n="neurona.p3">Gratis con anuncios o pago único para quitarlos.</li>
          </ul>
          <p class="ficha-tec">Expo · React Native · Supabase en tiempo real · AdMob</p>
          <span class="boton-tienda proximamente" data-i18n="app.proximamente">Próximamente en App Store</span>
        </div>
        <button type="button" class="sorpresa" id="sorpresa-una-neurona" data-plataforma="sorpresa" aria-expanded="false" aria-controls="capturas-una-neurona" style="--x:930;--y:420">
          <img src="img/apps/una-neurona/icono.webp" width="70" height="70" alt="" /><span class="sr" data-i18n="app.capturas.neurona">Ver capturas de Una Neurona</span>
        </button>
        <div class="capturas" id="capturas-una-neurona" hidden style="--x:860;--y:80;--w:440">
          <img src="img/apps/una-neurona/captura-1.webp" loading="lazy" width="128" height="277" alt="Una Neurona: sala de juego" data-i18n-attr="alt:neurona.c1" />
          <img src="img/apps/una-neurona/captura-2.webp" loading="lazy" width="128" height="277" alt="Una Neurona: 100 minijuegos" data-i18n-attr="alt:neurona.c2" />
          <img src="img/apps/una-neurona/captura-3.webp" loading="lazy" width="128" height="277" alt="Una Neurona: resultado final" data-i18n-attr="alt:neurona.c3" />
        </div>
        <div class="cama-elastica decor" id="neurona-cama" data-plataforma="elastico" style="--x:1060;--y:620;--w:180"></div>
        <span class="pieza decor" style="--x:420;--y:280"></span>
        <span class="pieza decor" style="--x:960;--y:360"></span>
        <span class="pieza decor" style="--x:1120;--y:250"></span>
      </article>
    </section>

    <section class="zona" id="habilidades" data-zona="habilidades" style="--x:11400;--ancho:1500">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="rotulo" style="--x:250;--y:150;--w:900">
        <h2 data-i18n="habilidades.titulo">Habilidades</h2>
        <p data-i18n="habilidades.texto">Cada torre mide mi nivel en esa habilidad, sobre 7. Súbete a ellas.</p>
      </div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:650;--w:110"></div>
      <ul class="torres" style="--x:0;--y:0;--w:1500">
        <li class="torre" data-plataforma="solido" style="--x:250;--y:540;--w:150;--h:240">
          <span class="torre-nombre" data-i18n="habilidad.programacion">Programación</span>
          <span class="torre-detalle">Python · Java · C/C++ · JavaScript/TypeScript</span>
          <span class="torre-nivel" role="img" aria-label="4 de 7" data-i18n-attr="aria-label:nivel.4"><span class="lleno">●●●●</span>○○○</span>
        </li>
        <li class="torre" data-plataforma="solido" style="--x:415;--y:480;--w:150;--h:300">
          <span class="torre-nombre" data-i18n="habilidad.apps">Desarrollo de apps</span>
          <span class="torre-nivel" role="img" aria-label="5 de 7" data-i18n-attr="aria-label:nivel.5"><span class="lleno">●●●●●</span>○○</span>
        </li>
        <li class="torre" data-plataforma="solido" style="--x:580;--y:480;--w:150;--h:300">
          <span class="torre-nombre" data-i18n="habilidad.arquitectura">Arquitectura de agentes y orquestación</span>
          <span class="torre-nivel" role="img" aria-label="5 de 7" data-i18n-attr="aria-label:nivel.5"><span class="lleno">●●●●●</span>○○</span>
        </li>
        <li class="torre" data-plataforma="solido" style="--x:745;--y:480;--w:150;--h:300">
          <span class="torre-nombre" data-i18n="habilidad.despliegue">Despliegue de productos digitales</span>
          <span class="torre-nivel" role="img" aria-label="5 de 7" data-i18n-attr="aria-label:nivel.5"><span class="lleno">●●●●●</span>○○</span>
        </li>
        <li class="torre" data-plataforma="solido" style="--x:910;--y:420;--w:150;--h:360">
          <span class="torre-nombre" data-i18n="habilidad.agentes">Agentes de IA para desarrollo de software</span>
          <span class="torre-nivel" role="img" aria-label="6 de 7" data-i18n-attr="aria-label:nivel.6"><span class="lleno">●●●●●●</span>○</span>
        </li>
        <li class="torre" data-plataforma="solido" style="--x:1075;--y:420;--w:150;--h:360">
          <span class="torre-nombre" data-i18n="habilidad.automatizacion">Automatización de procesos</span>
          <span class="torre-nivel" role="img" aria-label="6 de 7" data-i18n-attr="aria-label:nivel.6"><span class="lleno">●●●●●●</span>○</span>
        </li>
        <li class="torre" data-plataforma="solido" style="--x:1240;--y:420;--w:150;--h:360">
          <span class="torre-nombre" data-i18n="habilidad.prompt">Prompt engineering</span>
          <span class="torre-nivel" role="img" aria-label="6 de 7" data-i18n-attr="aria-label:nivel.6"><span class="lleno">●●●●●●</span>○</span>
        </li>
      </ul>
      <span class="pieza decor" style="--x:620;--y:420"></span>
      <span class="pieza decor" style="--x:1110;--y:360"></span>
      <span class="pieza decor" style="--x:1300;--y:360"></span>
    </section>

    <section class="zona" id="metodologia" data-zona="metodologia" style="--x:12900;--ancho:1300">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:500;--w:100"></div>
      <article class="cartel" data-plataforma="unSentido" style="--x:290;--y:380;--w:640">
        <h2 data-i18n="metodologia.titulo">Metodología</h2>
        <p data-i18n="metodologia.texto">No me centro en un único lenguaje: trabajo con agentes de inteligencia artificial y un agente orquestador que reparte el trabajo entre subagentes más económicos, para optimizar el desarrollo y el gasto de tokens.</p>
        <p class="nota solo-juego" data-i18n="metodologia.pista">Como un orquestador, el muñeco acaba de lanzar a sus clones.</p>
      </article>
      <span class="pieza decor" style="--x:560;--y:320"></span>
      <span class="pieza decor" style="--x:1100;--y:600"></span>
    </section>

    <section class="zona" id="charlas" data-zona="charlas" style="--x:14200;--ancho:1400">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escenario decor" data-plataforma="solido" style="--x:110;--y:690;--w:560"></div>
      <div class="atril decor" style="--x:470;--y:600;--w:70"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:560;--y:560;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:640;--y:440;--w:110"></div>
      <article class="cartel" data-plataforma="unSentido" style="--x:140;--y:320;--w:470">
        <h2 data-i18n="charlas.titulo">Charlas</h2>
        <h3 data-i18n="charlas.ponencia">Charla para el profesorado del IES San Vicente Ferrer</h3>
        <p data-i18n="charlas.tema">Tema: aplicación de la inteligencia artificial en la educación.</p>
        <p class="etiqueta" data-i18n="charlas.fecha">Noviembre de 2026</p>
        <p class="nota" data-i18n="charlas.proximas">Próximamente, nuevas charlas en más centros.</p>
      </article>
      <article class="cartel" data-plataforma="unSentido" style="--x:790;--y:380;--w:520">
        <h3 data-i18n="eventos.titulo">Aprendizaje y eventos</h3>
        <ul class="lista">
          <li data-i18n="eventos.1">Asistencia a ponencias y eventos del sector tecnológico.</li>
          <li data-i18n="eventos.2">Especial interés en la charla de Luis Ferrándiz sobre consultorías digitales.</li>
          <li data-i18n="eventos.3">Asistencia a charlas de Mateo Valero, fundador del Barcelona Supercomputing Center.</li>
        </ul>
      </article>
      <span class="pieza decor" style="--x:300;--y:260"></span>
      <span class="pieza decor" style="--x:650;--y:380"></span>
      <span class="pieza decor" style="--x:1000;--y:320"></span>
    </section>

    <section class="zona" id="idiomas" data-zona="idiomas" style="--x:15600;--ancho:1200">
      <div class="bandera decor" style="--x:30;--y:520"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:110;--y:640;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:150;--y:510;--w:100"></div>
      <article class="cartel" data-plataforma="unSentido" style="--x:290;--y:400;--w:440">
        <h2 data-i18n="idiomas.titulo">Idiomas</h2>
        <ul class="lista idiomas">
          <li><span class="bandera-mini es" aria-hidden="true"></span><span data-i18n="idiomas.es">Español · nativo</span></li>
          <li><span class="bandera-mini va" aria-hidden="true"></span><span data-i18n="idiomas.va">Valenciano · alto</span></li>
          <li><span class="bandera-mini en" aria-hidden="true"></span><span data-i18n="idiomas.en">Inglés · nivel funcional, con experiencia laboral internacional (sin certificación oficial)</span></li>
        </ul>
      </article>
      <article class="cartel" data-plataforma="unSentido" style="--x:790;--y:430;--w:380">
        <h2 data-i18n="otros.titulo">Otros datos</h2>
        <ul class="lista">
          <li data-i18n="otros.carnet">Carnet de conducir B.</li>
          <li data-i18n="otros.disponible">Disponible para impartir charlas y colaborar en proyectos tecnológicos.</li>
        </ul>
      </article>
      <div class="coche decor" data-plataforma="unSentido" style="--x:820;--y:690;--w:220"></div>
      <span class="pieza decor" style="--x:480;--y:340"></span>
      <span class="pieza decor" style="--x:960;--y:630"></span>
      <span class="pieza decor" style="--x:980;--y:370"></span>
    </section>

    <section class="zona" id="contacto" data-zona="contacto" style="--x:16800;--ancho:1700">
      <div class="bandera meta decor" style="--x:120;--y:200"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:220;--y:650;--w:110"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:260;--y:520;--w:100"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:300;--y:390;--w:100"></div>
      <div class="escalon decor" data-plataforma="unSentido" style="--x:340;--y:270;--w:100"></div>
      <div class="puesto decor" style="--x:470;--y:70;--w:880"><span class="noren" aria-hidden="true">ラーメン</span></div>
      <article class="cartel contacto" data-plataforma="unSentido" style="--x:520;--y:180;--w:780">
        <h2 data-i18n="contacto.titulo">¿Hablamos?</h2>
        <p data-i18n="contacto.texto">Haz tu pedido: un proyecto, una charla o un café.</p>
        <ul class="contacto-enlaces">
          <li><a href="tel:+34658240032">+34 658 240 032</a></li>
          <li><a href="mailto:xescoalabaucalatayud2@gmail.com">xescoalabaucalatayud2@gmail.com</a></li>
          <li><a href="https://wa.me/34658240032" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="https://www.linkedin.com/in/francisco-alabau-calatayud-329196330/" target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a href="https://github.com/xesc004" target="_blank" rel="noopener">GitHub</a></li>
        </ul>
        <form id="formulario-contacto" class="formulario" action="https://api.web3forms.com/submit" method="POST" data-error="Hubo un error al enviar el mensaje. Escríbeme directamente a xescoalabaucalatayud2@gmail.com" data-i18n-attr="data-error:contacto.error">
          <input type="hidden" name="access_key" value="11003856-d192-4b60-9d0c-4ad8a9e5654d" />
          <input type="hidden" name="subject" value="Nuevo contacto desde xescoalabau.com" />
          <input type="hidden" name="from_name" value="Web xescoalabau.com" />
          <input type="checkbox" name="botcheck" style="display:none;" tabindex="-1" autocomplete="off" />
          <div class="formulario-fila">
            <label><span data-i18n="contacto.nombre">Nombre</span><input type="text" name="name" required autocomplete="name" /></label>
            <label><span data-i18n="contacto.email">Email</span><input type="email" name="email" required autocomplete="email" /></label>
          </div>
          <label><span data-i18n="contacto.mensaje">Mensaje</span><textarea name="message" rows="3" required></textarea></label>
          <button type="submit" class="boton-enviar" data-i18n="contacto.enviar">Enviar pedido</button>
          <p class="form-exito" role="status" hidden data-i18n="contacto.exito">✓ Pedido recibido. Te respondo en menos de 24 h.</p>
        </form>
      </article>
      <span class="pieza decor" style="--x:385;--y:200"></span>
      <span class="pieza decor" style="--x:1420;--y:600"></span>
      <span class="pieza decor" style="--x:1560;--y:400"></span>
    </section>

    <div id="muneco" class="muneco" role="img" aria-label="Minifigura de Xesco. Arrástrala con el ratón" data-i18n-attr="aria-label:muneco.etiqueta"></div>
  </main>

  <p id="mensaje-meta" class="mensaje-meta" role="status" hidden data-plantilla="¡Nivel completado! Has encontrado {n} de {total} piezas." data-i18n-attr="data-plantilla:meta.mensaje"></p>

  <div class="tactil" aria-hidden="true">
    <button type="button" class="tactil-boton" data-control="izquierda" tabindex="-1">◀</button>
    <button type="button" class="tactil-boton" data-control="derecha" tabindex="-1">▶</button>
    <button type="button" class="tactil-boton tactil-saltar" data-control="saltar" tabindex="-1" data-i18n="tactil.saltar">Saltar</button>
  </div>
</body>
</html>
```

- [ ] **Paso 2: Escribir los cuatro CSS** con estas reglas obligatorias (el diseño visual fino es libre dentro de la paleta y las tipografías del encabezado):

`css/base.css`: tokens en `:root` (`--naranja #F47B20`, `--naranja-oscuro #C85A0E`, `--marino #1D2840`, `--crema #FFF6EC`, `--crema-sombra #E8D3B8`, `--madera #8B5A2B`, `--hoja #5E9E3F`, `--texto #1D2030`, `--texto-suave #4A4F63`, `--fuente-titulos "Fredoka", …`, `--fuente-texto "Inter", …`, `--escala: 1`, `--mundo-y: 0px`); `box-sizing: border-box`; `html.juego, html.juego body { height: 100%; overflow: hidden; overscroll-behavior: none }`; en juego el `body` lleva `touch-action: none` y `user-select: none` (pero `.cartel` vuelve a `user-select: text`); utilidades `.sr` (oculto accesible), `.saltar-cv` (visible solo con foco), `:focus-visible` naranja; `.solo-tactil` oculto salvo en `@media (pointer: coarse)`, donde se oculta `.solo-raton`.

`css/nivel.css`:
- `.escena { position: fixed; inset: 0; z-index: 0; overflow: hidden }`; `.cielo` con `linear-gradient(to bottom, var(--cielo-arriba, #A9DCF5), var(--cielo-abajo, #E8F6FD))`; `.capa { position: absolute; left: 0; bottom: 0; height: calc(var(--escala) * 900px); width: calc(100vw + var(--escala) * 900px * var(--proporcion)); background-repeat: repeat-x; background-position: left bottom; background-size: auto 100%; will-change: transform }` con `background-image` `../img/fondo/montana.svg`, `colinas.svg`, `aldea.svg`, `arboles.svg`.
- `.mundo { position: fixed; left: 0; top: var(--mundo-y); z-index: 1; width: 18500px; height: 900px; transform-origin: 0 0; transform: scale(var(--escala)); will-change: transform }`.
- `.suelo`: franja `top: 780px; height: 120px; width: 100%` de placas de ladrillo naranja con fila de studs encima (pseudoelemento en `top: -12px`).
- Posicionamiento: `.zona, .app { position: absolute; top: 0; left: calc(var(--x) * 1px); width: calc(var(--ancho) * 1px); height: 900px }` y `.zona > :not(.app), .app > *, .torres > li { position: absolute; left: calc(var(--x, 0) * 1px); top: calc(var(--y, 0) * 1px); width: calc(var(--w) * 1px) }`.
- `.cartel`: placa crema redondeada con sombra, fila de studs crema en el borde superior (pseudoelemento `::before`) y dos postes de madera hasta el suelo en `::after` con `z-index: -1; top: 40px; height: calc((780 - var(--y) - 40) * 1px)`. **`.cartel` no lleva `z-index`** (para que los postes queden detrás). Texto: `h2` 30 px, `h3` 23 px, cuerpo 19 px/1,55; `.etiqueta` (píldora naranja clara), `.nota` (gris, 16 px), `.lista`.
- `.titulo`: `font-size: 0; text-transform: uppercase`; `.titulo-linea { display: block; white-space: nowrap }`, línea 1 a 118 px en azul marino, línea 2 a 86 px en naranja con `margin-top: 18px`; `.letra { display: inline-block; line-height: 0.74 }` (el borde superior de la caja debe coincidir con la parte alta de las mayúsculas; se ajusta en la Tarea 7 con `?depurar`); `.letra.pisada` hunde la letra 6 px durante 0,18 s.
- `.cartel-titular .titular` (Fredoka 34 px) y `.subtitular` (21 px).
- `.foto img` redonda (320 px, borde crema y sombra); `figcaption` centrado.
- `.escalon` (40 px, naranja con canto oscuro y studs), `.pieza` (36 × 36, «stud» dorado que flota; `.recogida` sube y se desvanece), `.bandera` (mástil de madera de 10 px + tela naranja con muesca que sube a `top: 8px` con `.izada`; `.bandera.meta` 580 px y tela azul marino más grande), `.sorpresa` (96 × 96, bloque amarillo con canto, icono 70 px redondeado, `.golpeado` salta 16 px, `aria-expanded="true"` más claro), `.capturas` (fila de 3 capturas 128 × 277 sobre panel azul marino translúcido, aparece con animación; `[hidden]` → `display: none`).
- `.ficha` (cabecera con icono 72 px, `h3` 30 px, `.ficha-frase`, `.ficha-puntos`, `.ficha-tec` 15 px gris), `.boton-tienda` (azul marino; `.proximamente` gris).
- `.rotulo` (título grande centrado con contorno blanco, sin fondo), `.torres` (`height: 900px; list-style: none; margin: 0; padding: 0`), `.torre` (`height: calc(var(--h) * 1px)`, ladrillos naranja con studs encima, texto blanco: `.torre-nombre` Fredoka 17 px, `.torre-detalle` 13 px, `.torre-nivel` abajo con `.lleno` blanco y el resto translúcido).
- Decorados: `.robot` (`.saluda` balancea), `.forja` (90 px; `.forja-forma` con silueta de yunque por `clip-path` en gris oscuro con filo azul `#25B9E8`; `.chispas` que estallan con `.clang`), `.burbuja` (58 px, bocadillo blanco con borde morado `#6F4BE3`, «• • •» y piquito), `.cama-elastica` (160 px, `background: url(../img/apps/una-neurona/neurona.webp) center bottom / contain no-repeat`, `transform-origin: 50% 100%`, `.rebota` se aplasta y estira), `.escenario` (90 px, tablones de madera), `.atril` (90 px, atril de madera por `clip-path`), `.coche` (90 px, coche de bloques rojo con cabina y ruedas), `.puesto` (710 px de alto, sin eventos de puntero: tejado de tejas rojas arriba, postes de madera a los lados y `.noren` con cortinillas de tela azul marino con el texto «ラーメン»), `.bandera-mini` (`.es`, `.va`, `.en` dibujadas con degradados CSS).
- `.muneco { position: absolute; left: 0; top: 0; z-index: 10; width: 160px; height: 160px; background-image: url(../img/personaje/muneco.webp); background-repeat: no-repeat; background-size: calc(var(--columnas, 8) * 160px) calc(var(--filas, 5) * 160px); transform-origin: 50% 14%; cursor: grab; touch-action: none; visibility: hidden }`, `.muneco.listo { visibility: visible }`, `.muneco.agarrado { cursor: grabbing }`, `.muneco.humo` (animación de opacidad y desenfoque, sin tocar `transform`).
- `.clon { z-index: 9; pointer-events: none; animation: clon 1.3s ease-in var(--retraso, 0s) both }` con `@keyframes clon` de `translateX(0)` y opacidad 0 → 0,6 → `translateX(var(--destino, 400px))` y opacidad 0.
- `.depurar-caja { position: absolute; z-index: 15; border-top: 3px solid #E0218A; background: rgb(224 33 138 / 0.12); pointer-events: none }`.
- Todas las animaciones decorativas se desactivan con `@media (prefers-reduced-motion: reduce)`.

`css/hud.css`: barra fija arriba (`z-index: 20`, crema translúcida, esquinas redondeadas, respeta `env(safe-area-inset-top)`) con `.hud-marca`, `.minimapa` (fila de 13 puntos `button[data-ir]` de 14 px sobre una línea; `.visitada` naranja; `.actual` más grande; `.minimapa-marcador` punto azul marino posicionado con `left`), `.minimapa-zona`, `.hud-piezas` (icono de pieza + contador), `.hud-boton` (40 px; en `#boton-sonido[aria-pressed="false"] .ondas` opacidad baja) y `.hud-cv` (naranja). `#boton-volver` solo se ve en `html.cv` y `#boton-cv` solo en `html.juego`. En `max-width: 760px` se ocultan `.minimapa-zona` y `.hud-marca`. `.mensaje-meta` (aviso fijo centrado arriba, azul marino, aparece con animación que conserva `translateX(-50%)`). `.tactil` (oculto; `display: flex` solo en `@media (pointer: coarse)` con `html.juego`; abajo, respetando `env(safe-area-inset-bottom)`; ◀ ▶ a la izquierda —`[data-control="derecha"] { margin-right: auto }`— y «Saltar» grande a la derecha; `.activo` naranja; `-webkit-touch-callout: none`).

`css/cv.css`: en `html.cv` el `body` hace scroll con fondo crema; se ocultan `.escena, .decor, .muneco, .tactil, .minimapa, .hud-piezas, #boton-sonido, .solo-juego, .clon, .mensaje-meta, .sorpresa`; `.mundo` pasa a `position: static; transform: none !important; width: auto; height: auto; max-width: 860px; margin: 0 auto; padding: 96px 20px 64px`; `.zona, .app, .zona > *, .app > *, .torres > li` a `position: static; width: auto; height: auto`; carteles apilados sin postes ni studs; título del nombre con tamaños `clamp()`; foto redonda centrada de 220 px; `.capturas` siempre visibles (`display: flex !important`) y sin panel; `.torres` como lista con barras horizontales; enlaces de contacto en una o dos columnas; formulario en una columna por debajo de 560 px; `@media print` sin barra superior, controles ni formulario y con carteles que no se parten.

- [ ] **Paso 3: Crear `js/ui/i18n.js`**

```js
// Cambio de idioma: el español vive en el HTML; el inglés se carga de i18n/en.json.
const CLAVE = 'xesco.idioma';
let espanol = null;
let ingles = null;

function paresAtributo(nodo) {
  return nodo.dataset.i18nAttr.split(';').map((par) => par.split(':').map((s) => s.trim()));
}

function capturarEspanol() {
  espanol = {};
  document.querySelectorAll('[data-i18n]').forEach((n) => { espanol[n.dataset.i18n] = n.textContent; });
  document.querySelectorAll('[data-i18n-attr]').forEach((n) => {
    for (const [atributo, clave] of paresAtributo(n)) espanol[clave] = n.getAttribute(atributo) ?? '';
  });
}

export function idiomaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'es' || guardado === 'en') return guardado;
  } catch { /* sin almacenamiento */ }
  return /^(es|ca|gl|eu)\b/i.test(navigator.language || 'es') ? 'es' : 'en';
}

export function idiomaActual() {
  return document.documentElement.lang === 'en' ? 'en' : 'es';
}

export async function aplicarIdioma(idioma) {
  if (!espanol) capturarEspanol();
  let textos = espanol;
  if (idioma === 'en') {
    if (!ingles) {
      const respuesta = await fetch('i18n/en.json');
      if (!respuesta.ok) throw new Error('No se pudo cargar i18n/en.json');
      ingles = await respuesta.json();
    }
    textos = ingles;
  }
  document.querySelectorAll('[data-i18n]').forEach((n) => {
    const t = textos[n.dataset.i18n];
    if (t != null) n.textContent = t;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((n) => {
    for (const [atributo, clave] of paresAtributo(n)) {
      const t = textos[clave];
      if (t != null) n.setAttribute(atributo, t);
    }
  });
  document.documentElement.lang = idioma;
  try { localStorage.setItem(CLAVE, idioma); } catch { /* sin almacenamiento */ }
  document.dispatchEvent(new CustomEvent('idioma', { detail: idioma }));
}
```

- [ ] **Paso 4: Crear `js/ui/cv-rapido.js`**

```js
// Modo «CV rápido»: el mismo HTML recolocado en vertical.
const raiz = document.documentElement;

export function enModoCV() {
  return raiz.classList.contains('cv');
}

export function activarCV() {
  raiz.classList.remove('juego');
  raiz.classList.add('cv');
  history.replaceState(null, '', `${location.pathname}?cv`);
  window.scrollTo(0, 0);
}

export function desactivarCV() {
  raiz.classList.remove('cv');
  raiz.classList.add('juego');
  history.replaceState(null, '', location.pathname);
}
```

- [ ] **Paso 5: Crear `js/ui/contacto.js`** (misma lógica de envío que el `js/main.js` actual)

```js
// Envío del formulario de contacto a Web3Forms.
export function activarFormulario(form) {
  const exito = form.querySelector('.form-exito');
  const boton = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = boton.textContent;
    boton.disabled = true;
    boton.textContent = '…';
    try {
      const respuesta = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const datos = await respuesta.json();
      if (!datos.success) throw new Error(datos.message || 'Error en el servidor');
      form.reset();
      exito.hidden = false;
    } catch {
      alert(form.dataset.error);
    } finally {
      boton.disabled = false;
      boton.textContent = texto;
    }
  });
}
```

- [ ] **Paso 6: Reescribir `js/main.js`** (versión 1: idioma, CV, formulario y una vista estática del mundo con `?x=` para revisar zonas; la Tarea 7 lo sustituye)

```js
import { aplicarIdioma, idiomaInicial, idiomaActual } from './ui/i18n.js';
import { activarCV, desactivarCV } from './ui/cv-rapido.js';
import { activarFormulario } from './ui/contacto.js';

function vistaEstatica() {
  const escala = Math.min(innerHeight / 900, innerWidth / 560);
  const x = Number(new URLSearchParams(location.search).get('x') || 0);
  document.documentElement.style.setProperty('--escala', String(escala));
  document.documentElement.style.setProperty('--mundo-y', `${innerHeight - 900 * escala}px`);
  document.getElementById('mundo').style.transform = `translate3d(${-x * escala}px, 0, 0) scale(${escala})`;
}

async function arrancar() {
  try { await aplicarIdioma(idiomaInicial()); } catch (error) { console.warn('No se pudo aplicar el idioma', error); }
  activarFormulario(document.getElementById('formulario-contacto'));
  document.getElementById('boton-idioma').addEventListener('click', () => aplicarIdioma(idiomaActual() === 'es' ? 'en' : 'es'));
  document.getElementById('boton-cv').addEventListener('click', activarCV);
  document.getElementById('boton-volver').addEventListener('click', () => { desactivarCV(); vistaEstatica(); });
  vistaEstatica();
  addEventListener('resize', vistaEstatica);
}

arrancar();
```

- [ ] **Paso 7: Crear `i18n/en.json`** con TODAS las claves `data-i18n` y `data-i18n-attr` de `index.html` traducidas a un inglés natural y profesional (sin claves de más ni de menos). Valores fijados: `"hud.idioma": "ES"`, `"hud.idioma.etiqueta": "Cambiar a español"`, `"meta.mensaje": "Level complete! You found {n} of {total} pieces."`, `"nivel.4": "4 out of 7"` (y `nivel.5`, `nivel.6`), `"contacto.enviar": "Send order"`, `"contacto.exito": "✓ Order received. I'll reply within 24 hours."`, `"tactil.saltar": "Jump"`. Comprobación (ejecutar el script desde un archivo temporal si la línea es larga):

```js
// comprobar-i18n.mjs (temporal, en el scratchpad): node comprobar-i18n.mjs desde la raíz del repo
import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const claves = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const par of m[1].split(';')) claves.add(par.split(':')[1].trim());
const en = JSON.parse(readFileSync('i18n/en.json', 'utf8'));
console.log('claves', claves.size, 'faltan', [...claves].filter((k) => !(k in en)), 'sobran', Object.keys(en).filter((k) => !claves.has(k)));
```

Expected: `faltan []` y `sobran []`.

- [ ] **Paso 8: Crear el servidor local `herramientas/servidor.mjs`**

```js
// Servidor estático para desarrollo: node herramientas/servidor.mjs (PORT opcional, por defecto 8080).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const RAIZ = process.cwd();
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};
const puerto = Number(process.env.PORT || 8080);

createServer(async (peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
  const fichero = normalize(join(RAIZ, ruta.endsWith('/') ? `${ruta}index.html` : ruta));
  if (!fichero.startsWith(RAIZ)) {
    respuesta.writeHead(403).end();
    return;
  }
  try {
    const datos = await readFile(fichero);
    respuesta.writeHead(200, { 'Content-Type': TIPOS[extname(fichero)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    respuesta.end(datos);
  } catch {
    respuesta.writeHead(404).end('No encontrado');
  }
}).listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));
```

Y `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "portfolio", "runtimeExecutable": "node", "runtimeArgs": ["herramientas/servidor.mjs"], "port": 8080 }
  ]
}
```

- [ ] **Paso 9: Verificar en el navegador integrado** (`mcp__Claude_Browser__preview_start` con `name: "portfolio"`):
  1. `http://localhost:8080/?cv` a 1280 × 900 y a 390 × 844 (`resize_window`): todo el contenido legible en vertical, foto redonda, capturas visibles, torres como lista, formulario usable; capturas de pantalla.
  2. Botón «EN»: todos los textos cambian a inglés y el botón pasa a «ES»; volver a español.
  3. Modo juego estático: `http://localhost:8080/` y `?x=1500`, `?x=5500`, `?x=6200`, `?x=11400`, `?x=14200`, `?x=16800` a 1440 × 900: los carteles están en su sitio con sus postes hasta el suelo, el suelo de ladrillo se ve continuo y nada se solapa de forma rara (las capas del fondo y el muñeco pueden faltar si sus tareas no han terminado).
  4. `mcp__Claude_Browser__read_console_messages` sin errores (salvo 404 de recursos aún no generados).

- [ ] **Paso 10: Punto de control (sin commit)**

Run: `npm test && git status --short`
Expected: los tests siguen en verde; cambios en `index.html`, `js/main.js` y archivos nuevos. No hacer commit.

---

### Tarea 5: Fondo ilustrado (capas SVG)

Encargada a un agente con una especificación propia (resumen): `herramientas/generar-fondo.mjs` (Node, sin dependencias, semilla fija) genera `img/fondo/montana.svg` (3600 × 900), `colinas.svg` (2400 × 900), `aldea.svg` (2800 × 900) y `arboles.svg` (2000 × 900): fondo transparente, suelo en y = 780, teselado horizontal sin costuras, estilo plano de juguete, total < 150 KB, sin elementos protegidos (ni emblema de la hoja, ni caras de los Hokage, ni LEGO). La montaña lleva cuatro cabezas talladas de juguete (la cuarta con pelo rizado) y la aldea un depósito de agua con un emblema propio (un ladrillo). Verificación con una vista previa de las cuatro capas superpuestas en el navegador integrado.

---

### Tarea 6: Hoja de animaciones del muñeco (Blender)

**Files:**
- Create: `minifigura/scripts/mf_sprites.py`
- Create (generados): `minifigura/sprites/*.png` (40 fotogramas, fuera de git), `img/personaje/muneco.webp`, `img/personaje/sprites.json`
- Modify: `minifigura/minifigura_xesco.blend` (pivotes y cámara de sprites; se guarda al final)

**Interfaces:**
- Consumes: la escena de `minifigura_xesco.blend` abierta en Blender (objetos `MF_Raiz`, `MF_Pierna_L/R`, `MF_Cortador_L/R`, `MF_Brazo_L/R`, `MF_Mano_L/R`, `MF_Suelo`, `CAM_Frontal`, luces del estudio).
- Produces: `img/personaje/sprites.json` con el formato del contrato (8 columnas × 5 filas, fotograma 160, `pie` 6, animaciones en este orden: parado 4, saludar 8, giro 3, andar 8, saltar 2, caer 2, aterrizar 1, colgado 6, celebrar 6) e `img/personaje/muneco.webp` de 2560 × 1600 con transparencia.

- [ ] **Paso 1: Crear `minifigura/scripts/mf_sprites.py`**

```python
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
                                  brazos=(-24 * math.sin(f), 24 * math.sin(f)), altura=0.03 * abs(math.cos(f)))
                             for f in _ciclo(8)]),
        ("saltar", 8, False, [dict(giro=50, piernas=(-34, 24), brazos=(-150, -40)),
                              dict(giro=50, piernas=(-30, 20), brazos=(-160, -50))]),
        ("caer", 6, True, [dict(giro=50, piernas=(-14, 14), brazos=(-120, -110)),
                           dict(giro=50, piernas=(-18, 18), brazos=(-126, -104))]),
        ("aterrizar", 1, False, [dict(giro=50, brazos=(-20, -20))]),
        ("colgado", 8, True, [dict(giro=14, piernas=(18 * math.sin(f), -18 * math.sin(f)), brazos=(-172, -172))
                              for f in _ciclo(6)]),
        ("celebrar", 8, True, [dict(giro=0, brazos=(-165 + 15 * math.sin(f), -165 - 15 * math.sin(f)),
                                    altura=0.18 * abs(math.sin(f))) for f in _ciclo(6)]),
    ]


def aplicar_pose(giro=0.0, piernas=(0.0, 0.0), brazos=(0.0, 0.0), altura=0.0):
    raiz = bpy.data.objects["MF_Raiz"]
    raiz.rotation_euler = (0.0, 0.0, math.radians(giro))
    raiz.location = (0.0, 0.0, altura)
    for nombre, angulo in (("PIV_Pierna_L", piernas[0]), ("PIV_Pierna_R", piernas[1]),
                           ("PIV_Brazo_L", brazos[0]), ("PIV_Brazo_R", brazos[1])):
        bpy.data.objects[nombre].rotation_euler = (math.radians(angulo), 0.0, 0.0)
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
    aplicar_pose()
    raiz = bpy.data.objects["MF_Raiz"]
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
    bpy.data.objects["MF_Suelo"].hide_render = False
    bpy.ops.wm.save_mainfile()
    return bpy.data.filepath
```

- [ ] **Paso 2: Preparar la escena** (`mcp__Blender__execute_blender_code`):

```python
import sys, importlib
sys.path.insert(0, r"C:/Users/xesco/OneDrive/Escritorio/web-xesco/minifigura/scripts")
import mf_sprites
importlib.reload(mf_sprites)
result = mf_sprites.preparar()
```

Expected: `["PIV_Brazo_L", "PIV_Brazo_R", "PIV_Pierna_L", "PIV_Pierna_R"]`.

- [ ] **Paso 3: Prueba de pose antes de renderizar los 40.** Renderizar solo dos fotogramas de prueba (`andar_02` y `saludar_02`) a `minifigura/sprites/prueba_*.png` con `aplicar_pose(**pose)` + `bpy.ops.render.render(write_still=True)` y abrirlos con Read. Comprobar: figura entera dentro del cuadro con los pies a ~6 px del borde inferior (a 320 px son ~12 px), piernas y brazos girando desde cadera y hombros sin separarse del cuerpo, la mano del saludo por encima del hombro, la cara visible en la vista de tres cuartos y fondo transparente. Si una pieza se separa o gira al revés, corregir el pivote o el signo en `PIVOTES`/`animaciones()` y repetir. Borrar las pruebas.

- [ ] **Paso 4: Renderizar la cola**

```python
import mf_sprites
result = mf_sprites.encolar_render()
```

Expected: `40`. Esperar desde PowerShell a que existan los 40 PNG:

```powershell
$d = "C:\Users\xesco\OneDrive\Escritorio\web-xesco\minifigura\sprites"; $t = 0
while (((Get-ChildItem $d -Filter *.png -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike 'prueba*' }).Count -lt 40) -and $t -lt 580) { Start-Sleep -Seconds 5; $t += 5 }
(Get-ChildItem $d -Filter *.png | Where-Object { $_.Name -notlike 'prueba*' }).Count
```

Expected: `40`. Después leer `bpy.app.driver_namespace["mf_sprites_estado"]` y comprobar `error: None`.

- [ ] **Paso 5: Empaquetar y restaurar**

```python
import mf_sprites
result = {"hoja": mf_sprites.empaquetar(), "blend": mf_sprites.restaurar()}
```

Expected: `fotogramas: 40` y un WebP de ~0,3–1 MB. Si `img.save` falla con WEBP, guardar como PNG (`muneco.png`), poner `"imagen": "muneco.png"` en `sprites.json` y avisar.

- [ ] **Paso 6: Revisar la hoja.** Abrir `img/personaje/muneco.webp` con Read: 8 columnas × 5 filas en el orden del contrato, fondo transparente, todas las poses completas. Comprobar `img/personaje/sprites.json` contra el contrato.

- [ ] **Paso 7: Punto de control (sin commit).** `git status --short`. No hacer commit.

---

> **Nota de ejecución (2026-10-08):** a petición del usuario («utiliza múltiples agentes para ir más rápido») las Tareas 3–6 se ejecutan con agentes en paralelo y las Tareas 7–11 las escribe directamente el coordinador mientras tanto. El código definitivo de estas tareas está en los archivos indicados; aquí se documentan su responsabilidad, sus interfaces y su verificación.

### Tarea 7: Motor en el navegador y nivel jugable

**Files:**
- Create: `js/motor/entrada.js`, `js/motor/bucle.js`, `js/mundo/plataformas.js`, `js/juego/jugador.js`
- Modify (reescribir): `js/main.js` (versión definitiva, que también integra las Tareas 8–11)

**Interfaces:**
- `entrada.js`: `crearEntrada(objetivo = window)` → `{ pulsar(accion), soltar(accion), correrAuto(dir, ms), activar(bool), leer() }`. Ignora el teclado en campos de texto y deja que Espacio active botones y enlaces enfocados.
- `bucle.js`: `iniciarBucle({ actualizar, dibujar, paso = 1/120, maxPasos = 8 })` → `{ detener() }`; se pausa con `visibilitychange`.
- `plataformas.js`: `posicionEnMundo(el, mundo)`, `medirElementos(mundo, selector)`, `medirPlataformas(mundo)` (añade el suelo y las paredes de los extremos).
- `jugador.js`: `crearJugador(el, sprites, inicio)`, `cambiarEstado(j, estado)`, `actualizarJugador(j, entrada, colisionadores, dt)` → eventos, `dibujarJugador(j)`, `reaparecer(j, punto, colisionadores)`. Estados: `saludando`, `parado`, `andando`, `saltando`, `cayendo`, `colgado`, `celebrando`.
- `main.js`: carga `sprites.json` y la hoja (si falla → `activarCV()`), escala el mundo (`--escala`, `--mundo-y`), mide plataformas tras cargar fuentes e imágenes, al redimensionar y al cambiar de idioma; cámara con suavizado; fondo parallax; reaparición en la última bandera si el muñeco sale del mundo; rueda → `correrAuto`; Tab → la cámara viaja al elemento enfocado; `?depurar` dibuja los colisionadores y expone `window.__juego`.

- [ ] **Paso 1:** `node --check` de cada módulo y `npm test` en verde.
- [ ] **Paso 2:** Sustituir `js/main.js` por la versión definitiva cuando la Tarea 4 haya terminado.
- [ ] **Paso 3:** En el navegador integrado, `http://localhost:8080/?depurar` a 1440 × 900: las líneas rosas de los colisionadores coinciden con el borde superior de carteles, escalones y letras (si las letras no coinciden, ajustar `line-height` de `.letra`). Simular teclado con `javascript_tool` (`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))`, esperar, `keyup`) y comprobar con `window.__juego.jugador.cuerpo` que el muñeco avanza, salta (`Space`) y aterriza en los carteles. Consola sin errores.

### Tarea 8: Arrastre con ratón y dedo

**Files:** Create `js/juego/arrastre.js` (integrado en `main.js`).

**Interfaces:** `activarArrastre({ jugador, mundo, obtenerEscala, obtenerColisionadores })` → `{ actualizar(dt) }`. Al pulsar sobre `#muneco` pasa a `colgado` y sigue al puntero (limitado al mundo); se balancea con un muelle amortiguado según la velocidad horizontal del puntero; al soltar hereda la velocidad del gesto (limitada) y se desatasca de sólidos.

- [ ] **Verificación:** con `computer` → `left_click_drag` sobre el muñeco: cuelga, se balancea, al soltar sale lanzado y aterriza; nunca queda dentro de un sólido ni fuera del mundo.

### Tarea 9: Objetos del nivel y sonido

**Files:** Create `js/juego/objetos.js`, `js/ui/sonido.js` (integrados en `main.js`).

**Interfaces:**
- `objetos.js`: `crearObjetos(mundo)`, `medirObjetos(o)`, `contarPiezas(o)`, `actualizarObjetos(o, jugador, eventos, porId, avisos)` con `avisos = { piezas(n, total), zona(zona), clones(), meta(n, total) }`, `activarSorpresas(mundo)`, `abrirSorpresa(boton, abrir?)`, `lanzarClones(mundo, jugador)`, `reanimar(el, clase)`. Las piezas recogidas se guardan en `localStorage` (`xesco.piezas`).
- `sonido.js`: `sonidoActivo()`, `alternarSonido()` → bool, `sonar(nombre)` con `salto`, `pieza`, `golpe`, `clang`, `rebote`, `meta` (Web Audio; apagado por defecto; `xesco.sonido`).

- [ ] **Verificación:** recoger una pieza (desaparece y el contador sube), golpear un bloque sorpresa desde abajo (se abre el panel de capturas), aterrizar en el yunque (chispas), botar en la neurona (sube muy alto), entrar en Metodología (salen 3 clones), llegar a la bandera de meta (celebración y aviso con el recuento).

### Tarea 10: Barra superior

**Files:** Create `js/ui/hud.js` (integrado en `main.js`).

**Interfaces:** `crearHud({ alViajar, alSonido, sonidoInicial })` → `{ zona(id), progreso(p), piezas(n, total) }`. Los botones del minimapa viajan a su zona (el muñeco reaparece con efecto de humo); el marcador sigue el progreso; la etiqueta muestra la zona actual y se actualiza al cambiar de idioma. Idioma, CV rápido y «Volver al nivel» se gestionan en `main.js` porque funcionan también sin juego.

- [ ] **Verificación:** clic en cada punto del minimapa → el muñeco aparece en esa zona; ES/EN cambia todo y el nivel sigue jugable; sonido on/off cambia `aria-pressed`.

### Tarea 11: Móvil

**Files:** controles táctiles en `main.js` (`activarControlesTactiles`), estilos en `css/hud.css` (Tarea 4).

- [ ] **Verificación:** `resize_window` con `preset: "mobile"` y recarga: aparecen ◀ ▶ y «Saltar»; con `javascript_tool` se lanzan `pointerdown`/`pointerup` sobre los botones y el muñeco anda y salta; «Ver CV rápido» visible y usable; volver a `preset: "desktop"` al acabar.

### Tarea 12: Cierre

**Files:**
- Modify: `.gitignore` (añadir `node_modules/`, `material/`, `minifigura/*.blend`, `minifigura/*.blend1`, `minifigura/renders/`, `minifigura/referencia/`, `minifigura/sprites/`, `minifigura/texturas/`)
- Modify: `vercel.json` y `netlify.toml` (caché de `css/` y `js/` a `public, max-age=3600, must-revalidate` y de `img/` a `public, max-age=86400`, porque los nombres de archivo no llevan hash)
- Modify: `README.md` (estructura, servidor local, tests y regeneración de recursos)

- [ ] **Paso 1:** Peso de la carga inicial: sumar `index.html`, `css/*`, `js/**`, `img/fondo/*`, `img/personaje/*`, `img/foto/*` e iconos → debe quedar < 2,5 MB.
- [ ] **Paso 2:** Recorrido completo en escritorio (teclado de principio a fin, arrastre, minimapa, sorpresas, meta) y en móvil (táctil y CV rápido), ES y EN, consola sin errores. Comprobar los criterios de aceptación 1–8 de la especificación.
- [ ] **Paso 3:** No enviar el formulario real sin permiso del usuario.
- [ ] **Paso 4:** `git status --short` y preguntar al usuario si quiere hacer ya el commit (lo dejó para más tarde).
