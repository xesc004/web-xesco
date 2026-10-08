// Sala de cada app: se entra por una tubería del nivel. Muestra la app funcionando (su vídeo si el artículo tiene
// data-demo; si no, sus capturas animadas dentro de un móvil), su enlace a la tienda y su stack.
// El muñeco cae por la tubería del techo, se puede mover con ← → y sale por la tubería del suelo con ↓.
import { aplicarHoja, posicionFotograma } from './jugador.js';

const VELOCIDAD = 320;
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
  // Si el vídeo no carga se pasa a las capturas animadas
  video.addEventListener('error', () => {
    video.remove();
    parar = montarCapturas(pantalla, capturas);
  }, { once: true });
  video.src = demo;
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

export function crearSala({ sprites, alSalir, alSonar }) {
  const dialogo = document.getElementById('sala');
  const escena = dialogo.querySelector('.sala-escena');
  const muneco = dialogo.querySelector('.sala-muneco');
  const sprite = muneco.querySelector('.muneco');
  const salida = dialogo.querySelector('.sala-tuberia-suelo');
  aplicarHoja(sprite, sprites);
  const teclas = new Set();
  const m = { x: 0, mirando: 1, tiempo: 0, fase: 'fuera', app: null };
  let parar = () => {};
  let id = 0;
  let anterior = 0;

  // Posiciones del borde izquierdo del muñeco (que en el móvil se dibuja más pequeño)
  function limites() {
    const mitad = muneco.getBoundingClientRect().width / 2 || 80;
    const tubo = salida.getBoundingClientRect();
    return { min: 30, max: escena.clientWidth - 2 * mitad - 10, salida: tubo.left + tubo.width / 2 - mitad };
  }

  function cercaDeLaSalida() {
    return Math.abs(m.x - limites().salida) < 70;
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
    const { min, max } = limites();
    let anda = false;
    if (m.fase === 'dentro') {
      const dir = (teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('ArrowLeft') ? 1 : 0);
      if (dir) {
        m.x = Math.max(min, Math.min(max, m.x + dir * VELOCIDAD * dt));
        m.mirando = dir;
        anda = true;
      }
    } else if (m.fase === 'hacia-salida') {
      // Camina solo hasta la tubería del suelo y se mete
      const objetivo = limites().salida;
      const paso = VELOCIDAD * 1.4 * dt;
      m.mirando = Math.sign(objetivo - m.x) || 1;
      anda = Math.abs(objetivo - m.x) > paso;
      m.x = anda ? m.x + m.mirando * paso : objetivo;
      if (!anda) meterse();
    }
    const nombre = m.fase === 'cayendo' ? 'caer' : anda ? 'andar' : 'parado';
    sprite.style.backgroundPosition = posicionFotograma(sprites, fotograma(nombre));
    muneco.style.transform = `translateX(${m.x.toFixed(1)}px)`;
    sprite.style.transform = `scaleX(${nombre === 'parado' ? 1 : m.mirando})`;
    salida.classList.toggle('cerca', cercaDeLaSalida());
    id = requestAnimationFrame(dibujar);
  }

  function meterse() {
    if (m.fase === 'saliendo') return;
    m.fase = 'saliendo';
    muneco.classList.remove('entrando');
    muneco.classList.add('saliendo');
    alSonar();
    setTimeout(cerrar, reducido.matches ? 0 : 520);
  }

  function salir() {
    if (m.fase !== 'dentro' && m.fase !== 'cayendo') return;
    if (cercaDeLaSalida()) meterse();
    else m.fase = 'hacia-salida';
  }

  function cerrar() {
    cancelAnimationFrame(id);
    parar();
    teclas.clear();
    const app = m.app;
    m.fase = 'fuera';
    dialogo.close();
    alSalir(app);
  }

  dialogo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      teclas.add(e.key);
      e.preventDefault();
    } else if (e.key === 'ArrowDown' && cercaDeLaSalida()) {
      e.preventDefault();
      meterse();
    }
  });
  dialogo.addEventListener('keyup', (e) => teclas.delete(e.key));
  // Esc: en vez de cerrar de golpe, el muñeco va a la tubería y sale
  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    salir();
  });
  dialogo.querySelector('.sala-salir').addEventListener('click', salir);
  salida.addEventListener('click', salir);

  return {
    abierta: () => dialogo.open,
    abrir(app) {
      const articulo = document.getElementById(`app-${app}`);
      if (!articulo) return;
      m.app = app;
      rellenarInfo(dialogo, articulo);
      parar = montarDemo(dialogo.querySelector('.sala-pantalla'), articulo.dataset.demo, [...articulo.querySelectorAll('.capturas img')]);
      dialogo.showModal();
      dialogo.querySelector('.sala-salir').focus({ preventScroll: true });
      m.x = limites().min + 20;
      m.mirando = 1;
      m.tiempo = 0;
      m.fase = 'cayendo';
      muneco.classList.remove('saliendo');
      muneco.classList.remove('entrando');
      void muneco.offsetWidth;
      muneco.classList.add('entrando');
      setTimeout(() => { if (m.fase === 'cayendo') m.fase = 'dentro'; }, reducido.matches ? 0 : 650);
      anterior = performance.now();
      id = requestAnimationFrame(dibujar);
    },
  };
}
