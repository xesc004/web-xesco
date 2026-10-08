// Efectos de sonido sintetizados con Web Audio (sin archivos). Apagados por defecto; la preferencia se recuerda.
const CLAVE = 'xesco.sonido';
let contexto = null;
let activo = false;
try { activo = localStorage.getItem(CLAVE) === '1'; } catch { /* sin almacenamiento */ }

function asegurarContexto() {
  if (!contexto) {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return null;
    contexto = new Contexto();
  }
  if (contexto.state === 'suspended') contexto.resume();
  return contexto;
}

function tono({ tipo = 'square', de, a = de, duracion = 0.12, volumen = 0.08, retraso = 0 }) {
  const c = asegurarContexto();
  if (!c) return;
  const t0 = c.currentTime + retraso;
  const oscilador = c.createOscillator();
  const ganancia = c.createGain();
  oscilador.type = tipo;
  oscilador.frequency.setValueAtTime(de, t0);
  oscilador.frequency.exponentialRampToValueAtTime(a, t0 + duracion);
  ganancia.gain.setValueAtTime(volumen, t0);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
  oscilador.connect(ganancia).connect(c.destination);
  oscilador.start(t0);
  oscilador.stop(t0 + duracion + 0.02);
}

const EFECTOS = {
  salto: () => tono({ de: 320, a: 640, duracion: 0.14 }),
  pieza: () => {
    tono({ tipo: 'sine', de: 988, duracion: 0.08, volumen: 0.1 });
    tono({ tipo: 'sine', de: 1319, duracion: 0.16, volumen: 0.1, retraso: 0.07 });
  },
  golpe: () => tono({ de: 180, a: 120, duracion: 0.1, volumen: 0.12 }),
  clang: () => {
    tono({ tipo: 'triangle', de: 1250, a: 1150, duracion: 0.5, volumen: 0.12 });
    tono({ tipo: 'square', de: 2500, a: 2300, duracion: 0.25, volumen: 0.03 });
  },
  rebote: () => tono({ tipo: 'sine', de: 180, a: 620, duracion: 0.22, volumen: 0.12 }),
  pared: () => tono({ de: 420, a: 860, duracion: 0.12, volumen: 0.07 }),
  premio: () => [784, 988, 1175, 1568].forEach((f, i) => tono({ tipo: 'triangle', de: f, duracion: 0.14, volumen: 0.08, retraso: i * 0.08 })),
  risa: () => [0, 1, 2].forEach((i) => tono({ tipo: 'sine', de: 620 - i * 40, a: 520 - i * 40, duracion: 0.09, volumen: 0.07, retraso: i * 0.11 })),
  meta: () => [523, 659, 784, 1047].forEach((f, i) => tono({ de: f, duracion: 0.16, volumen: 0.07, retraso: i * 0.12 })),
};

export function sonidoActivo() {
  return activo;
}

export function alternarSonido() {
  activo = !activo;
  try { localStorage.setItem(CLAVE, activo ? '1' : '0'); } catch { /* sin almacenamiento */ }
  if (activo) asegurarContexto();
  return activo;
}

export function sonar(nombre) {
  if (activo) EFECTOS[nombre]?.();
}
