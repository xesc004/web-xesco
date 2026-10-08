// Lee del HTML las cajas marcadas con data-plataforma y las convierte en colisionadores (unidades de diseño).
import { ANCHO_MUNDO, Y_SUELO } from './escala.js';

const TIPOS = new Set(['unSentido', 'solido', 'elastico', 'sorpresa']);

// Posición de un elemento dentro de #mundo; offsetLeft/offsetTop no se ven afectados por la escala del mundo
export function posicionEnMundo(el, mundo) {
  let x = 0;
  let y = 0;
  for (let n = el; n && n !== mundo; n = n.offsetParent) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return { x, y };
}

export function medirElementos(mundo, selector) {
  return [...mundo.querySelectorAll(selector)]
    .filter((el) => el.offsetParent !== null)
    .map((el) => ({ el, ...posicionEnMundo(el, mundo), w: el.offsetWidth, h: el.offsetHeight }));
}

export function medirPlataformas(mundo) {
  const lista = [];
  mundo.querySelectorAll('[data-plataforma]').forEach((el, i) => {
    const tipo = el.dataset.plataforma;
    if (!TIPOS.has(tipo) || el.offsetParent === null) return;
    const { x, y } = posicionEnMundo(el, mundo);
    lista.push({ id: el.id || `plataforma-${i}`, x, y, w: el.offsetWidth, h: el.offsetHeight, tipo, el });
  });
  lista.push({ id: 'suelo', x: -400, y: Y_SUELO, w: ANCHO_MUNDO + 800, h: 400, tipo: 'solido' });
  lista.push({ id: 'pared-izquierda', x: -200, y: -3000, w: 200, h: 6000, tipo: 'solido' });
  lista.push({ id: 'pared-derecha', x: ANCHO_MUNDO, y: -3000, w: 200, h: 6000, tipo: 'solido' });
  return lista;
}
