// Coger al muñeco con el ratón o el dedo: cuelga de la cabeza, se balancea y al soltarlo sale lanzado.
import { desatascar } from '../motor/fisica.js';
import { ANCHO_MUNDO, Y_SUELO } from '../mundo/escala.js';
import { cambiarEstado } from './jugador.js';

const LIMITE_VX = 900;
const LIMITE_VY = 1200;

export function activarArrastre({ jugador, mundo, obtenerEscala, obtenerColisionadores, sePuedeCoger = () => true }) {
  const el = jugador.el;
  let puntero = null;
  let muestras = [];
  let velocidadAngular = 0;

  function aMundo(e) {
    const r = mundo.getBoundingClientRect();
    const escala = obtenerEscala();
    return { x: (e.clientX - r.left) / escala, y: (e.clientY - r.top) / escala, t: performance.now() };
  }

  function colocar(m) {
    const c = jugador.cuerpo;
    c.x = Math.max(0, Math.min(ANCHO_MUNDO - c.w, m.x - c.w / 2));
    c.y = Math.max(-200, Math.min(Y_SUELO - c.h, m.y - 18));
    c.vx = 0;
    c.vy = 0;
  }

  el.addEventListener('pointerdown', (e) => {
    if (puntero !== null || jugador.estado === 'celebrando' || !sePuedeCoger()) return;
    e.preventDefault();
    puntero = e.pointerId;
    try { el.setPointerCapture(puntero); } catch { /* sin captura, el arrastre sigue con los eventos del elemento */ }
    muestras = [aMundo(e)];
    cambiarEstado(jugador, 'colgado');
    colocar(muestras[0]);
    el.classList.add('agarrado');
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== puntero) return;
    const m = aMundo(e);
    muestras.push(m);
    if (muestras.length > 6) muestras.shift();
    colocar(m);
  });

  function soltar(e) {
    if (e.pointerId !== puntero) return;
    puntero = null;
    el.classList.remove('agarrado');
    const a = muestras[0];
    const b = muestras[muestras.length - 1];
    const dt = Math.max((b.t - a.t) / 1000, 1 / 60);
    const c = jugador.cuerpo;
    c.vx = Math.max(-LIMITE_VX, Math.min(LIMITE_VX, (b.x - a.x) / dt));
    c.vy = Math.max(-LIMITE_VY, Math.min(LIMITE_VY * 0.75, (b.y - a.y) / dt));
    c.enSuelo = false;
    c.sobre = null;
    c.saltando = false;
    c.tiempoAire = 1;
    // Lanzado con fuerza: deja estela hasta que aterriza
    jugador.lanzado = Math.hypot(c.vx, c.vy) > 450;
    jugador.agitacion = 0;
    desatascar(c, obtenerColisionadores());
    jugador.angulo = 0;
    velocidadAngular = 0;
    cambiarEstado(jugador, 'cayendo');
  }
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);

  return {
    // Balanceo tipo péndulo mientras cuelga: se inclina en contra del movimiento del puntero
    actualizar(dt) {
      if (jugador.estado !== 'colgado') {
        jugador.angulo = 0;
        velocidadAngular = 0;
        return;
      }
      const ahora = performance.now();
      const b = muestras[muestras.length - 1];
      const a = muestras[Math.max(0, muestras.length - 3)];
      const vx = b && a && ahora - b.t < 100 && b.t > a.t ? (b.x - a.x) / ((b.t - a.t) / 1000) : 0;
      const objetivo = Math.max(-35, Math.min(35, vx * 0.04));
      // Cuanto más se zarandea, más patalea (se suaviza para que no dé tirones)
      jugador.agitacion += (Math.min(1, Math.abs(vx) / 900) - jugador.agitacion) * Math.min(1, dt * 8);
      velocidadAngular += (objetivo - jugador.angulo) * 120 * dt;
      velocidadAngular *= Math.max(0, 1 - 6 * dt);
      jugador.angulo += velocidadAngular * dt;
    },
  };
}
