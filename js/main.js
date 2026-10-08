import { crearEntrada } from './motor/entrada.js';
import { iniciarBucle } from './motor/bucle.js';
import { desatascar } from './motor/fisica.js';
import { calcularEscala, anchoVisible, ALTO_MUNDO, Y_SUELO, ANCHO_MUNDO } from './mundo/escala.js';
import { medirPlataformas, posicionEnMundo } from './mundo/plataformas.js';
import { crearFondo, medirFondo, actualizarFondo } from './mundo/fondo.js';
import { crearJugador, actualizarJugador, dibujarJugador, cambiarEstado, reaparecer } from './juego/jugador.js';
import { crearCamara, seguirCamara, centrarCamara, limitarCamara } from './juego/camara.js';
import { activarArrastre } from './juego/arrastre.js';
import {
  crearObjetos, medirObjetos, actualizarObjetos, activarSorpresas, lanzarClones, reanimar, contarPiezas,
} from './juego/objetos.js';
import { crearHud } from './ui/hud.js';
import { aplicarIdioma, idiomaInicial, idiomaActual } from './ui/i18n.js';
import { activarCV, desactivarCV, enModoCV } from './ui/cv-rapido.js';
import { activarFormulario } from './ui/contacto.js';
import { alternarSonido, sonidoActivo } from './ui/sonido.js';

const raiz = document.documentElement;
const mundo = document.getElementById('mundo');
const parametros = new URLSearchParams(location.search);
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
let juego = null;

async function cargarSprites() {
  const respuesta = await fetch('img/personaje/sprites.json');
  if (!respuesta.ok) throw new Error('No se pudo cargar sprites.json');
  const sprites = await respuesta.json();
  await new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = resolver;
    imagen.onerror = () => rechazar(new Error('No se pudo cargar la hoja de sprites'));
    imagen.src = `img/personaje/${sprites.imagen}`;
  });
  return sprites;
}

// Con ?depurar se dibuja el borde superior de cada colisionador
function pintarDepuracion(colisionadores) {
  mundo.querySelectorAll('.depurar-caja').forEach((n) => n.remove());
  for (const p of colisionadores) {
    if (p.id === 'suelo' || p.id.startsWith('pared')) continue;
    const caja = document.createElement('div');
    caja.className = 'depurar-caja';
    Object.assign(caja.style, { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${Math.min(p.h, 40)}px` });
    mundo.appendChild(caja);
  }
}

function activarControlesTactiles(entrada) {
  document.querySelectorAll('.tactil-boton').forEach((boton) => {
    const accion = boton.dataset.control;
    const soltar = () => {
      entrada.soltar(accion);
      boton.classList.remove('activo');
    };
    boton.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      entrada.pulsar(accion);
      boton.classList.add('activo');
      try { boton.setPointerCapture(e.pointerId); } catch { /* el botón funciona igual sin captura */ }
    });
    boton.addEventListener('pointerup', soltar);
    boton.addEventListener('pointercancel', soltar);
    boton.addEventListener('lostpointercapture', soltar);
  });
}

function mostrarMeta(jugador, n, total) {
  const aviso = document.getElementById('mensaje-meta');
  aviso.textContent = aviso.dataset.plantilla.replace('{n}', n).replace('{total}', total);
  aviso.hidden = false;
  jugador.cuerpo.vx = 0;
  cambiarEstado(jugador, 'celebrando');
  setTimeout(() => { aviso.hidden = true; }, 4500);
}

function crearJuego(sprites) {
  const entrada = crearEntrada();
  const camara = crearCamara();
  const fondo = crearFondo(document.querySelector('.escena'));
  const objetos = crearObjetos(mundo);
  const jugador = crearJugador(document.getElementById('muneco'), sprites, { x: 150, y: Y_SUELO });
  const estado = {
    escala: 1,
    visible: 1,
    colisionadores: [],
    porId: new Map(),
    control: { x: 150, y: Y_SUELO },
    camaraLibreHasta: 0,
  };
  const hud = crearHud({ alViajar: viajar, alSonido: alternarSonido, sonidoInicial: sonidoActivo() });
  const avisos = {
    piezas: (n, total) => hud.piezas(n, total),
    zona: (zona) => {
      estado.control = { x: zona.x + 160, y: Y_SUELO };
      hud.zona(zona.id);
    },
    clones: () => {
      if (!movimientoReducido.matches) lanzarClones(mundo, jugador);
    },
    meta: (n, total) => mostrarMeta(jugador, n, total),
  };
  const arrastre = activarArrastre({
    jugador,
    mundo,
    obtenerEscala: () => estado.escala,
    obtenerColisionadores: () => estado.colisionadores,
  });

  function centroJugador() {
    return jugador.cuerpo.x + jugador.cuerpo.w / 2;
  }

  function medir() {
    estado.escala = calcularEscala(innerWidth, innerHeight);
    estado.visible = anchoVisible(innerWidth, estado.escala);
    raiz.style.setProperty('--escala', String(estado.escala));
    raiz.style.setProperty('--mundo-y', `${innerHeight - ALTO_MUNDO * estado.escala}px`);
    estado.colisionadores = medirPlataformas(mundo);
    estado.porId = new Map(estado.colisionadores.map((p) => [p.id, p]));
    medirObjetos(objetos);
    medirFondo(fondo);
    desatascar(jugador.cuerpo, estado.colisionadores);
    const { recogidas, total } = contarPiezas(objetos);
    hud.piezas(recogidas, total);
    if (parametros.has('depurar')) pintarDepuracion(estado.colisionadores);
  }

  function viajar(id) {
    const zona = objetos.zonas.find((z) => z.id === id);
    if (!zona) return;
    reaparecer(jugador, { x: zona.x + 160, y: Y_SUELO }, estado.colisionadores);
    centrarCamara(camara, centroJugador(), estado.visible, ANCHO_MUNDO);
    estado.camaraLibreHasta = 0;
    reanimar(jugador.el, 'humo');
  }

  function actualizar(dt) {
    const e = entrada.leer();
    if (e.izquierda || e.derecha || e.saltar) estado.camaraLibreHasta = 0;
    const eventos = actualizarJugador(jugador, e, estado.colisionadores, dt);
    arrastre.actualizar(dt);
    if (jugador.cuerpo.y > ALTO_MUNDO + 300) reaparecer(jugador, estado.control, estado.colisionadores);
    actualizarObjetos(objetos, jugador, eventos, estado.porId, avisos);
    if (performance.now() > estado.camaraLibreHasta) {
      seguirCamara(camara, centroJugador(), jugador.mirando, estado.visible, ANCHO_MUNDO, dt);
    }
  }

  function dibujar() {
    mundo.style.transform = `translate3d(${(-camara.x * estado.escala).toFixed(1)}px, 0, 0) scale(${estado.escala})`;
    dibujarJugador(jugador);
    const recorrido = Math.max(1, ANCHO_MUNDO - estado.visible);
    actualizarFondo(fondo, camara.x * estado.escala, camara.x / recorrido, movimientoReducido.matches);
    hud.progreso(centroJugador() / ANCHO_MUNDO);
  }

  medir();
  centrarCamara(camara, centroJugador(), estado.visible, ANCHO_MUNDO);
  activarSorpresas(mundo);
  activarControlesTactiles(entrada);
  jugador.el.classList.add('listo');

  let espera = 0;
  addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(medir, 120);
  });
  document.fonts?.ready.then(medir);
  addEventListener('load', medir);
  document.addEventListener('idioma', () => requestAnimationFrame(medir));

  // Rueda o trackpad: el muñeco corre solo en la dirección del gesto
  addEventListener('wheel', (e) => {
    if (enModoCV()) return;
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) > 2) entrada.correrAuto(d, 180);
  }, { passive: false });

  // Navegación con teclado (Tab): la cámara viaja hasta el elemento enfocado
  mundo.addEventListener('focusin', (e) => {
    if (enModoCV() || !e.target.matches(':focus-visible')) return;
    const { x } = posicionEnMundo(e.target, mundo);
    camara.x = limitarCamara(x - estado.visible * 0.3, estado.visible, ANCHO_MUNDO);
    estado.camaraLibreHasta = performance.now() + 6000;
  });

  let bucle = iniciarBucle({ actualizar, dibujar });
  return {
    jugador,
    estado,
    objetos,
    pausar() {
      bucle.detener();
      entrada.activar(false);
    },
    reanudar() {
      medir();
      entrada.activar(true);
      bucle = iniciarBucle({ actualizar, dibujar });
    },
  };
}

async function iniciarJuego() {
  if (enModoCV()) desactivarCV();
  if (juego) {
    juego.reanudar();
    return;
  }
  try {
    juego = crearJuego(await cargarSprites());
    if (parametros.has('depurar')) window.__juego = juego;
  } catch (error) {
    console.error('No se pudo iniciar el juego; se muestra el CV rápido', error);
    activarCV();
  }
}

async function arrancar() {
  try {
    await aplicarIdioma(idiomaInicial());
  } catch (error) {
    console.warn('No se pudo aplicar el idioma', error);
  }
  activarFormulario(document.getElementById('formulario-contacto'));
  document.getElementById('boton-idioma').addEventListener('click', (e) => {
    aplicarIdioma(idiomaActual() === 'es' ? 'en' : 'es').catch((error) => console.warn(error));
    if (e.detail > 0) e.currentTarget.blur();
  });
  document.getElementById('boton-cv').addEventListener('click', () => {
    juego?.pausar();
    activarCV();
  });
  document.getElementById('boton-volver').addEventListener('click', iniciarJuego);
  if (!enModoCV()) await iniciarJuego();
}

arrancar();
