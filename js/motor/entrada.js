// Entrada del jugador: teclado, controles táctiles y rueda → estado { izquierda, derecha, saltar, saltoPulsado, bajar }.
const MAPA = {
  ArrowLeft: 'izquierda', KeyA: 'izquierda',
  ArrowRight: 'derecha', KeyD: 'derecha',
  Space: 'saltar', ArrowUp: 'saltar', KeyW: 'saltar',
  ArrowDown: 'bajar', KeyS: 'bajar',
};

function esCampoDeTexto(el) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

function esActivable(el) {
  return el instanceof HTMLElement && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button');
}

export function crearEntrada(objetivo = window) {
  const pulsadas = new Set();
  let flancoSaltar = false;
  let flancoBajar = false;
  let autoDir = 0;
  let autoHasta = 0;
  let activa = true;

  function pulsar(accion) {
    if (!pulsadas.has(accion)) {
      if (accion === 'saltar') flancoSaltar = true;
      if (accion === 'bajar') flancoBajar = true;
    }
    pulsadas.add(accion);
  }

  function soltar(accion) {
    pulsadas.delete(accion);
  }

  objetivo.addEventListener('keydown', (e) => {
    const accion = MAPA[e.code];
    if (!activa || !accion || e.ctrlKey || e.metaKey || e.altKey || esCampoDeTexto(e.target)) return;
    // Espacio sobre un botón o enlace enfocado lo activa en vez de saltar
    if (e.code === 'Space' && esActivable(e.target)) return;
    e.preventDefault();
    pulsar(accion);
  });
  objetivo.addEventListener('keyup', (e) => {
    const accion = MAPA[e.code];
    if (accion) soltar(accion);
  });
  objetivo.addEventListener('blur', () => pulsadas.clear());

  return {
    pulsar,
    soltar,
    correrAuto(dir, ms) {
      autoDir = Math.sign(dir);
      autoHasta = performance.now() + ms;
    },
    activar(valor) {
      activa = valor;
      if (!valor) pulsadas.clear();
    },
    leer(ahora = performance.now()) {
      const auto = ahora < autoHasta ? autoDir : 0;
      const estado = {
        izquierda: pulsadas.has('izquierda') || auto < 0,
        derecha: pulsadas.has('derecha') || auto > 0,
        saltar: flancoSaltar,
        saltoPulsado: pulsadas.has('saltar'),
        bajar: flancoBajar,
      };
      flancoSaltar = false;
      flancoBajar = false;
      return estado;
    },
  };
}
