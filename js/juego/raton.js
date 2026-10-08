// Reacciones al ratón: el muñeco gira la cabeza hacia el cursor cuando está quieto y se ríe si se le pasa por encima.
// Solo con un ratón de verdad (en táctil no hay cursor que seguir).
const DISTANCIA_MIRAR = 140;
const PAUSA_RISA = 4000;

export function activarRaton({ jugador, alReir }) {
  let cursorX = null;
  let ultimaRisa = -Infinity;

  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') cursorX = e.clientX;
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { cursorX = null; });

  jugador.el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const ahora = performance.now();
    if (ahora - ultimaRisa < PAUSA_RISA) return;
    if (alReir()) ultimaRisa = ahora;
  });

  return {
    // pantallaX: centro del muñeco en píxeles de pantalla
    actualizar(pantallaX) {
      if (cursorX === null) {
        jugador.mirarA = 0;
        return;
      }
      const dx = cursorX - pantallaX;
      jugador.mirarA = Math.abs(dx) > DISTANCIA_MIRAR ? Math.sign(dx) : 0;
    },
  };
}
