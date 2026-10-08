import { crearEntrada } from './motor/entrada.js';
import { iniciarBucle } from './motor/bucle.js';
import { desatascar } from './motor/fisica.js';
import { calcularEscala, anchoVisible, ALTO_MUNDO, Y_SUELO, ANCHO_MUNDO } from './mundo/escala.js';
import { medirPlataformas, posicionEnMundo } from './mundo/plataformas.js';
import { crearFondo, medirFondo, actualizarFondo } from './mundo/fondo.js';
import { crearHojas, redimensionarHojas, moverHojas, dibujarHojas } from './mundo/hojas.js';
import {
  crearJugador, actualizarJugador, dibujarJugador, cambiarEstado, reaparecer, ponerPremios, quitarPremios, reir,
  dejarEstela, derrapando,
} from './juego/jugador.js';
import { crearParticulas, emitir, actualizarParticulas } from './juego/particulas.js';
import { crearResumen } from './juego/resumen.js';
import { crearSala } from './juego/sala.js';
import { crearKonami, SECRETOS } from './juego/secretos.js';
import { crearBocadillo, decir, callar, actualizarBocadillo } from './juego/bocadillo.js';
import { activarRaton } from './juego/raton.js';
import { crearCamara, seguirCamara, centrarCamara, limitarCamara } from './juego/camara.js';
import { activarArrastre } from './juego/arrastre.js';
import {
  crearObjetos, medirObjetos, actualizarObjetos, activarSorpresas, lanzarClones, reanimar, contarPiezas,
  apuntarSecreto, reiniciarObjetos,
} from './juego/objetos.js';
import { crearHud } from './ui/hud.js';
import { aplicarIdioma, idiomaInicial, idiomaActual } from './ui/i18n.js';
import { activarCV, desactivarCV, enModoCV } from './ui/cv-rapido.js';
import { activarFormulario } from './ui/contacto.js';
import { alternarSonido, sonidoActivo, sonar } from './ui/sonido.js';
import { cerrarIntro, quitarIntro, introActiva } from './ui/intro.js';

const raiz = document.documentElement;
const mundo = document.getElementById('mundo');
const parametros = new URLSearchParams(location.search);
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
let juego = null;
let arrancando = null;

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

const ESPERA_AYUDA = 4;

// La pieza recogida vuela desde su sitio hasta el contador de arriba, que da un saltito al recibirla
function volarAlContador(pieza) {
  const destino = document.querySelector('.hud-pieza');
  if (!destino) return;
  const a = pieza.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  const vuela = document.createElement('span');
  vuela.className = 'pieza-vuela';
  vuela.setAttribute('aria-hidden', 'true');
  Object.assign(vuela.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.appendChild(vuela);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const final = b.width / Math.max(1, a.width);
  const animacion = vuela.animate([
    { transform: 'translate(0, 0) scale(1.2)' },
    { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 70}px) scale(1.1)`, offset: 0.35 },
    { transform: `translate(${dx}px, ${dy}px) scale(${final})` },
  ], { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.75, 0.4)' });
  animacion.onfinish = () => {
    vuela.remove();
    reanimar(document.querySelector('.hud-piezas'), 'bote');
  };
}

function masUno(mundo, x, y) {
  const el = document.createElement('span');
  el.className = 'mas-uno';
  el.textContent = '+1';
  el.setAttribute('aria-hidden', 'true');
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  el.addEventListener('animationend', () => el.remove());
  mundo.appendChild(el);
}

function crearJuego(sprites) {
  const entrada = crearEntrada();
  const camara = crearCamara();
  const escena = document.querySelector('.escena');
  const primerPlano = document.querySelector('.primer-plano');
  const fondo = crearFondo([escena, primerPlano], [escena, primerPlano, document.getElementById('contacto')]);
  const objetos = crearObjetos(mundo);
  const jugador = crearJugador(document.getElementById('muneco'), sprites, { x: 150, y: Y_SUELO });
  const bocadillo = crearBocadillo(document.getElementById('bocadillo'), document.getElementById('bocadillo-anuncio'));
  const particulas = movimientoReducido.matches ? null : crearParticulas(mundo);
  const hojas = movimientoReducido.matches
    ? null
    : crearHojas(document.querySelector('.hojas-fondo'), document.querySelector('.hojas-frente'),
      innerWidth < 760 ? { fondo: 10, frente: 3 } : { fondo: 18, frente: 5 });
  const estado = {
    escala: 1,
    visible: 1,
    colisionadores: [],
    porId: new Map(),
    control: { x: 150, y: Y_SUELO },
    camaraLibreHasta: 0,
    // Frases que solo se dicen la primera vez y zona pendiente de comentar mientras dura la intro
    dichas: new Set(),
    zonaPendiente: null,
    ultimoDibujo: performance.now(),
    camaraAnterior: 0,
    estela: 0,
    polvo: 0,
    // Temblor de pantalla: amplitud (px) y cuándo acaba
    temblor: { amplitud: 0, desde: 0, hasta: 0 },
    // Cronómetro de la partida: empieza con la primera tecla o toque
    inicioPartida: null,
    // Ayuda «→ / Espacio»: aparece tras 4 s sin moverse hasta que se ha usado andar y saltar
    sinMover: 0,
    usado: { andar: false, saltar: false },
  };
  const ayuda = document.getElementById('ayuda');
  const tactil = document.querySelector('.tactil');
  const hud = crearHud({ alViajar: viajar, alSonido: alternarSonido, sonidoInicial: sonidoActivo() });
  function temblar(amplitud, duracion = 0.25) {
    if (movimientoReducido.matches || amplitud < estado.temblor.amplitud) return;
    const ahora = performance.now();
    estado.temblor = { amplitud, desde: ahora, hasta: ahora + duracion * 1000 };
  }

  // Polvo, chispas, piezas y temblores según lo que haya pasado en este paso de física
  function efectos(eventos, e, dt) {
    const c = jugador.cuerpo;
    const pies = { x: c.x + c.w / 2, y: c.y + c.h };
    for (const ev of eventos) {
      const el = estado.porId.get(ev.id)?.el;
      if (ev.tipo === 'salta') {
        emitir(particulas, 'polvo', pies.x, pies.y, { cantidad: 2, velocidad: 90, abanico: 2.2, tam: 0.8 });
      } else if (ev.tipo === 'aterriza') {
        const fuerza = Math.min(1, ev.impacto / 1400);
        emitir(particulas, 'polvo', pies.x, pies.y, { cantidad: 3 + Math.round(fuerza * 6), velocidad: 110 + 160 * fuerza, abanico: 2.6, tam: 0.8 + fuerza * 0.5 });
        if (el?.classList.contains('forja')) {
          emitir(particulas, 'chispa', pies.x, pies.y, { cantidad: 12, velocidad: 650, abanico: 2.4 });
          temblar(3);
        } else if (ev.impacto > 1150) {
          temblar(2 + Math.min(2, (ev.impacto - 1150) / 150), 0.22);
        }
      } else if (ev.tipo === 'golpeaTecho' && el?.classList.contains('sorpresa')) {
        const b = estado.porId.get(ev.id);
        emitir(particulas, 'lego', b.x + b.w / 2, b.y, { cantidad: 6, velocidad: 700, abanico: 1.6 });
        temblar(2, 0.15);
      }
    }
    // Polvo al correr (más a menudo en la carrera ninja) y al derrapar
    const corre = c.enSuelo && Math.abs(c.vx) > 300;
    const derrapa = derrapando(jugador, e);
    estado.polvo = corre || derrapa ? estado.polvo + dt : 0;
    const cada = derrapa ? 0.04 : jugador.corriendo ? 0.05 : 0.11;
    if (estado.polvo >= cada) {
      estado.polvo = 0;
      const atras = -Math.sign(c.vx);
      emitir(particulas, 'polvo', pies.x + atras * 18, pies.y, {
        velocidad: derrapa ? 140 : 80, angulo: atras > 0 ? -0.5 : -Math.PI + 0.5, abanico: 0.8, tam: derrapa ? 0.9 : 0.6,
      });
    }
  }

  function decirUnaVez(clave, segundos) {
    if (estado.dichas.has(clave)) return;
    estado.dichas.add(clave);
    decir(bocadillo, clave, segundos);
  }

  const avisos = {
    piezas: (n, total, pieza) => {
      hud.piezas(n, total);
      if (pieza && !movimientoReducido.matches) {
        volarAlContador(pieza.el);
        masUno(mundo, pieza.x, pieza.y - 10);
      }
      const nuevos = ponerPremios(jugador, n);
      if (nuevos.length) {
        decir(bocadillo, `premio.${nuevos[nuevos.length - 1]}`, 5);
        sonar('premio');
        reanimar(jugador.el, 'premiado');
      }
    },
    zona: (zona) => {
      estado.control = { x: zona.x + 160, y: Y_SUELO };
      hud.zona(zona.id);
      if (introActiva()) estado.zonaPendiente = zona.id;
      else decir(bocadillo, `zona.${zona.id}`);
    },
    clones: () => {
      if (!movimientoReducido.matches) lanzarClones(mundo, jugador);
    },
    meta: (n, total) => {
      jugador.cuerpo.vx = 0;
      cambiarEstado(jugador, 'celebrando');
      const segundos = (performance.now() - (estado.inicioPartida ?? estado.creado)) / 1000;
      // El resumen sale cuando ya se ha visto la celebración
      setTimeout(() => {
        if (enModoCV()) return;
        resumen.mostrar({
          segundos, piezas: n, total, secretos: objetos.secretos.size, totalSecretos: SECRETOS.length,
        });
      }, 1600);
    },
    secreto: (id) => {
      if (!apuntarSecreto(objetos, id)) return;
      decir(bocadillo, `secreto.${id}`, 4);
    },
  };
  estado.creado = performance.now();
  const resumen = crearResumen({
    sprites,
    alAbrir: () => entrada.activar(false),
    alCerrar: () => { if (!enModoCV()) entrada.activar(true); },
    alContactar: () => {
      document.querySelector('#formulario-contacto input[name="name"]')?.focus({ preventScroll: true });
    },
    alJugarOtraVez: () => {
      reiniciarObjetos(objetos);
      quitarPremios(jugador);
      hud.piezas(0, objetos.piezas.length);
      estado.inicioPartida = null;
      viajar('inicio');
    },
  });

  // Tuberías: ↓ sobre la de una app (o su botón) baja a la sala; se vuelve por la tubería de salida
  const DURACION_TUBERIA = 0.55;
  const sala = crearSala({
    sprites,
    alSonar: () => sonar('tuberia'),
    alSalir: (app) => {
      const p = estado.porId.get(`salida-${app}`);
      if (!p) {
        jugador.el.classList.remove('en-tuberia');
        estado.tuberia = null;
        entrada.activar(true);
        return;
      }
      const c = jugador.cuerpo;
      c.x = p.x + p.w / 2 - c.w / 2;
      c.y = p.y;
      c.vx = 0;
      c.vy = 0;
      jugador.mirando = 1;
      cambiarEstado(jugador, 'parado');
      jugador.el.classList.remove('en-tuberia');
      centrarCamara(camara, centroJugador(), estado.visible, ANCHO_MUNDO);
      estado.tuberia = { fase: 'subiendo', t: 0, p };
      sonar('tuberia');
      entrada.activar(true);
    },
  });

  function entrarTuberia(p) {
    if (estado.tuberia || sala.abierta()) return;
    const c = jugador.cuerpo;
    c.x = p.x + p.w / 2 - c.w / 2;
    c.y = p.y - c.h;
    c.vx = 0;
    c.vy = 0;
    cambiarEstado(jugador, 'parado');
    callar(bocadillo);
    entrada.activar(false);
    estado.tuberia = { fase: 'bajando', t: 0, p };
    sonar('tuberia');
  }

  // Mientras entra o sale de una tubería no hay física: el muñeco se hunde o asoma detrás de ella
  function animarTuberia(dt) {
    const t = estado.tuberia;
    const c = jugador.cuerpo;
    t.t += dt;
    const k = Math.min(1, t.t / (movimientoReducido.matches ? 0.01 : DURACION_TUBERIA));
    if (t.fase === 'bajando') {
      c.y = t.p.y - c.h + k * (c.h + 10);
      if (k === 1) {
        t.fase = 'dentro';
        jugador.el.classList.add('en-tuberia');
        sala.abrir(t.p.el.dataset.sala);
      }
    } else if (t.fase === 'subiendo') {
      c.y = t.p.y - k * c.h;
      if (k === 1) {
        c.y = t.p.y - c.h - 0.5;
        c.vy = -250;
        estado.tuberia = null;
      }
    }
  }

  mundo.querySelectorAll('.tuberia-boton').forEach((boton) => {
    boton.addEventListener('click', (e) => {
      const p = estado.porId.get(`tuberia-${boton.dataset.sala}`);
      if (!p) return;
      if (e.detail > 0) boton.blur();
      reanimar(jugador.el, 'humo');
      entrarTuberia(p);
    });
  });

  // Código Konami: modo Kyūbi (aura naranja de fuego); repetirlo lo apaga
  const konami = crearKonami();
  addEventListener('keydown', (e) => {
    if (e.repeat || enModoCV() || resumen.abierto() || sala.abierta() || !konami(e.code)) return;
    const activo = jugador.el.classList.toggle('modo-kyubi');
    decir(bocadillo, activo ? 'secreto.konami' : 'secreto.konami.fuera', 3);
    sonar(activo ? 'premio' : 'golpe');
    if (activo) {
      reanimar(jugador.el, 'premiado');
      avisos.secreto('konami');
    }
  });
  const arrastre = activarArrastre({
    jugador,
    mundo,
    obtenerEscala: () => estado.escala,
    obtenerColisionadores: () => estado.colisionadores,
  });
  const raton = activarRaton({
    jugador,
    alReir: () => {
      if (!reir(jugador)) return false;
      decir(bocadillo, 'risa', 2.2);
      sonar('risa');
      return true;
    },
  });
  ponerPremios(jugador, objetos.recogidas.size);

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
    if (hojas) redimensionarHojas(hojas, estado.escala);
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
    if (estado.tuberia) {
      if (estado.tuberia.fase !== 'dentro') animarTuberia(dt);
      return;
    }
    const e = entrada.leer();
    const seMueve = e.izquierda || e.derecha || e.saltar;
    if (seMueve) estado.camaraLibreHasta = 0;
    actualizarAyuda(e, seMueve, dt);
    const eventos = actualizarJugador(jugador, e, estado.colisionadores, dt);
    arrastre.actualizar(dt);
    if (particulas) efectos(eventos, e, dt);
    for (const ev of eventos) {
      if (ev.tipo === 'espera') {
        decir(bocadillo, estado.dichas.has('espera') ? 'espera2' : 'espera');
        estado.dichas.add('espera');
      } else if (ev.tipo === 'saltaPared') {
        decirUnaVez('pared', 3);
      }
    }
    if (jugador.corriendo) decirUnaVez('ninja', 3);
    const sobre = jugador.cuerpo.enSuelo ? jugador.cuerpo.sobre?.el : null;
    if (sobre?.dataset.sala) {
      decirUnaVez('tuberia', 4);
      if (e.bajar) entrarTuberia(estado.porId.get(sobre.id));
    }
    if (jugador.cuerpo.y > ALTO_MUNDO + 300) reaparecer(jugador, estado.control, estado.colisionadores);
    actualizarObjetos(objetos, jugador, eventos, estado.porId, avisos);
    if (performance.now() > estado.camaraLibreHasta) {
      seguirCamara(camara, centroJugador(), jugador.mirando, estado.visible, ANCHO_MUNDO, dt);
    }
  }

  function actualizarAyuda(e, seMueve, dt) {
    if (seMueve && estado.inicioPartida === null) estado.inicioPartida = performance.now();
    if (e.izquierda || e.derecha) estado.usado.andar = true;
    if (e.saltar) estado.usado.saltar = true;
    const aprendido = estado.usado.andar && estado.usado.saltar;
    estado.sinMover = seMueve || jugador.estado === 'colgado' ? 0 : estado.sinMover + dt;
    const mostrar = !aprendido && estado.sinMover >= ESPERA_AYUDA && !introActiva() && !estado.tuberia
      && !resumen.abierto() && jugador.estado !== 'celebrando';
    if (mostrar === ayuda.hidden) {
      ayuda.hidden = !mostrar;
      tactil?.classList.toggle('ayudando', mostrar);
    }
  }

  function dibujar() {
    const ahora = performance.now();
    const dt = Math.min((ahora - estado.ultimoDibujo) / 1000, 0.1);
    estado.ultimoDibujo = ahora;
    const e = estado.escala;
    let tx = 0;
    let ty = 0;
    const t = estado.temblor;
    if (ahora < t.hasta) {
      const resto = (t.hasta - ahora) / (t.hasta - t.desde);
      tx = Math.sin(ahora * 0.09) * t.amplitud * resto;
      ty = Math.cos(ahora * 0.12) * t.amplitud * resto;
    } else {
      t.amplitud = 0;
    }
    mundo.style.transform = `translate3d(${(-camara.x * e + tx).toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${e})`;
    const pantallaX = (centroJugador() - camara.x) * e;
    raton.actualizar(pantallaX);
    dibujarJugador(jugador);
    actualizarParticulas(particulas, dt);
    // Carrera ninja o lanzado con el ratón: una imagen residual cada 50 ms
    const conEstela = jugador.corriendo || (jugador.lanzado && jugador.estado !== 'colgado');
    estado.estela = conEstela && !movimientoReducido.matches ? estado.estela + dt : 0;
    if (estado.estela >= 0.05) {
      estado.estela = 0;
      dejarEstela(jugador, mundo);
    }
    actualizarBocadillo(bocadillo, jugador.cuerpo, camara.x, estado.visible, ahora);
    if (!ayuda.hidden) {
      const c = jugador.cuerpo;
      ayuda.style.transform = `translate3d(${(c.x + c.w + 30).toFixed(0)}px, ${(c.y + 30).toFixed(0)}px, 0)`;
    }
    const recorrido = Math.max(1, ANCHO_MUNDO - estado.visible);
    actualizarFondo(fondo, camara.x * e, camara.x / recorrido, movimientoReducido.matches);
    if (hojas) {
      const c = jugador.cuerpo;
      moverHojas(hojas, dt, (camara.x - estado.camaraAnterior) * e, {
        x: pantallaX,
        y: innerHeight - (ALTO_MUNDO - c.y - c.h / 2) * e,
        corriendo: Math.abs(c.vx) > 330,
        dir: Math.sign(c.vx) || 1,
      });
      dibujarHojas(hojas);
    }
    estado.camaraAnterior = camara.x;
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

  estado.camaraAnterior = camara.x;
  let bucle = iniciarBucle({ actualizar, dibujar });
  return {
    jugador,
    estado,
    objetos,
    pausar() {
      bucle.detener();
      entrada.activar(false);
      callar(bocadillo);
    },
    reanudar() {
      medir();
      entrada.activar(true);
      estado.ultimoDibujo = performance.now();
      bucle = iniciarBucle({ actualizar, dibujar });
    },
    // Al quitar la intro: el saludo empieza de nuevo para que se vea y se comenta la zona actual
    alTerminarIntro() {
      if (jugador.estado === 'saludando') jugador.tiempo = 0;
      if (estado.zonaPendiente) decir(bocadillo, `zona.${estado.zonaPendiente}`);
      estado.zonaPendiente = null;
    },
  };
}

// Una sola carga a la vez: si se pulsa «CV rápido» o «Volver» mientras cargan los sprites no se crean dos juegos,
// y si al terminar la carga se está en modo CV el juego nace en pausa.
function iniciarJuego() {
  if (enModoCV()) desactivarCV();
  if (juego) {
    juego.reanudar();
    return Promise.resolve();
  }
  arrancando ??= cargarSprites()
    .then((sprites) => {
      juego = crearJuego(sprites);
      if (parametros.has('depurar')) window.__juego = juego;
      if (enModoCV()) juego.pausar();
    })
    .catch((error) => {
      console.error('No se pudo iniciar el juego; se muestra el CV rápido', error);
      activarCV();
    })
    .finally(() => { arrancando = null; });
  return arrancando;
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
  if (enModoCV()) {
    quitarIntro();
    return;
  }
  await cerrarIntro(iniciarJuego());
  juego?.alTerminarIntro();
}

arrancar();
