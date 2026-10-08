// Fondo: color del cielo según el progreso (puro) y desplazamiento parallax de las capas SVG.
const CIELO = [
  { p: 0, arriba: [169, 220, 245], abajo: [232, 246, 253] },
  { p: 0.5, arriba: [110, 193, 240], abajo: [214, 238, 251] },
  { p: 1, arriba: [247, 163, 92], abajo: [255, 221, 170] },
];

function mezclar(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export function colorCielo(progreso) {
  const p = Math.max(0, Math.min(1, progreso));
  const i = p < 0.5 ? 0 : 1;
  const a = CIELO[i];
  const b = CIELO[i + 1];
  const t = (p - a.p) / (b.p - a.p);
  return {
    arriba: `rgb(${mezclar(a.arriba, b.arriba, t).join(',')})`,
    abajo: `rgb(${mezclar(a.abajo, b.abajo, t).join(',')})`,
  };
}

export function crearFondo(escena) {
  return {
    capas: [...escena.querySelectorAll('[data-parallax]')].map((el) => ({
      el,
      factor: Number(el.dataset.parallax),
      proporcion: Number(el.dataset.proporcion),
      tesela: 1,
    })),
    cielo: escena.querySelector('.cielo'),
    ultimoProgreso: -1,
  };
}

export function medirFondo(fondo) {
  for (const capa of fondo.capas) capa.tesela = Math.max(1, capa.el.offsetHeight * capa.proporcion);
}

export function actualizarFondo(fondo, desplazamientoPx, progreso, reducido) {
  for (const capa of fondo.capas) {
    const d = reducido ? 0 : (desplazamientoPx * capa.factor) % capa.tesela;
    capa.el.style.transform = `translate3d(${(-d).toFixed(1)}px, 0, 0)`;
  }
  if (Math.abs(progreso - fondo.ultimoProgreso) > 0.002) {
    const { arriba, abajo } = colorCielo(progreso);
    fondo.cielo.style.setProperty('--cielo-arriba', arriba);
    fondo.cielo.style.setProperty('--cielo-abajo', abajo);
    fondo.ultimoProgreso = progreso;
  }
}
