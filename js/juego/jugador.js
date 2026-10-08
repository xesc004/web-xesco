// El muñeco: cuerpo físico, estados de animación, premios (bandana, capa, aura) y dibujo con la hoja de sprites.
import { crearCuerpo, paso, desatascar } from '../motor/fisica.js';

const ANCHO_CUERPO = 60;
const ALTO_CUERPO = 140;
const QUIETO = { izquierda: false, derecha: false, saltar: false, saltoPulsado: false, bajar: false };
const FRONTALES = new Set(['parado', 'saludar', 'celebrar', 'colgado', 'sentado']);
const ESPERA = 8;

// Premios por piezas recogidas: cada uno añade una clase al muñeco (con-bandana, con-capa, con-aura)
export const PREMIOS = [
  { id: 'bandana', piezas: 12 },
  { id: 'capa', piezas: 24 },
  { id: 'aura', piezas: 36 },
];

export function premiosPara(piezas) {
  return PREMIOS.filter((p) => piezas >= p.piezas).map((p) => p.id);
}

export function aplicarHoja(el, sprites) {
  el.style.backgroundImage = `url("img/personaje/${sprites.imagen}")`;
  el.style.setProperty('--columnas', sprites.columnas);
  el.style.setProperty('--filas', sprites.filas);
}

export function posicionFotograma(sprites, indice) {
  const tam = sprites.fotograma;
  return `${-(indice % sprites.columnas) * tam}px ${-Math.floor(indice / sprites.columnas) * tam}px`;
}

export function crearJugador(el, sprites, inicio) {
  const sprite = el.querySelector('.jugador-sprite');
  aplicarHoja(sprite, sprites);
  return {
    el,
    sprite,
    sprites,
    cuerpo: crearCuerpo({ x: inicio.x - ANCHO_CUERPO / 2, y: inicio.y - ALTO_CUERPO, w: ANCHO_CUERPO, h: ALTO_CUERPO }),
    estado: 'saludando',
    anterior: null,
    tiempo: 0,
    mirando: 1,
    mirarA: 0,
    aterrizaje: 0,
    angulo: 0,
    inclinacion: 0,
    // Estirar y aplastar: escala con muelle (1 = normal) y su velocidad
    escala: { x: 1, y: 1, vx: 0, vy: 0 },
    // Agitación del arrastre (0-1): acelera el pataleo mientras cuelga
    agitacion: 0,
    // Lanzado con el ratón: deja estela hasta que aterriza
    lanzado: false,
    quieto: 0,
    premios: new Set(),
    dibujado: { indice: -1, vista: '', cabeza: -1, vaiven: 0 },
  };
}

export function cambiarEstado(j, estado) {
  if (j.estado === estado) return;
  j.anterior = j.estado;
  j.estado = estado;
  j.tiempo = 0;
}

// Pone los premios que tocan con n piezas y devuelve los que se acaban de ganar
export function ponerPremios(j, piezas) {
  const nuevos = [];
  for (const id of premiosPara(piezas)) {
    if (j.premios.has(id)) continue;
    j.premios.add(id);
    j.el.classList.add(`con-${id}`);
    nuevos.push(id);
  }
  return nuevos;
}

export function quitarPremios(j) {
  for (const id of j.premios) j.el.classList.remove(`con-${id}`);
  j.premios.clear();
}

// Se ríe si se le pasa el ratón por encima mientras está tranquilo en el suelo
export function reir(j) {
  if (!j.cuerpo.enSuelo || !['parado', 'esperando'].includes(j.estado)) return false;
  cambiarEstado(j, 'riendo');
  j.quieto = 0;
  return true;
}

function duracion(j, nombre, extra = 0) {
  const a = j.sprites.animaciones[nombre];
  return a ? a.n / a.fps + extra : 0;
}

// Estados que se reproducen enteros mientras no se toque nada
function duracionPausa(j) {
  switch (j.estado) {
    case 'celebrando': return 2.6;
    case 'riendo': return 1.4;
    case 'saludando': return duracion(j, 'saludar', 0.4);
    case 'esperando': return j.sprites.animaciones.sentado ? Infinity : duracion(j, 'saludar', 0.5);
    default: return 0;
  }
}

export function actualizarJugador(j, entrada, colisionadores, dt) {
  j.tiempo += dt;
  if (j.aterrizaje > 0) j.aterrizaje -= dt;
  if (j.estado === 'colgado') {
    // Patalea más deprisa cuanto más se le zarandea
    j.tiempo += dt * j.agitacion * 1.8;
    muelle(j, dt);
    return [];
  }
  const quiereMoverse = entrada.izquierda || entrada.derecha || entrada.saltar;
  j.quieto = quiereMoverse ? 0 : j.quieto + dt;

  const pausa = duracionPausa(j);
  if (pausa > 0) {
    // La celebración de la meta no se interrumpe; el resto sí, en cuanto se pulsa algo
    if (j.tiempo < pausa && (j.estado === 'celebrando' || !quiereMoverse)) {
      paso(j.cuerpo, QUIETO, colisionadores, dt);
      inclinar(j, QUIETO, dt);
      muelle(j, dt);
      return [];
    }
    if (j.estado !== 'saludando') cambiarEstado(j, 'parado');
  }

  const eventos = paso(j.cuerpo, entrada, colisionadores, dt);
  const c = j.cuerpo;
  if (c.pared !== 0) j.mirando = -c.pared;
  else if (entrada.derecha !== entrada.izquierda) j.mirando = entrada.derecha ? 1 : -1;
  else if (Math.abs(c.vx) > 40) j.mirando = Math.sign(c.vx);
  for (const e of eventos) {
    if (e.tipo === 'salta' || e.tipo === 'saltaPared') estirar(j, 0.84, 1.2);
    else if (e.tipo === 'rebota') estirar(j, 0.8, 1.26);
    else if (e.tipo === 'aterriza') {
      j.aterrizaje = 0.1;
      j.lanzado = false;
      // Cuanto más fuerte cae, más se aplasta
      const fuerza = Math.min(1, e.impacto / 1400);
      estirar(j, 1 + 0.28 * fuerza, 1 - 0.26 * fuerza);
    }
  }

  let nuevo = 'parado';
  if (c.pared !== 0) nuevo = 'enPared';
  else if (!c.enSuelo) nuevo = c.vy < 0 ? 'saltando' : 'cayendo';
  else if (Math.abs(c.vx) > 25) nuevo = 'andando';
  else if (j.quieto >= ESPERA) {
    nuevo = 'esperando';
    // La siguiente espera llega 15 s después
    j.quieto = ESPERA - 15;
    eventos.push({ tipo: 'espera' });
  }
  cambiarEstado(j, nuevo);
  inclinar(j, entrada, dt);
  muelle(j, dt);
  return eventos;
}

export function estirar(j, x, y) {
  j.escala.x = x;
  j.escala.y = y;
  j.escala.vx = 0;
  j.escala.vy = 0;
}

// Muelle amortiguado que devuelve la escala a 1 con un pequeño rebote
function muelle(j, dt) {
  const e = j.escala;
  const rigidez = 420;
  const amortiguacion = 18;
  e.vx += ((1 - e.x) * rigidez - e.vx * amortiguacion) * dt;
  e.vy += ((1 - e.y) * rigidez - e.vy * amortiguacion) * dt;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
}

// Frena (o cambia de sentido) con velocidad: el cuerpo se echa hacia atrás, como derrapando
export function derrapando(j, entrada) {
  const c = j.cuerpo;
  if (!c.enSuelo || Math.abs(c.vx) < 160) return false;
  const dir = (entrada.derecha ? 1 : 0) - (entrada.izquierda ? 1 : 0);
  return dir !== Math.sign(c.vx);
}

// Inclinación hacia atrás al frenar y temblor de risa (se suma al ángulo
// del arrastre)
function inclinar(j, entrada, dt) {
  let objetivo = 0;
  if (j.estado === 'riendo') objetivo = Math.sin(j.tiempo * 38) * 5;
  else if (derrapando(j, entrada)) objetivo = -Math.sign(j.cuerpo.vx) * Math.min(14, Math.abs(j.cuerpo.vx) / 40);
  j.inclinacion += (objetivo - j.inclinacion) * Math.min(1, dt * (j.estado === 'riendo' ? 40 : 10));
}

function animacionActual(j) {
  switch (j.estado) {
    case 'saludando': return 'saludar';
    case 'colgado': return 'colgado';
    case 'celebrando':
    case 'riendo': return 'celebrar';
    case 'esperando': return j.sprites.animaciones.sentado ? 'sentado' : 'saludar';
    case 'saltando': return 'saltar';
    case 'cayendo':
    case 'enPared': return 'caer';
    case 'andando': return j.anterior === 'parado' && j.tiempo < 0.1 ? 'giro' : 'andar';
    default:
      if (j.aterrizaje > 0) return 'aterrizar';
      // Quieto: se gira a mirar hacia el ratón si está lejos
      return j.mirarA !== 0 ? 'mirar' : 'parado';
  }
}

export function dibujarJugador(j) {
  const { sprites, cuerpo: c, dibujado } = j;
  const nombre = animacionActual(j);
  let indice;
  let reflejo;
  if (nombre === 'mirar') {
    const giro = sprites.animaciones.giro;
    indice = giro.inicio + giro.n - 1;
    reflejo = j.mirarA;
  } else {
    const a = sprites.animaciones[nombre];
    const fotograma = Math.floor(j.tiempo * a.fps);
    indice = a.inicio + (a.bucle ? fotograma % a.n : Math.min(a.n - 1, fotograma));
    reflejo = FRONTALES.has(nombre) ? 1 : j.mirando;
  }
  if (indice !== dibujado.indice) {
    dibujado.indice = indice;
    j.sprite.style.backgroundPosition = posicionFotograma(sprites, indice);
    const cabeza = sprites.cabeza?.[indice] ?? 10;
    if (cabeza !== dibujado.cabeza) {
      dibujado.cabeza = cabeza;
      j.el.style.setProperty('--cabeza', `${cabeza}px`);
    }
  }
  const vista = FRONTALES.has(nombre) ? 'frente' : 'perfil';
  if (vista !== dibujado.vista) {
    dibujado.vista = vista;
    j.el.dataset.vista = vista;
  }
  // Vaivén de la capa y de las cintas de la bandana según la velocidad
  if (j.premios.size) {
    const vaiven = vista === 'perfil' ? Math.round(Math.min(1, Math.abs(c.vx) / 640) * 45 + (c.vy < 0 ? 8 : 0)) : 0;
    if (vaiven !== dibujado.vaiven) {
      dibujado.vaiven = vaiven;
      j.el.style.setProperty('--vaiven', `${vaiven}deg`);
    }
  }
  const tam = sprites.fotograma;
  const x = c.x + c.w / 2 - tam / 2;
  const y = c.y + c.h - tam + sprites.pie;
  const { x: ex, y: ey } = j.escala;
  j.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(j.angulo + j.inclinacion).toFixed(2)}deg) scale(${(reflejo * ex).toFixed(3)}, ${ey.toFixed(3)})`;
}

// Imagen residual al lanzarlo con el ratón: copia del fotograma actual que se desvanece
export function dejarEstela(j, mundo) {
  if (mundo.querySelectorAll('.estela').length >= 8) return;
  const estela = document.createElement('div');
  estela.className = 'muneco estela';
  estela.setAttribute('aria-hidden', 'true');
  aplicarHoja(estela, j.sprites);
  estela.style.backgroundPosition = j.sprite.style.backgroundPosition;
  estela.style.transform = j.el.style.transform;
  estela.addEventListener('animationend', () => estela.remove());
  mundo.appendChild(estela);
}

export function reaparecer(j, punto, colisionadores) {
  const c = j.cuerpo;
  c.x = punto.x - c.w / 2;
  c.y = punto.y - c.h;
  c.vx = 0;
  c.vy = 0;
  c.enSuelo = false;
  c.sobre = null;
  c.pared = 0;
  desatascar(c, colisionadores);
  j.angulo = 0;
  j.inclinacion = 0;
  j.lanzado = false;
  estirar(j, 1, 1);
  cambiarEstado(j, 'cayendo');
}
