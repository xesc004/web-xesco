// Bocadillo del muñeco: frases cortas en primera persona al llegar a cada zona, al ganar premios o al esperar.
// Los textos viven en el HTML (#frases, traducidos con data-i18n) para que el cambio de idioma les llegue solo.
const ALTO_CABEZA = 26;

export function frase(clave) {
  return document.querySelector(`#frases [data-frase="${clave}"]`)?.textContent.trim() ?? '';
}

// el: el globo visible (aria-hidden); anuncio: región viva oculta para lectores de pantalla
export function crearBocadillo(el, anuncio) {
  return {
    el,
    anuncio,
    globo: el.querySelector('.bocadillo-globo'),
    hasta: 0,
    ancho: 0,
    clave: '',
    x: null,
  };
}

export function decir(b, clave, segundos = 4.5) {
  const texto = frase(clave);
  if (!texto) return;
  b.clave = clave;
  b.globo.textContent = texto;
  if (b.anuncio) b.anuncio.textContent = texto;
  b.el.hidden = false;
  b.globo.classList.remove('aparece');
  void b.globo.offsetWidth;
  b.globo.classList.add('aparece');
  b.ancho = b.globo.offsetWidth;
  b.hasta = performance.now() + Math.max(segundos, texto.length * 0.06) * 1000;
}

export function callar(b) {
  b.el.hidden = true;
  b.hasta = 0;
  b.x = null;
}

// Sigue la cabeza del muñeco sin salirse de la parte visible del mundo
export function actualizarBocadillo(b, cuerpo, camaraX, anchoVisible, ahora = performance.now()) {
  if (b.el.hidden) return;
  if (ahora > b.hasta) {
    callar(b);
    return;
  }
  const mitad = b.ancho / 2 + 16;
  const objetivo = Math.max(camaraX + mitad, Math.min(camaraX + anchoVisible - mitad, cuerpo.x + cuerpo.w / 2));
  // Suavizado para que no tiemble con cada paso
  b.x = b.x === null ? objetivo : b.x + (objetivo - b.x) * 0.25;
  const y = cuerpo.y - ALTO_CABEZA;
  b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  b.el.style.setProperty('--cola', `${Math.max(-b.ancho / 2 + 24, Math.min(b.ancho / 2 - 24, cuerpo.x + cuerpo.w / 2 - b.x)).toFixed(0)}px`);
}
