// El muñeco: cuerpo físico, estados de animación y dibujo con la hoja de sprites.
import { crearCuerpo, paso, desatascar } from '../motor/fisica.js';

const ANCHO_CUERPO = 60;
const ALTO_CUERPO = 140;
const QUIETO = { izquierda: false, derecha: false, saltar: false, saltoPulsado: false, bajar: false };
const FRONTALES = new Set(['parado', 'saludar', 'celebrar', 'colgado']);

export function aplicarHoja(el, sprites) {
  el.style.backgroundImage = `url("img/personaje/${sprites.imagen}")`;
  el.style.setProperty('--columnas', sprites.columnas);
  el.style.setProperty('--filas', sprites.filas);
}

export function crearJugador(el, sprites, inicio) {
  aplicarHoja(el, sprites);
  return {
    el,
    sprites,
    cuerpo: crearCuerpo({ x: inicio.x - ANCHO_CUERPO / 2, y: inicio.y - ALTO_CUERPO, w: ANCHO_CUERPO, h: ALTO_CUERPO }),
    estado: 'saludando',
    anterior: null,
    tiempo: 0,
    mirando: 1,
    aterrizaje: 0,
    angulo: 0,
  };
}

export function cambiarEstado(j, estado) {
  if (j.estado === estado) return;
  j.anterior = j.estado;
  j.estado = estado;
  j.tiempo = 0;
}

export function actualizarJugador(j, entrada, colisionadores, dt) {
  j.tiempo += dt;
  if (j.aterrizaje > 0) j.aterrizaje -= dt;
  if (j.estado === 'colgado') return [];
  if (j.estado === 'celebrando') {
    if (j.tiempo < 2.6) {
      paso(j.cuerpo, QUIETO, colisionadores, dt);
      return [];
    }
    cambiarEstado(j, 'parado');
  }
  if (j.estado === 'saludando') {
    const saludo = j.sprites.animaciones.saludar;
    const quiereMoverse = entrada.izquierda || entrada.derecha || entrada.saltar;
    if (!quiereMoverse && j.tiempo < saludo.n / saludo.fps + 0.4) {
      paso(j.cuerpo, QUIETO, colisionadores, dt);
      return [];
    }
  }

  const eventos = paso(j.cuerpo, entrada, colisionadores, dt);
  const c = j.cuerpo;
  if (entrada.derecha !== entrada.izquierda) j.mirando = entrada.derecha ? 1 : -1;
  else if (Math.abs(c.vx) > 40) j.mirando = Math.sign(c.vx);
  if (eventos.some((e) => e.tipo === 'aterriza')) j.aterrizaje = 0.1;

  let nuevo = 'parado';
  if (!c.enSuelo) nuevo = c.vy < 0 ? 'saltando' : 'cayendo';
  else if (Math.abs(c.vx) > 25) nuevo = 'andando';
  cambiarEstado(j, nuevo);
  return eventos;
}

function animacionActual(j) {
  switch (j.estado) {
    case 'saludando': return 'saludar';
    case 'colgado': return 'colgado';
    case 'celebrando': return 'celebrar';
    case 'saltando': return 'saltar';
    case 'cayendo': return 'caer';
    case 'andando': return j.anterior === 'parado' && j.tiempo < 0.1 ? 'giro' : 'andar';
    default: return j.aterrizaje > 0 ? 'aterrizar' : 'parado';
  }
}

export function dibujarJugador(j) {
  const { sprites, cuerpo: c } = j;
  const nombre = animacionActual(j);
  const a = sprites.animaciones[nombre];
  const fotograma = Math.floor(j.tiempo * a.fps);
  const indice = a.inicio + (a.bucle ? fotograma % a.n : Math.min(a.n - 1, fotograma));
  const tam = sprites.fotograma;
  j.el.style.backgroundPosition = `${-(indice % sprites.columnas) * tam}px ${-Math.floor(indice / sprites.columnas) * tam}px`;
  const x = c.x + c.w / 2 - tam / 2;
  const y = c.y + c.h - tam + sprites.pie;
  const reflejo = FRONTALES.has(nombre) ? 1 : j.mirando;
  j.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${j.angulo.toFixed(2)}deg) scaleX(${reflejo})`;
}

export function reaparecer(j, punto, colisionadores) {
  const c = j.cuerpo;
  c.x = punto.x - c.w / 2;
  c.y = punto.y - c.h;
  c.vx = 0;
  c.vy = 0;
  c.enSuelo = false;
  c.sobre = null;
  desatascar(c, colisionadores);
  j.angulo = 0;
  cambiarEstado(j, 'cayendo');
}
