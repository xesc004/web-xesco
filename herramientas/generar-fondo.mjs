// Genera las cuatro capas SVG del fondo del nivel (parallax 0,1 / 0,25 / 0,5 / 0,8) en img/fondo/.
//
//   node herramientas/generar-fondo.mjs
//
// Ilustración propia que evoca una aldea ninja de anime: no usa arte oficial, emblemas ni marcas de terceros.
// Reglas comunes a las cuatro capas:
// - 900 de alto y fondo transparente (el cielo es un degradado CSS que va detrás).
// - Lo que toca el suelo se apoya en y = 780; por debajo se rellena hasta 900 con el color de la base.
// - Teselado horizontal perfecto (`background-repeat: repeat-x`): las siluetas empiezan y acaban a la misma
//   altura con tangente horizontal y ningún objeto toca un borde. Solo los elementos continuos (raíles de la
//   valla, cables) cruzan la costura, y los cables se dibujan dos veces (desplazados ±ancho) para que encajen.
// - El azar sale de un generador con semilla fija: cada ejecución produce exactamente los mismos archivos.

import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ALTO = 900;
const SUELO = 780;
const DESTINO = fileURLToPath(new URL('../img/fondo/', import.meta.url));

const COLOR = {
  // Cielo y lejanía
  nube: '#FFFFFF',
  nubeSombra: '#DDEFF8',
  lejania: '#CDE1E5',
  lejaniaSombra: '#BFD8DD',
  bruma: '#B7D3D8',
  brumaSombra: '#A7C7CD',
  // Meseta de roca y cabezas talladas
  roca: '#CBA37B',
  rocaSombra: '#A9835E',
  rocaVeta: '#BE976F',
  rocaLuz: '#D9B892',
  cara: '#D9B892',
  caraSombra: '#C49E76',
  rasgos: '#7A5A3E',
  pelo: '#98734F',
  peloLuz: '#B38D66',
  // Vegetación lejana (meseta y colinas)
  monte: '#86B467',
  monteSombra: '#71A055',
  monteLuz: '#9DC87E',
  colina: '#A7D08A',
  colinaFrente: '#8CC06E',
  arbolLejano: '#88BC6B',
  arbolLejanoSombra: '#75AA59',
  troncoLejano: '#977B5D',
  arbolMedio: '#70AC54',
  arbolMedioSombra: '#5F9A47',
  troncoMedio: '#86684B',
  // Aldea
  pared: '#F1E2C6',
  paredSombra: '#E0CAA4',
  papel: '#FFF8EA',
  madera: '#8B5A2B',
  maderaOscura: '#6B4A2E',
  teja: '#C8462F',
  tejaOscura: '#9E3422',
  tejaVeta: '#B53E2A',
  calle: '#DDC9A0',
  calleBorde: '#CCB489',
  deposito: '#C2553A',
  depositoSombra: '#A4432D',
  depositoLuz: '#D56E52',
  emblema: '#FFF6EC',
  farol: '#E8553A',
  farolLuz: '#F5876B',
  farolTapa: '#5E3B25',
  cable: '#5E4532',
  noren: '#2D3C5F',
  norenNaranja: '#E2701F',
  // Primer plano
  hoja: '#5E9E3F',
  hojaSombra: '#4E8A33',
  hojaLuz: '#73B353',
  tronco: '#8B5A2B',
  troncoSombra: '#6B4A2E',
  valla: '#B07A45',
  vallaSombra: '#946234',
  hierba: '#6CAE4B',
  hierbaSombra: '#5E9E3F',
};

// ---------------------------------------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------------------------------------

// Generador pseudoaleatorio mulberry32: rápido, sin dependencias y reproducible con la misma semilla.
function crearAzar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entre = (azar, a, b) => a + azar() * (b - a);

// Número compacto con un decimal como máximo.
function num(v) {
  if (typeof v !== 'number') return String(v);
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
}

// Plantilla etiquetada para datos de trazado: formatea los números interpolados.
const d = (partes, ...valores) =>
  partes.reduce((s, parte, i) => s + parte + (i < valores.length ? num(valores[i]) : ''), '');

// Formas como datos de trazado, todas en sentido horario (se pueden unir en un mismo <path> sin huecos).
const rect = (x, y, w, h) => d`M${x} ${y}h${w}v${h}h${-w}z`;

function rrect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return d`M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}z`;
}

// Rectángulo con solo las esquinas superiores redondeadas.
function rrectArriba(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return d`M${x} ${y + h}v${r - h}a${r} ${r} 0 0 1 ${r} ${-r}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - r}z`;
}

const circ = (cx, cy, r) => d`M${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0z`;
const elip = (cx, cy, rx, ry) => d`M${cx - rx} ${cy}a${rx} ${ry} 0 1 1 ${2 * rx} 0a${rx} ${ry} 0 1 1 ${-2 * rx} 0z`;
const poli = (puntos) => 'M' + puntos.map(([x, y]) => `${num(x)} ${num(y)}`).join('L') + 'z';

// Polígono cerrado con las esquinas redondeadas (curva cuadrática en cada vértice).
function poligonoRedondeado(puntos, radio) {
  const n = puntos.length;
  let s = '';
  for (let i = 0; i < n; i++) {
    const [px, py] = puntos[(i - 1 + n) % n];
    const [cx, cy, rv] = puntos[i];
    const [nx, ny] = puntos[(i + 1) % n];
    const r = rv ?? radio;
    const l1 = Math.hypot(px - cx, py - cy);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const r1 = Math.min(r, l1 / 2);
    const r2 = Math.min(r, l2 / 2);
    const ax = cx + ((px - cx) * r1) / l1;
    const ay = cy + ((py - cy) * r1) / l1;
    const bx = cx + ((nx - cx) * r2) / l2;
    const by = cy + ((ny - cy) * r2) / l2;
    s += (i === 0 ? d`M${ax} ${ay}` : d`L${ax} ${ay}`) + d`Q${cx} ${cy} ${bx} ${by}`;
  }
  return s + 'z';
}

// Perfil ondulado: cada punto es un máximo o un mínimo con tangente horizontal (curvas en S entre ellos).
// El primero y el último deben tener la misma altura y estar en x = 0 y x = ancho.
const TENSION = 0.42;

function perfilSuave(puntos, fondo = ALTO) {
  let s = d`M${puntos[0][0]} ${fondo}L${puntos[0][0]} ${puntos[0][1]}`;
  for (let i = 1; i < puntos.length; i++) {
    const [x0, y0] = puntos[i - 1];
    const [x1, y1] = puntos[i];
    const k = (x1 - x0) * TENSION;
    s += d`C${x0 + k} ${y0} ${x1 - k} ${y1} ${x1} ${y1}`;
  }
  return s + d`L${puntos[puntos.length - 1][0]} ${fondo}z`;
}

// Altura del perfil suave en una x dada (bisección sobre el parámetro de la curva).
function alturaPerfil(puntos, x) {
  for (let i = 1; i < puntos.length; i++) {
    const [x0, y0] = puntos[i - 1];
    const [x1, y1] = puntos[i];
    if (x > x1) continue;
    const k = (x1 - x0) * TENSION;
    let lo = 0;
    let hi = 1;
    for (let n = 0; n < 40; n++) {
      const t = (lo + hi) / 2;
      const u = 1 - t;
      const xt = u * u * u * x0 + 3 * u * u * t * (x0 + k) + 3 * u * t * t * (x1 - k) + t * t * t * x1;
      if (xt < x) lo = t;
      else hi = t;
    }
    const t = (lo + hi) / 2;
    return y0 + (y1 - y0) * (3 * t * t - 2 * t * t * t);
  }
  return puntos[puntos.length - 1][1];
}

// Elementos SVG.
const relleno = (color, ...datos) => {
  const datosUnidos = datos.join('');
  return datosUnidos ? `<path fill="${color}" d="${datosUnidos}"/>` : '';
};
const trazo = (color, ancho, datos, extra = '') =>
  `<path fill="none" stroke="${color}" stroke-width="${num(ancho)}" stroke-linecap="round" stroke-linejoin="round"${extra} d="${datos}"/>`;
const recorte = (id, datos) => `<clipPath id="${id}"><path d="${datos}"/></clipPath>`;
const grupoRecortado = (id, contenido) => `<g clip-path="url(#${id})">${contenido}</g>`;

function documento(ancho, cuerpo, defs = '') {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${ALTO}" viewBox="0 0 ${ancho} ${ALTO}">` +
    '<!-- Generado por herramientas/generar-fondo.mjs: no editar a mano. -->' +
    (defs ? `<defs>${defs}</defs>` : '') +
    cuerpo +
    '</svg>\n'
  );
}

// Mata redondeada de base plana: bolas en sombra, luz desplazada arriba a la izquierda y brillos.
function mata(x, base, ancho, col, azar) {
  const bolas = [
    [-0.3, 0.23],
    [0.02, 0.31],
    [0.31, 0.21],
  ].map(([dx, rr]) => {
    const r = (rr + entre(azar, -0.025, 0.025)) * ancho;
    return [x + dx * ancho, base - r, r];
  });
  const pie = rect(x - ancho * 0.44, base - ancho * 0.12, ancho * 0.88, ancho * 0.12);
  return {
    sombra: bolas.map(([bx, by, r]) => circ(bx, by, r)).join('') + pie,
    base: bolas.map(([bx, by, r]) => circ(bx - r * 0.1, by - r * 0.13, r * 0.88)).join(''),
    luz: bolas
      .slice(0, 2)
      .map(([bx, by, r]) => circ(bx - r * 0.34, by - r * 0.36, r * 0.25))
      .join(''),
  };
}

// Árbol pequeño y lejano: copa redonda o ciprés alargado.
function arbolito(x, base, s, tipo) {
  if (tipo === 'cipres') {
    return {
      tronco: rect(x - 2.4 * s, base - 9 * s, 4.8 * s, 9 * s),
      sombra: elip(x, base - 33 * s, 10 * s, 26 * s),
      base: elip(x - 2 * s, base - 35 * s, 7.6 * s, 23.5 * s),
    };
  }
  return {
    tronco: rect(x - 2.4 * s, base - 13 * s, 4.8 * s, 13 * s),
    sombra: circ(x, base - 27 * s, 15 * s),
    base: circ(x - 2.2 * s, base - 29.4 * s, 12.4 * s),
  };
}

// Junta varias piezas {clave: datos} en un solo <path> por clave, en el orden indicado.
function juntar(piezas, orden, colores) {
  return orden.map((clave) => relleno(colores[clave], ...piezas.map((p) => p[clave] ?? ''))).join('');
}

// ---------------------------------------------------------------------------------------------------------
// Capa 1: montaña (3600 × 900, parallax 0,1)
// ---------------------------------------------------------------------------------------------------------

function nube(cx, base, s, azar) {
  const ancho = 230 * s;
  const n = 4 + Math.floor(azar() * 2);
  const bultos = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = cx - ancho / 2 + 20 * s + t * (ancho - 40 * s);
    const centro = 1 - Math.abs(t - 0.42) * 1.5;
    const r = (22 + 32 * centro + entre(azar, -4, 4)) * s;
    bultos.push([x, base - 24 * s - r * 0.55, r]);
  }
  const forma = (dy) =>
    rrect(cx - ancho / 2, base - 38 * s + dy, ancho, 38 * s, 19 * s) +
    bultos.map(([x, y, r]) => circ(x, y + dy, r)).join('');
  return { sombra: forma(0), base: forma(-7 * s) };
}

// Cordillera de picos redondeados: valles y picos alternos que acaban a la altura y0 en ambos bordes.
function cordillera(ancho, { semilla, y0, picos, alturaPico, alturaValle, radio }) {
  const azar = crearAzar(semilla);
  const intervalos = picos * 2;
  const x0 = 90;
  const x1 = ancho - 90;
  const paso = (x1 - x0) / intervalos;
  const puntos = [
    [-60, ALTO + 5],
    [-60, y0],
    [x0, y0],
  ];
  for (let k = 1; k < intervalos; k++) {
    const x = x0 + paso * k + entre(azar, -0.22, 0.22) * paso;
    const y = k % 2 === 1 ? entre(azar, ...alturaPico) : entre(azar, ...alturaValle);
    puntos.push([x, y]);
  }
  puntos.push([x1, y0], [ancho + 60, y0], [ancho + 60, ALTO + 5]);
  // Ladera en sombra de cada pico: del pico al valle de la derecha (se recorta con la silueta).
  let sombras = '';
  for (let i = 3; i < puntos.length - 3; i += 2) {
    const [px, py] = puntos[i];
    const [vx, vy] = puntos[i + 1];
    sombras += poli([
      [px, py - 90],
      [vx, vy - 90],
      [vx, ALTO],
      [px + (vx - px) * 0.42, ALTO],
      [px + (vx - px) * 0.16, py + (ALTO - py) * 0.42],
    ]);
  }
  return { silueta: poligonoRedondeado(puntos, radio), sombras };
}

function cabeza(x, y, tipo) {
  const w = 176;
  const h = 168;
  const r = 36;
  const conPelo = tipo === 'rizos';
  const stud = (dx, dy) => rrectArriba(x + 40 + dx, y - 26 + dy, 96, 32, 9);
  const s = [];
  // Hueco tallado: sombra del relieve sobre la roca.
  s.push(relleno(COLOR.rocaSombra, rrect(x + 12, y + 10, w, h, r), conPelo ? '' : stud(12, 10)));
  // Cuello.
  s.push(relleno(COLOR.caraSombra, rect(x + 38, y + h - 8, w - 76, 26)));
  // Cabeza cilíndrica con su stud.
  s.push(relleno(COLOR.cara, rrect(x, y, w, h, r), conPelo ? '' : stud(0, 0)));
  // Sombra del cilindro (banda derecha) y del stud.
  const xs = x + w * 0.77;
  s.push(
    relleno(
      COLOR.caraSombra,
      d`M${xs} ${y}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}H${xs}z`,
      conPelo ? '' : d`M${x + 112} ${y + 6}V${y - 26}H${x + 127}a9 9 0 0 1 9 9V${y + 6}z`,
    ),
  );
  // Rasgos.
  const ojoY = y + h * (conPelo ? 0.5 : 0.45);
  const ojoI = x + w * 0.34;
  const ojoD = x + w * 0.66;
  const rasgos = [];
  const lineas = [];
  if (tipo === 'guino') {
    rasgos.push(elip(ojoI, ojoY, 10, 14));
    lineas.push(d`M${ojoD - 13} ${ojoY + 3}Q${ojoD} ${ojoY - 10} ${ojoD + 13} ${ojoY + 3}`);
  } else {
    rasgos.push(elip(ojoI, ojoY, 10, 14), elip(ojoD, ojoY, 10, 14));
  }
  const bocaY = y + h * 0.67;
  if (tipo === 'risa') {
    rasgos.push(
      d`M${x + w * 0.31} ${bocaY - 6}H${x + w * 0.69}Q${x + w * 0.68} ${bocaY + 34} ${x + w * 0.5} ${bocaY + 34}Q${x + w * 0.32} ${bocaY + 34} ${x + w * 0.31} ${bocaY - 6}z`,
    );
    lineas.push(
      d`M${ojoI - 14} ${ojoY - 26}Q${ojoI} ${ojoY - 34} ${ojoI + 12} ${ojoY - 27}`,
      d`M${ojoD - 12} ${ojoY - 27}Q${ojoD} ${ojoY - 34} ${ojoD + 14} ${ojoY - 26}`,
    );
  } else if (tipo === 'rizos') {
    lineas.push(d`M${x + w * 0.39} ${y + h * 0.72}Q${x + w * 0.53} ${y + h * 0.79} ${x + w * 0.65} ${y + h * 0.7}`);
  } else {
    lineas.push(d`M${x + w * 0.31} ${bocaY}Q${x + w * 0.5} ${bocaY + 32} ${x + w * 0.69} ${bocaY}`);
  }
  s.push(relleno(COLOR.rasgos, ...rasgos));
  if (tipo === 'risa') s.push(relleno(COLOR.cara, rect(x + w * 0.37, bocaY - 6, w * 0.26, 7)));
  s.push(trazo(COLOR.rasgos, 7, lineas.join('')));
  if (conPelo) s.push(pelo(x, y, w));
  return s.join('');
}

// Pelo rizado tallado (homenaje a Xesco): masa con rizos en el contorno y flequillo, y cejas gruesas.
function pelo(x, y, w) {
  const cx = x + w / 2;
  const rizos = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n;
    rizos.push([cx + Math.cos(a) * (w / 2 + 2), y + 40 + Math.sin(a) * 58, i % 2 ? 22 : 19]);
  }
  rizos.push([x + 1, y + 62, 16], [x + w - 1, y + 62, 16], [x + 6, y + 80, 11], [x + w - 6, y + 80, 11]);
  for (let i = 0; i < 6; i++) rizos.push([x + 34 + i * 21.6, y + 44, 13]);
  const masa = rrect(x - 8, y - 16, w + 16, 62, 30);
  const forma = (dx, dy) => masa.replace(/^M[^h]+/, d`M${x - 8 + 30 + dx} ${y - 16 + dy}`) + rizos.map(([rx, ry, rr]) => circ(rx + dx, ry + dy, rr)).join('');
  const brillos = rizos
    .filter((_, i) => i % 2 === 0)
    .map(([rx, ry, rr]) => d`M${rx - rr * 0.55} ${ry + rr * 0.05}a${rr * 0.55} ${rr * 0.55} 0 0 1 ${rr * 0.55} ${-rr * 0.6}`)
    .join('');
  const cejas = d`M${x + w * 0.23} ${y + 68}L${x + w * 0.43} ${y + 64}M${x + w * 0.57} ${y + 64}L${x + w * 0.77} ${y + 68}`;
  return (
    relleno(COLOR.rocaSombra, forma(12, 10)) +
    relleno(COLOR.pelo, forma(0, 0)) +
    trazo(COLOR.peloLuz, 4, brillos) +
    trazo(COLOR.rasgos, 10, cejas)
  );
}

function meseta(cx, azar) {
  const contorno = [
    [cx - 850, ALTO + 5],
    [cx - 850, 784],
    [cx - 736, 744],
    [cx - 688, 702],
    [cx - 664, 652],
    [cx - 642, 612],
    [cx - 632, 566],
    [cx - 614, 528],
    [cx - 606, 478],
    [cx - 597, 432],
    [cx - 588, 390],
    [cx - 574, 354],
    [cx - 548, 335],
    [cx - 300, 331],
    [cx, 333],
    [cx + 300, 330],
    [cx + 552, 336],
    [cx + 577, 357],
    [cx + 591, 393],
    [cx + 601, 440],
    [cx + 613, 486],
    [cx + 619, 532],
    [cx + 637, 578],
    [cx + 655, 624],
    [cx + 680, 680],
    [cx + 726, 738],
    [cx + 850, 784],
    [cx + 850, ALTO + 5],
  ];
  const silueta = poligonoRedondeado(contorno, 16);
  const defs = recorte('meseta', silueta);
  const s = [];

  // Vegetación de lo alto que asoma por detrás de las cabezas.
  const matasFondo = [];
  for (const x of [cx - 232, cx, cx + 232]) matasFondo.push(mata(x, 340, 74, null, azar));
  matasFondo.push(mata(cx - 420, 338, 90, null, azar), mata(cx + 420, 338, 86, null, azar));
  const colMonte = { sombra: COLOR.monteSombra, base: COLOR.monte, luz: COLOR.monteLuz };
  s.push(juntar(matasFondo, ['sombra', 'base', 'luz'], colMonte));

  // Cuerpo de roca, ladera en sombra, vetas y repisa.
  s.push(relleno(COLOR.roca, silueta));
  const vetas = [];
  for (const [y, grosor] of [
    [548, 12],
    [626, 10],
    [700, 12],
  ]) {
    let v = d`M${cx - 900} ${y}`;
    for (let x = cx - 900; x < cx + 900; x += 150) {
      v += d`Q${x + 75} ${y + entre(azar, -9, 9)} ${x + 150} ${y + entre(azar, -3, 3)}`;
    }
    v += d`V${y + grosor}H${cx - 900}z`;
    vetas.push(v);
  }
  const sombraLadera = poli([
    [cx + 448, 300],
    [cx + 470, 330],
    [cx + 456, 400],
    [cx + 476, 470],
    [cx + 454, 540],
    [cx + 486, 630],
    [cx + 466, 720],
    [cx + 500, 800],
    [cx + 900, 800],
    [cx + 900, 300],
  ]);
  const sombraIzquierda = poli([
    [cx - 900, 560],
    [cx - 640, 560],
    [cx - 620, 640],
    [cx - 650, 720],
    [cx - 700, 800],
    [cx - 900, 800],
  ]);
  const grietas =
    d`M${cx - 560} 380l10 46l-8 40M${cx - 520} 520l-6 44M${cx + 520} 400l-8 52l10 38M${cx + 560} 560l6 50` +
    d`M${cx - 300} 520l8 40l-6 30M${cx + 140} 516l-6 36M${cx + 330} 600l8 38`;
  s.push(
    grupoRecortado(
      'meseta',
      relleno(COLOR.rocaVeta, ...vetas, sombraIzquierda) +
        relleno(COLOR.rocaSombra, sombraLadera) +
        trazo(COLOR.rocaSombra, 5, grietas) +
        relleno(COLOR.rocaLuz, rrect(cx - 556, 331, 1112, 10, 5)),
    ),
  );
  // Repisa tallada bajo las cabezas.
  s.push(relleno(COLOR.rocaSombra, rrect(cx - 474, 488, 948, 14, 7)));
  s.push(relleno(COLOR.rocaLuz, rrect(cx - 478, 478, 956, 13, 6.5)));

  // Matas sobre la meseta, a los lados de las cabezas.
  const matasDelante = [
    mata(cx - 520, 338, 70, null, azar),
    mata(cx - 470, 340, 54, null, azar),
    mata(cx + 478, 340, 60, null, azar),
    mata(cx + 528, 338, 66, null, azar),
  ];
  s.push(juntar(matasDelante, ['sombra', 'base', 'luz'], colMonte));

  // Cuatro cabezas de juguete talladas; la cuarta con pelo rizado.
  const tipos = ['sonrisa', 'risa', 'guino', 'rizos'];
  tipos.forEach((tipo, i) => s.push(cabeza(cx - 436 + i * 232, 296, tipo)));

  return { defs, cuerpo: s.join('') };
}

function capaMontana() {
  const W = 3600;
  const azar = crearAzar(3600);
  const s = [];
  let defs = '';

  // Nubes (lejos de los bordes y por encima de las cabezas).
  const nubes = [
    [270, 175, 1],
    [720, 112, 0.72],
    [1150, 228, 0.82],
    [1580, 118, 0.95],
    [2140, 132, 1.08],
    [2650, 214, 0.86],
    [3070, 108, 0.74],
    [3380, 238, 0.62],
  ].map(([x, y, e]) => nube(x, y, e, azar));
  s.push(juntar(nubes, ['sombra', 'base'], { sombra: COLOR.nubeSombra, base: COLOR.nube }));

  // Dos cordilleras azuladas.
  const lejana = cordillera(W, {
    semilla: 11,
    y0: 548,
    picos: 9,
    alturaPico: [428, 486],
    alturaValle: [520, 556],
    radio: 26,
  });
  const cercana = cordillera(W, {
    semilla: 23,
    y0: 610,
    picos: 11,
    alturaPico: [492, 548],
    alturaValle: [588, 622],
    radio: 22,
  });
  defs += recorte('lejana', lejana.silueta) + recorte('cercana', cercana.silueta);
  s.push(relleno(COLOR.lejania, lejana.silueta));
  s.push(grupoRecortado('lejana', relleno(COLOR.lejaniaSombra, lejana.sombras)));
  s.push(relleno(COLOR.bruma, cercana.silueta));
  s.push(grupoRecortado('cercana', relleno(COLOR.brumaSombra, cercana.sombras)));

  // Gran meseta con las cabezas, centrada en x = 1800.
  const m = meseta(1800, azar);
  defs += m.defs;
  s.push(m.cuerpo);

  return documento(W, s.join(''), defs);
}

// ---------------------------------------------------------------------------------------------------------
// Capa 2: colinas (2400 × 900, parallax 0,25)
// ---------------------------------------------------------------------------------------------------------

function capaColinas() {
  const W = 2400;
  // Máximos y mínimos alternos; el primero y el último coinciden para teselar.
  const fondo = [
    [0, 588],
    [300, 632],
    [620, 566],
    [960, 626],
    [1290, 576],
    [1610, 636],
    [1930, 570],
    [2190, 618],
    [2400, 588],
  ];
  const frente = [
    [0, 694],
    [260, 664],
    [590, 704],
    [900, 656],
    [1250, 700],
    [1560, 668],
    [1890, 708],
    [2150, 672],
    [2400, 694],
  ];

  const lejanos = [
    [70, 1, 'redondo'],
    [560, 0.85, 'redondo'],
    [598, 1.1, 'cipres'],
    [636, 1, 'redondo'],
    [1238, 1.05, 'redondo'],
    [1276, 0.85, 'redondo'],
    [1322, 1, 'cipres'],
    [1880, 1, 'cipres'],
    [1918, 1.2, 'redondo'],
    [1960, 0.85, 'redondo'],
    [2330, 0.95, 'redondo'],
  ].map(([x, s, tipo]) => arbolito(x, alturaPerfil(fondo, x) + 6, s, tipo));

  const medios = [
    [214, 1.3, 'redondo'],
    [262, 1.05, 'cipres'],
    [854, 1.35, 'cipres'],
    [900, 1.55, 'redondo'],
    [1516, 1.3, 'redondo'],
    [1590, 1.2, 'cipres'],
    [2164, 1.45, 'redondo'],
  ].map(([x, s, tipo]) => arbolito(x, alturaPerfil(frente, x) + 8, s, tipo));

  const azar = crearAzar(2400);
  const matas = [
    [306, 46],
    [948, 52],
    [2110, 44],
    [1640, 40],
  ].map(([x, ancho]) => mata(x, alturaPerfil(frente, x) + 10, ancho, null, azar));

  const s = [
    relleno(COLOR.colina, perfilSuave(fondo)),
    juntar(lejanos, ['tronco', 'sombra', 'base'], {
      tronco: COLOR.troncoLejano,
      sombra: COLOR.arbolLejanoSombra,
      base: COLOR.arbolLejano,
    }),
    relleno(COLOR.colinaFrente, perfilSuave(frente)),
    juntar(medios, ['tronco', 'sombra', 'base'], {
      tronco: COLOR.troncoMedio,
      sombra: COLOR.arbolMedioSombra,
      base: COLOR.arbolMedio,
    }),
    juntar(matas, ['sombra', 'base'], { sombra: COLOR.arbolMedioSombra, base: COLOR.arbolMedio }),
  ];
  return documento(W, s.join(''));
}

// ---------------------------------------------------------------------------------------------------------
// Capa 3: aldea (2800 × 900, parallax 0,5)
// ---------------------------------------------------------------------------------------------------------

// Tejado japonés de aleros curvados: trapecio cóncavo con las puntas levantadas, canto inferior oscuro y
// cumbrera. x0..x1 es el ancho de la pared; el alero vuela por fuera.
function tejado({ x0, x1, yAlero, alto, vuelo = 26, alzado = 14, grosor = 9, cumbrera = 0.56, remate = true }) {
  const tl = x0 - vuelo;
  const tr = x1 + vuelo;
  const medio = (x0 + x1) / 2;
  const mitad = ((x1 - x0) * cumbrera) / 2;
  const rl = medio - mitad;
  const rr = medio + mitad;
  const yr = yAlero - alto;
  const forma = (dy) =>
    d`M${rl} ${yr + dy}L${rr} ${yr + dy}` +
    d`Q${rr + (tr - rr) * 0.3} ${yAlero + 6 + dy} ${tr} ${yAlero - alzado + dy}` +
    d`Q${tr - 5} ${yAlero + 6 + dy} ${tr - 24} ${yAlero + 6 + dy}` +
    d`L${tl + 24} ${yAlero + 6 + dy}` +
    d`Q${tl + 5} ${yAlero + 6 + dy} ${tl} ${yAlero - alzado + dy}` +
    d`Q${rl - (rl - tl) * 0.3} ${yAlero + 6 + dy} ${rl} ${yr + dy}z`;
  // Vetas de las tejas: líneas que convergen hacia la cumbrera.
  const n = Math.max(3, Math.round((tr - tl) / 30));
  let vetas = '';
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const xa = rl + (rr - rl) * t;
    const xb = tl + 30 + (tr - tl - 60) * t;
    vetas += d`M${xa} ${yr + 5}L${xb} ${yAlero - 1}`;
  }
  let s = relleno(COLOR.tejaOscura, forma(grosor)) + relleno(COLOR.teja, forma(0)) + trazo(COLOR.tejaVeta, 2.5, vetas);
  if (remate) {
    s += relleno(
      COLOR.tejaOscura,
      rrect(rl - 8, yr - 8, rr - rl + 16, 12, 5),
      circ(rl - 9, yr - 9, 6.5),
      circ(rr + 9, yr - 9, 6.5),
    );
  }
  return s;
}

function ventanaReja(cx, cy, w = 48, h = 40) {
  return {
    marco: rect(cx - w / 2, cy - h / 2, w, h),
    papel: rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10),
    reja:
      rect(cx - (w - 10) / 6 - 1.3, cy - h / 2 + 5, 2.6, h - 10) +
      rect(cx + (w - 10) / 6 - 1.3, cy - h / 2 + 5, 2.6, h - 10) +
      rect(cx - w / 2 + 5, cy - 1.3, w - 10, 2.6),
  };
}

function ventanaRedonda(cx, cy, r = 25) {
  const ri = r - 5;
  const cuerda = (o) => Math.sqrt(ri * ri - o * o);
  let reja = '';
  for (const o of [-ri * 0.48, 0, ri * 0.48]) {
    reja += rect(cx + o - 1.3, cy - cuerda(o), 2.6, 2 * cuerda(o));
    reja += rect(cx - cuerda(o), cy + o - 1.3, 2 * cuerda(o), 2.6);
  }
  return { marco: circ(cx, cy, r), papel: circ(cx, cy, ri), reja };
}

function puertaCorredera(x, w, h) {
  const y = SUELO - 14 - h;
  const v = ventanaReja(x + w / 4, y + h / 2, w / 2, h);
  const v2 = ventanaReja(x + (3 * w) / 4, y + h / 2, w / 2, h);
  return { marco: v.marco + v2.marco, papel: v.papel + v2.papel, reja: v.reja + v2.reja };
}

// Fachada: pared crema, sombra del alero, entramado de madera, zócalo, ventanas y puerta.
function fachada({ x, w, y, h, ventanas = [], puerta = null, pilares = [] }) {
  const piezas = [];
  for (const v of ventanas) piezas.push(v.tipo === 'redonda' ? ventanaRedonda(v.x, v.y, v.r) : ventanaReja(v.x, v.y));
  let noren = '';
  if (puerta?.tipo === 'corredera') piezas.push(puertaCorredera(puerta.x, puerta.w, puerta.h));
  const vigas =
    rect(x, y, 10, h) +
    rect(x + w - 10, y, 10, h) +
    pilares.map((px) => rect(px - 4, y, 8, h)).join('') +
    rect(x, y + 26, w, 8);
  let s =
    relleno(COLOR.pared, rect(x, y, w, h)) +
    relleno(COLOR.paredSombra, rect(x, y, w, 26)) +
    relleno(COLOR.madera, vigas) +
    relleno(COLOR.maderaOscura, y + h >= SUELO ? rect(x - 4, SUELO - 14, w + 8, 14) : '');
  if (puerta?.tipo === 'noren') {
    const yp = SUELO - 14 - puerta.h;
    s += relleno(COLOR.maderaOscura, rect(puerta.x, yp, puerta.w, puerta.h));
    const ancho = (puerta.w - 4) / 3;
    let telas = '';
    for (let i = 0; i < 3; i++) telas += rect(puerta.x + 2 + i * ancho + 1, yp + 6, ancho - 2, puerta.h * 0.46);
    noren = relleno(puerta.color ?? COLOR.noren, telas) + relleno(COLOR.madera, rect(puerta.x - 4, yp, puerta.w + 8, 7));
  }
  s += juntar(piezas, ['marco', 'papel', 'reja'], {
    marco: COLOR.maderaOscura,
    papel: COLOR.papel,
    reja: COLOR.madera,
  });
  return s + noren;
}

function casa({ x, w, h, alto = 62, ventanas, puerta, pilares }) {
  const y = SUELO - h;
  return fachada({ x, w, y, h, ventanas, puerta, pilares }) + tejado({ x0: x, x1: x + w, yAlero: y + 4, alto });
}

// Casa de dos plantas tipo pagoda pequeña: planta alta más estrecha y tejadillo intermedio.
function pagoda({ x, w, h1, w2, h2, ventanas1, puerta, ventanas2, alto = 58 }) {
  const y1 = SUELO - h1;
  const x2 = x + (w - w2) / 2;
  const y2 = y1 - h2;
  return (
    fachada({ x: x2, w: w2, y: y2, h: h2 + 12, ventanas: ventanas2 }) +
    fachada({ x, w, y: y1, h: h1, ventanas: ventanas1, puerta }) +
    tejado({ x0: x, x1: x + w, yAlero: y1 + 4, alto: 40, cumbrera: (w2 + 16) / w, remate: false }) +
    tejado({ x0: x2, x1: x2 + w2, yAlero: y2 + 4, alto })
  );
}

// Depósito de agua cilíndrico sobre patas, con el emblema propio: un ladrillo de juguete en un círculo.
function deposito(cx) {
  const ancho = 172;
  const yT = 450;
  const yB = 574;
  const x0 = cx - ancho / 2;
  const x1 = cx + ancho / 2;
  const s = [];
  // Patas traseras, tirantes y travesaño.
  s.push(
    relleno(
      COLOR.maderaOscura,
      poli([
        [cx - 44, yB],
        [cx - 32, yB],
        [cx - 38, SUELO],
        [cx - 52, SUELO],
      ]) +
        poli([
          [cx + 32, yB],
          [cx + 44, yB],
          [cx + 52, SUELO],
          [cx + 38, SUELO],
        ]),
    ),
  );
  s.push(
    trazo(
      COLOR.maderaOscura,
      6,
      d`M${x0 + 14} ${yB + 22}L${x1 - 10} ${yB + 104}M${x1 - 14} ${yB + 22}L${x0 + 10} ${yB + 104}` +
        d`M${x0 + 6} ${yB + 116}L${x1 + 4} ${SUELO - 10}M${x1 - 6} ${yB + 116}L${x0 - 4} ${SUELO - 10}`,
    ),
  );
  s.push(relleno(COLOR.madera, rect(x0 + 2, yB + 104, ancho - 4, 9)));
  // Patas delanteras abiertas.
  s.push(
    relleno(
      COLOR.madera,
      poli([
        [x0 + 8, yB - 2],
        [x0 + 24, yB - 2],
        [x0 + 4, SUELO],
        [x0 - 14, SUELO],
      ]) +
        poli([
          [x1 - 24, yB - 2],
          [x1 - 8, yB - 2],
          [x1 + 14, SUELO],
          [x1 - 4, SUELO],
        ]),
    ),
  );
  // Tanque con luz, sombra y aros.
  const cuerpo = d`M${x0} ${yT}H${x1}V${yB}Q${cx} ${yB + 18} ${x0} ${yB}z`;
  s.push(relleno(COLOR.deposito, cuerpo));
  s.push(
    grupoRecortado(
      'tanque',
      relleno(COLOR.depositoLuz, rect(x0 + 16, yT, 20, yB - yT + 20)) +
        relleno(COLOR.depositoSombra, rect(x1 - 34, yT, 34, yB - yT + 20)) +
        trazo(COLOR.depositoSombra, 5, d`M${x0} ${yT + 20}Q${cx} ${yT + 32} ${x1} ${yT + 20}M${x0} ${yB - 16}Q${cx} ${yB - 4} ${x1} ${yB - 16}`),
    ),
  );
  // Emblema: círculo blanco con un ladrillo de juguete (rectángulo redondeado y dos studs).
  const ey = (yT + yB) / 2 + 2;
  s.push(relleno(COLOR.emblema, circ(cx, ey, 36)));
  s.push(
    relleno(
      COLOR.deposito,
      rrect(cx - 26, ey - 6, 52, 25, 5),
      rrectArriba(cx - 19, ey - 15, 13, 11, 4),
      rrectArriba(cx + 6, ey - 15, 13, 11, 4),
    ),
  );
  // Pasarela con barandilla.
  let barrotes = '';
  for (let x = x0 - 8; x <= x1 + 6; x += 17) barrotes += rect(x, yB - 30, 3.5, 26);
  s.push(relleno(COLOR.madera, rect(x0 - 12, yB - 32, ancho + 24, 5) + barrotes));
  s.push(relleno(COLOR.maderaOscura, rect(x0 - 16, yB - 6, ancho + 32, 10)));
  // Tejado cónico con remate.
  const tejadoCono = (dy) =>
    d`M${cx - 7} ${yT - 50 + dy}H${cx + 7}Q${cx + 34} ${yT - 6 + dy} ${x1 + 20} ${yT - 6 + dy}` +
    d`Q${x1 + 12} ${yT + 8 + dy} ${x1 - 6} ${yT + 8 + dy}H${x0 + 6}Q${x0 - 12} ${yT + 8 + dy} ${x0 - 20} ${yT - 6 + dy}` +
    d`Q${cx - 34} ${yT - 6 + dy} ${cx - 7} ${yT - 50 + dy}z`;
  s.push(relleno(COLOR.tejaOscura, tejadoCono(9)) + relleno(COLOR.teja, tejadoCono(0)));
  s.push(relleno(COLOR.tejaOscura, circ(cx, yT - 56, 7) + rect(cx - 2, yT - 56, 4, 8)));
  return { defs: recorte('tanque', cuerpo), cuerpo: s.join('') };
}

function poste(x, yTop) {
  return {
    madera: rect(x - 6, yTop, 12, SUELO - yTop),
    sombra: rect(x + 2, yTop, 4, SUELO - yTop) + rrect(x - 32, yTop + 14, 64, 8, 3),
    aislador: circ(x - 25, yTop + 12, 4.5) + circ(x + 25, yTop + 12, 4.5),
  };
}

// Punto de una cuadrática.
function puntoCuad([x0, y0], [cx, cy], [x1, y1], t) {
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
}

function farolillo(x, yCuelgue, largo) {
  const cy = yCuelgue + largo + 14;
  return {
    cuerda: d`M${x} ${yCuelgue}V${cy - 14}`,
    tapa: rect(x - 7, cy - 17, 14, 5) + rect(x - 7, cy + 12, 14, 5),
    cuerpo: elip(x, cy, 12, 15),
    luz: elip(x - 3.5, cy - 1, 4, 10),
  };
}

function capaAldea() {
  const W = 2800;
  const s = [];
  let defs = '';

  // Calle sobre la que se apoya la aldea.
  s.push(relleno(COLOR.calleBorde, rect(0, 762, W, 6)) + relleno(COLOR.calle, rect(0, 768, W, ALTO - 768)));

  // Casas, pagodas y depósito.
  s.push(
    casa({
      x: 150,
      w: 220,
      h: 126,
      pilares: [260],
      ventanas: [{ tipo: 'redonda', x: 205, y: 712, r: 24 }],
      puerta: { tipo: 'corredera', x: 282, w: 60, h: 76 },
    }),
  );
  s.push(
    pagoda({
      x: 460,
      w: 244,
      h1: 120,
      w2: 166,
      h2: 108,
      ventanas1: [
        { x: 512, y: 716 },
        { x: 652, y: 716 },
      ],
      puerta: { tipo: 'noren', x: 556, w: 52, h: 78 },
      ventanas2: [{ tipo: 'redonda', x: 582, y: 580, r: 24 }],
    }),
  );
  s.push(
    casa({
      x: 860,
      w: 262,
      h: 118,
      alto: 58,
      pilares: [948, 1036],
      ventanas: [
        { x: 904, y: 718 },
        { x: 992, y: 718 },
      ],
      puerta: { tipo: 'noren', x: 1054, w: 52, h: 74, color: COLOR.norenNaranja },
    }),
  );
  const torre = deposito(1312);
  defs += torre.defs;
  s.push(torre.cuerpo);
  s.push(
    casa({
      x: 1560,
      w: 200,
      h: 142,
      alto: 64,
      pilares: [],
      ventanas: [{ tipo: 'redonda', x: 1620, y: 700, r: 26 }],
      puerta: { tipo: 'corredera', x: 1676, w: 56, h: 80 },
    }),
  );
  s.push(
    pagoda({
      x: 1850,
      w: 252,
      h1: 124,
      w2: 172,
      h2: 112,
      ventanas1: [{ tipo: 'redonda', x: 1906, y: 708, r: 23 }],
      puerta: { tipo: 'corredera', x: 2000, w: 64, h: 80 },
      ventanas2: [
        { x: 1946, y: 572 },
        { x: 2006, y: 572 },
      ],
    }),
  );
  s.push(
    casa({
      x: 2270,
      w: 236,
      h: 122,
      pilares: [2388],
      ventanas: [
        { x: 2318, y: 716 },
        { x: 2450, y: 716 },
      ],
      puerta: { tipo: 'noren', x: 2362, w: 52, h: 76 },
    }),
  );
  s.push(
    casa({
      x: 2590,
      w: 156,
      h: 108,
      alto: 54,
      ventanas: [{ tipo: 'redonda', x: 2668, y: 726, r: 21 }],
    }),
  );

  // Postes con cables combados (el último tramo cruza la costura y se dibuja dos veces) y farolillos.
  const yTop = 528;
  const xs = [80, 790, 1490, 2190];
  s.push(
    juntar(
      xs.map((x) => poste(x, yTop)),
      ['madera', 'sombra', 'aislador'],
      { madera: COLOR.madera, sombra: COLOR.maderaOscura, aislador: COLOR.pared },
    ),
  );
  let cables = '';
  const farolillos = [];
  const tramos = xs.map((x, i) => [x, i < xs.length - 1 ? xs[i + 1] : xs[0] + W]);
  tramos.forEach(([a, b], i) => {
    for (const [lado, caida] of [
      [-25, 44],
      [25, 30],
    ]) {
      const p0 = [a + lado, yTop + 12];
      const p1 = [b + lado, yTop + 12];
      const c = [(p0[0] + p1[0]) / 2, p0[1] + caida * 2];
      for (const desfase of b > W ? [0, -W] : [0]) {
        cables += d`M${p0[0] + desfase} ${p0[1]}Q${c[0] + desfase} ${c[1]} ${p1[0] + desfase} ${p1[1]}`;
      }
      // Farolillos colgando del cable bajo en los tramos 1 y 3.
      if (lado === -25 && (i === 0 || i === 2)) {
        for (let k = 1; k <= 5; k++) {
          const [fx, fy] = puntoCuad(p0, c, p1, k / 6);
          farolillos.push(farolillo(fx, fy, k % 2 ? 10 : 18));
        }
      }
    }
  });
  s.push(trazo(COLOR.cable, 2.5, cables));
  s.push(trazo(COLOR.farolTapa, 2, farolillos.map((f) => f.cuerda).join('')));
  s.push(juntar(farolillos, ['cuerpo', 'luz', 'tapa'], { cuerpo: COLOR.farol, luz: COLOR.farolLuz, tapa: COLOR.farolTapa }));

  return documento(W, s.join(''), defs);
}

// ---------------------------------------------------------------------------------------------------------
// Capa 4: árboles (2000 × 900, parallax 0,8)
// ---------------------------------------------------------------------------------------------------------

function arbol(x, R, cy, azar) {
  const bolas = [
    [0, 0, 1],
    [-0.64, 0.2, 0.66],
    [0.64, 0.22, 0.64],
    [-0.34, -0.48, 0.62],
    [0.36, -0.44, 0.6],
    [0, 0.42, 0.7],
  ].map(([bx, by, br]) => [x + bx * R + entre(azar, -3, 3), cy + by * R + entre(azar, -3, 3), br * R]);
  const tronco = poli([
    [x - 16, SUELO],
    [x - 9, cy + R * 0.3],
    [x + 9, cy + R * 0.3],
    [x + 16, SUELO],
  ]);
  const troncoSombra = poli([
    [x + 3, cy + R * 0.3],
    [x + 9, cy + R * 0.3],
    [x + 16, SUELO],
    [x + 6, SUELO],
  ]);
  const ramas = d`M${x - 2} ${cy + R * 0.62}L${x - R * 0.36} ${cy + R * 0.26}M${x + 2} ${cy + R * 0.7}L${x + R * 0.4} ${cy + R * 0.34}`;
  const copaSombra = bolas.map(([bx, by, br]) => circ(bx, by, br)).join('');
  const copa = bolas.map(([bx, by, br]) => circ(bx - R * 0.07, by - R * 0.1, br * 0.92)).join('');
  const brillos = [
    [-0.42, -0.58, 0.2],
    [-0.08, -0.74, 0.15],
    [-0.8, 0.02, 0.15],
    [0.22, -0.6, 0.12],
  ]
    .map(([bx, by, br]) => circ(x + bx * R, cy + by * R, br * R))
    .join('');
  return (
    relleno(COLOR.tronco, tronco) +
    relleno(COLOR.troncoSombra, troncoSombra) +
    trazo(COLOR.tronco, 9, ramas) +
    relleno(COLOR.hojaSombra, copaSombra) +
    relleno(COLOR.hoja, copa) +
    relleno(COLOR.hojaLuz, brillos)
  );
}

function capaArboles() {
  const W = 2000;
  const azar = crearAzar(2000);
  const s = [];

  // Pocos árboles de copa redonda (uno cada ~500 px), detrás de la valla.
  for (const [x, R, cy] of [
    [250, 100, 548],
    [748, 86, 576],
    [1252, 106, 540],
    [1746, 92, 566],
  ]) {
    s.push(arbol(x, R, cy, azar));
  }

  // Valla continua: raíles de lado a lado y postes cada 100 px (ninguno toca un borde).
  let postes = '';
  let postesSombra = '';
  for (let x = 50; x < W; x += 100) {
    postes += rrectArriba(x - 10, 690, 20, SUELO - 690, 10);
    postesSombra += rect(x + 4, 698, 6, SUELO - 698);
  }
  s.push(relleno(COLOR.vallaSombra, rect(0, 714, W, 14) + rect(0, 746, W, 14)));
  s.push(relleno(COLOR.valla, postes));
  s.push(relleno(COLOR.vallaSombra, postesSombra));

  // Hierba con matojos y algún arbusto.
  let matojos = '';
  for (let x = 20; x < W; x += 40) {
    const h = entre(azar, 8, 15);
    matojos += d`M${x - 9} 772Q${x - 4} ${772 - h} ${x} ${772 - h - 2}Q${x + 4} ${772 - h} ${x + 9} 772z`;
  }
  s.push(relleno(COLOR.hierba, rect(0, 770, W, ALTO - 770) + matojos));
  const arbustos = [
    [500, 120],
    [1000, 96],
    [1500, 132],
  ].map(([x, ancho]) => mata(x, SUELO, ancho, null, azar));
  s.push(juntar(arbustos, ['sombra', 'base', 'luz'], { sombra: COLOR.hojaSombra, base: COLOR.hoja, luz: COLOR.hojaLuz }));

  return documento(W, s.join(''));
}

// ---------------------------------------------------------------------------------------------------------

const CAPAS = {
  'montana.svg': capaMontana,
  'colinas.svg': capaColinas,
  'aldea.svg': capaAldea,
  'arboles.svg': capaArboles,
};

mkdirSync(DESTINO, { recursive: true });
let total = 0;
for (const [nombre, generar] of Object.entries(CAPAS)) {
  const ruta = DESTINO + nombre;
  writeFileSync(ruta, generar());
  const bytes = statSync(ruta).size;
  total += bytes;
  console.log(`${nombre.padEnd(12)} ${(bytes / 1024).toFixed(1).padStart(6)} KB`);
}
console.log(`${'total'.padEnd(12)} ${(total / 1024).toFixed(1).padStart(6)} KB`);
