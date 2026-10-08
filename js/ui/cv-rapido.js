// Modo «CV rápido»: el mismo HTML recolocado en vertical.
const raiz = document.documentElement;

export function enModoCV() {
  return raiz.classList.contains('cv');
}

export function activarCV() {
  raiz.classList.remove('juego');
  raiz.classList.add('cv');
  history.replaceState(null, '', `${location.pathname}?cv`);
  window.scrollTo(0, 0);
}

export function desactivarCV() {
  raiz.classList.remove('cv');
  raiz.classList.add('juego');
  history.replaceState(null, '', location.pathname);
}
