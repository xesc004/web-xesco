// Fondo: color del cielo y oscuridad de la noche según el progreso (puro) y desplazamiento parallax de las capas SVG.
// El nivel empieza por la mañana, pasa por el mediodía y el atardecer y termina de noche en el contacto.
const CIELO = [
  { p: 0, arriba: [169, 220, 245], abajo: [232, 246, 253] },
  { p: 0.4, arriba: [110, 193, 240], abajo: [214, 238, 251] },
  { p: 0.7, arriba: [247, 163, 92], abajo: [255, 221, 170] },
  { p: 0.85, arriba: [118, 88, 150], abajo: [242, 152, 112] },
  { p: 1, arriba: [26, 34, 76], abajo: [74, 66, 124] },
];
const NOCHE_DESDE = 0.68;
const NOCHE_HASTA = 0.95;

function mezclar(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function recortar(progreso) {
  return Math.max(0, Math.min(1, progreso));
}

export function colorCielo(progreso) {
  const p = recortar(progreso);
  let i = 0;
  while (i < CIELO.length - 2 && p > CIELO[i + 1].p) i++;
  const a = CIELO[i];
  const b = CIELO[i + 1];
  const t = (p - a.p) / (b.p - a.p);
  return {
    arriba: `rgb(${mezclar(a.arriba, b.arriba, t).join(',')})`,
    abajo: `rgb(${mezclar(a.abajo, b.abajo, t).join(',')})`,
  };
}

// 0 de día, 1 en plena noche (curva suave entre el atardecer y el final del nivel)
export function oscuridad(progreso) {
  const t = recortar((recortar(progreso) - NOCHE_DESDE) / (NOCHE_HASTA - NOCHE_DESDE));
  return Math.round(t * t * (3 - 2 * t) * 1000) / 1000;
}

// raices: elementos que contienen capas [data-parallax]; nocturnos: elementos que reciben --noche
export function crearFondo(raices, nocturnos = []) {
  return {
    capas: raices.flatMap((raiz) => [...raiz.querySelectorAll('[data-parallax]')]).map((el) => ({
      el,
      factor: Number(el.dataset.parallax),
      proporcion: Number(el.dataset.proporcion),
      tesela: 1,
    })),
    cielo: raices[0].querySelector('.cielo'),
    nocturnos,
    ultimoProgreso: -1,
    ultimaNoche: -1,
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
    const noche = oscuridad(progreso);
    if (Math.abs(noche - fondo.ultimaNoche) >= 0.01 || (noche !== fondo.ultimaNoche && (noche === 0 || noche === 1))) {
      fondo.ultimaNoche = noche;
      for (const el of fondo.nocturnos) el.style.setProperty('--noche', String(noche));
    }
  }
}
