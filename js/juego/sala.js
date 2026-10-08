// Sala de cada app: se entra por una tubería del nivel. Muestra la app funcionando (su vídeo si el artículo tiene
// data-demo; si no, sus capturas animadas dentro de un móvil), su enlace a la tienda y su stack.
// El muñeco cae por la tubería del techo y, con la misma física que el nivel, tiene que saltar encima de la del
// suelo y meterse con ↓.
import { aplicarHoja, posicionFotograma } from './jugador.js';
import { crearCuerpo, paso } from '../motor/fisica.js';

const CAMBIO_PANTALLA = 2600;
const reducido = matchMedia('(prefers-reduced-motion: reduce)');

function vaciar(el) {
  while (el.firstChild) el.firstChild.remove();
}

// Capturas que se van sucediendo con un toque simulado antes de cada cambio, como si alguien usara la app
function montarCapturas(pantalla, capturas) {
  const imagenes = capturas.map((c, i) => {
    const img = document.createElement('img');
    img.src = c.currentSrc || c.src;
    img.alt = c.alt;
    img.className = i === 0 ? 'actual' : '';
    pantalla.appendChild(img);
    return img;
  });
  const toque = document.createElement('span');
  toque.className = 'sala-toque';
  toque.setAttribute('aria-hidden', 'true');
  pantalla.appendChild(toque);
  if (reducido.matches || imagenes.length < 2) return () => {};
  let i = 0;
  const avanzar = () => {
    toque.style.left = `${25 + Math.random() * 50}%`;
    toque.style.top = `${45 + Math.random() * 40}%`;
    toque.classList.remove('toca');
    void toque.offsetWidth;
    toque.classList.add('toca');
    setTimeout(() => {
      imagenes[i].classList.remove('actual');
      i = (i + 1) % imagenes.length;
      imagenes[i].classList.add('actual');
    }, 350);
  };
  const reloj = setInterval(avanzar, CAMBIO_PANTALLA);
  return () => clearInterval(reloj);
}

// demo: ruta del vídeo (data-demo del artículo, lo pone herramientas/preparar_demo.py); sin él, capturas animadas
function montarDemo(pantalla, demo, capturas) {
  vaciar(pantalla);
  if (!demo) return montarCapturas(pantalla, capturas);
  let parar = () => {};
  const video = document.createElement('video');
  Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'auto', autoplay: !reducido.matches });
  video.setAttribute('aria-label', capturas[0]?.alt ?? '');
  if (capturas[0]) video.poster = capturas[0].currentSrc || capturas[0].src;
  // MP4 (H.264) y, al lado, WebM (VP9) para navegadores sin H.264. Si ninguno carga (el error llega en la
  // última <source>), se pasa a las capturas animadas
  for (const [src, type] of [[demo, 'video/mp4'], [demo.replace(/\.mp4$/, '.webm'), 'video/webm']]) {
    const fuente = document.createElement('source');
    Object.assign(fuente, { src, type });
    video.appendChild(fuente);
  }
  video.lastElementChild.addEventListener('error', () => {
    video.remove();
    parar = montarCapturas(pantalla, capturas);
  }, { once: true });
  if (reducido.matches) video.controls = true;
  pantalla.appendChild(video);
  return () => {
    parar();
    video.pause();
  };
}

function rellenarInfo(dialogo, articulo) {
  const icono = articulo.querySelector('.ficha-icono');
  dialogo.querySelector('.sala-icono').src = icono?.currentSrc || icono?.src || '';
  dialogo.querySelector('#sala-titulo').textContent = articulo.querySelector('.ficha h3')?.textContent ?? '';
  dialogo.querySelector('.sala-frase').textContent = articulo.querySelector('.ficha-frase')?.textContent ?? '';
  const puntos = dialogo.querySelector('.sala-puntos');
  vaciar(puntos);
  articulo.querySelectorAll('.ficha-puntos li').forEach((li) => {
    const nuevo = document.createElement('li');
    nuevo.textContent = li.textContent;
    puntos.appendChild(nuevo);
  });
  const stack = dialogo.querySelector('.sala-stack');
  vaciar(stack);
  (articulo.querySelector('.ficha-tec')?.textContent ?? '').split('·').map((t) => t.trim()).filter(Boolean).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    stack.appendChild(li);
  });
  const tienda = dialogo.querySelector('.sala-tienda');
  vaciar(tienda);
  const boton = articulo.querySelector('.boton-tienda');
  if (boton) tienda.appendChild(boton.cloneNode(true));
}

// Física real dentro de la sala, en las mismas unidades que el nivel (px de pantalla / escala de la sala):
// el muñeco cae por la tubería del techo, salta encima de la del suelo y se mete con ↓.
const PASO = 1 / 120;
const SIN_ENTRADA = { izquierda: false, derecha: false, saltar: false, saltoPulsado: false, bajar: false };
const TECLAS = {
  ArrowLeft: 'izquierda', KeyA: 'izquierda', ArrowRight: 'derecha', KeyD: 'derecha',
  Space: 'saltar', ArrowUp: 'saltar', KeyW: 'saltar', ArrowDown: 'bajar', KeyS: 'bajar',
};

export function crearSala({ sprites, alSalir, alSonar }) {
  const dialogo = document.getElementById('sala');
  const escena = dialogo.querySelector('.sala-escena');
  const muneco = dialogo.querySelector('.sala-muneco');
  const sprite = muneco.querySelector('.muneco');
  const techo = dialogo.querySelector('.sala-tuberia-techo');
  const salida = dialogo.querySelector('.sala-tuberia-suelo');
  aplicarHoja(sprite, sprites);
  const pulsadas = new Set();
  let flancoSaltar = false;
  let flancoBajar = false;
  const m = { c: null, escala: 1, mirando: 1, tiempo: 0, anim: 'caer', fase: 'fuera', app: null, hundido: 0, mundo: [] };
  let parar = () => {};
  let id = 0;
  let anterior = 0;
  let acumulado = 0;

  // Colisionadores de la sala medidos del DOM: suelo, paredes y la tubería de salida (sólida)
  function medir() {
    const s = Number(getComputedStyle(dialogo).getPropertyValue('--sala-escala')) || 1;
    const suelo = parseFloat(getComputedStyle(escena, '::after').height) || 60;
    const tubo = salida.getBoundingClientRect();
    const ancho = innerWidth / s;
    const alto = (innerHeight - suelo) / s;
    m.escala = s;
    m.mundo = [
      { id: 'suelo', x: -200, y: alto, w: ancho + 400, h: 400, tipo: 'solido' },
      { id: 'pared-izquierda', x: -200, y: -3000, w: 200, h: 6000, tipo: 'solido' },
      { id: 'pared-derecha', x: ancho, y: -3000, w: 200, h: 6000, tipo: 'solido' },
      { id: 'tubo', x: tubo.left / s, y: tubo.top / s, w: tubo.width / s, h: tubo.height / s, tipo: 'solido' },
    ];
  }

  function tubo() {
    return m.mundo[3];
  }

  function encimaDelTubo() {
    return m.c.enSuelo && m.c.sobre?.id === 'tubo';
  }

  // Piloto automático (botón «Salir», Esc o clic en la tubería): anda hacia ella, salta encima y se mete
  function entradaAutomatica() {
    const c = m.c;
    const t = tubo();
    const dx = t.x + t.w / 2 - (c.x + c.w / 2);
    if (encimaDelTubo()) return { ...SIN_ENTRADA, bajar: true };
    const cerca = Math.abs(dx) < t.w / 2 + 170;
    return {
      ...SIN_ENTRADA,
      derecha: dx > 6,
      izquierda: dx < -6,
      saltar: c.enSuelo && cerca,
      saltoPulsado: true,
    };
  }

  function leerEntrada() {
    if (m.fase === 'auto') return entradaAutomatica();
    const e = {
      izquierda: pulsadas.has('izquierda'),
      derecha: pulsadas.has('derecha'),
      saltar: flancoSaltar,
      saltoPulsado: pulsadas.has('saltar'),
      bajar: flancoBajar,
    };
    flancoSaltar = false;
    flancoBajar = false;
    return e;
  }

  function pasoFisico() {
    const c = m.c;
    if (m.fase === 'saliendo') {
      // Se hunde por la tubería (detrás de ella)
      m.hundido += PASO;
      c.y += 320 * PASO;
      if (m.hundido >= 0.5) cerrar();
      return;
    }
    const e = m.fase === 'cayendo' ? SIN_ENTRADA : leerEntrada();
    const eventos = paso(c, e, m.mundo, PASO);
    if (m.fase === 'cayendo' && eventos.some((ev) => ev.tipo === 'aterriza')) m.fase = 'dentro';
    if (e.derecha !== e.izquierda) m.mirando = e.derecha ? 1 : -1;
    if (e.bajar && encimaDelTubo()) meterse();
  }

  function fotograma(nombre) {
    const a = sprites.animaciones[nombre];
    const f = Math.floor(m.tiempo * a.fps);
    return a.inicio + (a.bucle ? f % a.n : Math.min(a.n - 1, f));
  }

  function dibujar(ahora) {
    const dt = Math.min((ahora - anterior) / 1000, 0.1);
    anterior = ahora;
    m.tiempo += dt;
    acumulado += dt;
    while (acumulado >= PASO && m.fase !== 'fuera') {
      pasoFisico();
      acumulado -= PASO;
    }
    if (m.fase === 'fuera') return;
    const c = m.c;
    let nombre = 'parado';
    if (m.fase === 'saliendo') nombre = 'parado';
    else if (!c.enSuelo) nombre = c.vy < 0 ? 'saltar' : 'caer';
    else if (Math.abs(c.vx) > 25) nombre = 'andar';
    if (nombre !== m.anim) {
      m.anim = nombre;
      m.tiempo = 0;
    }
    const s = m.escala;
    const x = (c.x + c.w / 2 - 80) * s;
    const y = (c.y + c.h - 160 + sprites.pie) * s;
    sprite.style.backgroundPosition = posicionFotograma(sprites, fotograma(nombre));
    muneco.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s})`;
    sprite.style.transform = `scaleX(${nombre === 'parado' ? 1 : m.mirando})`;
    const t = tubo();
    salida.classList.toggle('cerca', encimaDelTubo() || Math.abs(c.x + c.w / 2 - (t.x + t.w / 2)) < t.w / 2 + 120);
    id = requestAnimationFrame(dibujar);
  }

  function meterse() {
    if (m.fase === 'saliendo') return;
    const c = m.c;
    const t = tubo();
    c.x = t.x + t.w / 2 - c.w / 2;
    c.vx = 0;
    m.fase = 'saliendo';
    m.hundido = 0;
    alSonar();
  }

  function salir() {
    if (m.fase === 'dentro' || m.fase === 'cayendo') m.fase = 'auto';
  }

  function cerrar() {
    cancelAnimationFrame(id);
    parar();
    pulsadas.clear();
    const app = m.app;
    m.fase = 'fuera';
    dialogo.close();
    alSalir(app);
  }

  function esControl(el) {
    return el instanceof HTMLElement && el.matches('button, a, [role="button"]');
  }

  dialogo.addEventListener('keydown', (e) => {
    const accion = TECLAS[e.code];
    if (!accion || e.ctrlKey || e.metaKey || e.altKey) return;
    // Espacio o Intro sobre un botón o enlace lo activan, como siempre
    if (e.code === 'Space' && esControl(e.target)) return;
    e.preventDefault();
    if (!pulsadas.has(accion)) {
      if (accion === 'saltar') flancoSaltar = true;
      if (accion === 'bajar') flancoBajar = true;
    }
    pulsadas.add(accion);
    if (m.fase === 'auto') m.fase = 'dentro';
  });
  dialogo.addEventListener('keyup', (e) => {
    const accion = TECLAS[e.code];
    if (accion) pulsadas.delete(accion);
  });
  // Controles táctiles de la sala (los mismos que en el nivel)
  dialogo.querySelectorAll('.sala-tactil [data-control]').forEach((boton) => {
    const accion = boton.dataset.control;
    const soltar = () => {
      pulsadas.delete(accion);
      boton.classList.remove('activo');
    };
    boton.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!pulsadas.has(accion)) {
        if (accion === 'saltar') flancoSaltar = true;
        if (accion === 'bajar') flancoBajar = true;
      }
      pulsadas.add(accion);
      boton.classList.add('activo');
      if (m.fase === 'auto') m.fase = 'dentro';
      try { boton.setPointerCapture(e.pointerId); } catch { /* sin captura funciona igual */ }
    });
    boton.addEventListener('pointerup', soltar);
    boton.addEventListener('pointercancel', soltar);
    boton.addEventListener('lostpointercapture', soltar);
  });
  // Esc: en vez de cerrar de golpe, el muñeco va a la tubería, salta encima y sale
  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    salir();
  });
  dialogo.querySelector('.sala-salir').addEventListener('click', salir);
  salida.addEventListener('click', salir);
  addEventListener('resize', () => { if (dialogo.open) medir(); });

  return {
    abierta: () => dialogo.open,
    abrir(app) {
      const articulo = document.getElementById(`app-${app}`);
      if (!articulo) return;
      m.app = app;
      rellenarInfo(dialogo, articulo);
      parar = montarDemo(dialogo.querySelector('.sala-pantalla'), articulo.dataset.demo, [...articulo.querySelectorAll('.capturas img')]);
      dialogo.showModal();
      // El foco va a la escena (no al botón) para que Espacio salte; Tab llega a los botones
      escena.focus({ preventScroll: true });
      medir();
      // Aparece dentro de la tubería del techo y cae
      const r = techo.getBoundingClientRect();
      m.c = crearCuerpo({ x: (r.left + r.width / 2) / m.escala - 30, y: r.top / m.escala - 140, w: 60, h: 140 });
      m.mirando = 1;
      m.tiempo = 0;
      m.anim = 'caer';
      m.fase = 'cayendo';
      pulsadas.clear();
      acumulado = 0;
      anterior = performance.now();
      id = requestAnimationFrame(dibujar);
    },
  };
}
