// Bucle de juego con paso fijo: la física avanza siempre en pasos de 1/120 s y se pausa con la pestaña oculta.
export function iniciarBucle({ actualizar, dibujar, paso = 1 / 120, maxPasos = 8 }) {
  let acumulado = 0;
  let anterior = performance.now();
  let id = 0;

  function fotograma(ahora) {
    acumulado += Math.min((ahora - anterior) / 1000, 0.25);
    anterior = ahora;
    let pasos = 0;
    while (acumulado >= paso && pasos < maxPasos) {
      actualizar(paso);
      acumulado -= paso;
      pasos++;
    }
    if (pasos === maxPasos) acumulado = 0;
    dibujar();
    id = requestAnimationFrame(fotograma);
  }

  function alCambiarVisibilidad() {
    cancelAnimationFrame(id);
    if (!document.hidden) {
      anterior = performance.now();
      acumulado = 0;
      id = requestAnimationFrame(fotograma);
    }
  }

  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  id = requestAnimationFrame(fotograma);

  return {
    detener() {
      cancelAnimationFrame(id);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    },
  };
}
