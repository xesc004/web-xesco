// Objetos del nivel: piezas, bloques sorpresa, yunque, cama elástica, robots, banderas, clones y meta.
import { medirElementos } from '../mundo/plataformas.js';
import { sonar } from '../ui/sonido.js';
import { aplicarHoja } from './jugador.js';

const CLAVE_PIEZAS = 'xesco.piezas';

function leerRecogidas() {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE_PIEZAS) || '[]')); } catch { return new Set(); }
}

function guardarRecogidas(recogidas) {
  try { localStorage.setItem(CLAVE_PIEZAS, JSON.stringify([...recogidas])); } catch { /* sin almacenamiento */ }
}

function solapan(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Reinicia una animación CSS aunque ya se esté reproduciendo
export function reanimar(el, clase) {
  if (!el) return;
  el.classList.remove(clase);
  void el.offsetWidth;
  el.classList.add(clase);
  el.addEventListener('animationend', () => el.classList.remove(clase), { once: true });
}

export function abrirSorpresa(boton, abrir = boton.getAttribute('aria-expanded') !== 'true') {
  const panel = document.getElementById(boton.getAttribute('aria-controls'));
  boton.setAttribute('aria-expanded', String(abrir));
  if (panel) panel.hidden = !abrir;
  reanimar(boton, 'golpeado');
  sonar('golpe');
}

export function activarSorpresas(mundo) {
  mundo.querySelectorAll('.sorpresa').forEach((boton) => {
    boton.addEventListener('click', (e) => {
      abrirSorpresa(boton);
      if (e.detail > 0) boton.blur();
    });
  });
}

export function crearObjetos(mundo) {
  return {
    mundo,
    piezas: [],
    zonas: [],
    robots: [],
    meta: null,
    recogidas: leerRecogidas(),
    zonaActual: null,
    clonesLanzados: false,
    metaAlcanzada: false,
  };
}

export function medirObjetos(o) {
  o.piezas = [...o.mundo.querySelectorAll('.pieza')].map((el, i) => ({ el, id: `pieza-${i}` }));
  const medidas = new Map(medirElementos(o.mundo, '.pieza').map((m) => [m.el, m]));
  for (const p of o.piezas) {
    Object.assign(p, medidas.get(p.el) ?? { x: -9999, y: -9999, w: 0, h: 0 });
    p.el.classList.toggle('recogida', o.recogidas.has(p.id));
  }
  o.zonas = medirElementos(o.mundo, '[data-zona]')
    .map((z) => ({ ...z, id: z.el.dataset.zona, bandera: z.el.querySelector(':scope > .bandera:not(.meta)') }))
    .sort((a, b) => a.x - b.x);
  o.robots = medirElementos(o.mundo, '.robot');
  o.meta = medirElementos(o.mundo, '.bandera.meta')[0] ?? null;
}

export function contarPiezas(o) {
  return { recogidas: o.recogidas.size, total: o.piezas.length };
}

export function actualizarObjetos(o, jugador, eventos, porId, avisos) {
  const c = jugador.cuerpo;

  for (const p of o.piezas) {
    if (o.recogidas.has(p.id) || !solapan(c, p)) continue;
    o.recogidas.add(p.id);
    p.el.classList.add('recogida');
    guardarRecogidas(o.recogidas);
    sonar('pieza');
    avisos.piezas(o.recogidas.size, o.piezas.length);
  }

  for (const e of eventos) {
    const el = porId.get(e.id)?.el;
    if (e.tipo === 'salta') {
      sonar('salto');
    } else if (e.tipo === 'golpeaTecho' && el?.classList.contains('sorpresa')) {
      abrirSorpresa(el, true);
    } else if (e.tipo === 'rebota') {
      reanimar(el, 'rebota');
      sonar('rebote');
    } else if (e.tipo === 'aterriza' && el) {
      if (el.classList.contains('forja')) {
        reanimar(el, 'clang');
        sonar('clang');
      } else if (el.classList.contains('letra')) {
        reanimar(el, 'pisada');
      }
    }
  }

  const centro = c.x + c.w / 2;
  for (const r of o.robots) r.el.classList.toggle('saluda', Math.abs(centro - (r.x + r.w / 2)) < 380);

  let actual = null;
  for (const z of o.zonas) if (centro >= z.x + 40) actual = z;
  if (actual && actual !== o.zonaActual) {
    o.zonaActual = actual;
    actual.bandera?.classList.add('izada');
    avisos.zona(actual);
    if (actual.id === 'metodologia' && !o.clonesLanzados) {
      o.clonesLanzados = true;
      avisos.clones();
    }
  }

  if (!o.metaAlcanzada && o.meta && c.enSuelo && centro >= o.meta.x) {
    o.metaAlcanzada = true;
    o.meta.el.classList.add('izada');
    sonar('meta');
    avisos.meta(o.recogidas.size, o.piezas.length);
  }
}

// Metodología: el muñeco «orquestador» lanza tres clones que salen corriendo y se desvanecen
export function lanzarClones(mundo, jugador) {
  const { cuerpo: c, sprites } = jugador;
  const andar = sprites.animaciones.andar;
  const tam = sprites.fotograma;
  for (let i = 0; i < 3; i++) {
    const clon = document.createElement('div');
    clon.className = 'muneco clon listo';
    clon.setAttribute('aria-hidden', 'true');
    aplicarHoja(clon, sprites);
    const indice = andar.inicio + ((i * 3) % andar.n);
    clon.style.backgroundPosition = `${-(indice % sprites.columnas) * tam}px ${-Math.floor(indice / sprites.columnas) * tam}px`;
    clon.style.left = `${c.x + c.w / 2 - tam / 2}px`;
    clon.style.top = `${c.y + c.h - tam + sprites.pie}px`;
    clon.style.setProperty('--retraso', `${i * 0.18}s`);
    clon.style.setProperty('--destino', `${300 + i * 170}px`);
    clon.addEventListener('animationend', () => clon.remove());
    mundo.appendChild(clon);
  }
}
