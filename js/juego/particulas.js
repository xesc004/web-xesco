// Partículas del nivel: polvo al aterrizar y al correr, chispas del yunque y piezas de LEGO de los bloques sorpresa.
// Un grupo fijo de elementos dentro de #mundo que se reutilizan; solo cambian transform y opacidad.
const MAXIMO = 48;
const COLORES_LEGO = ['#F47B20', '#D93B30', '#25B9E8', '#FFD25E', '#5E9E3F'];

const TIPOS = {
  // vida (s), gravedad, rozamiento por segundo, tamaño inicial → final
  polvo: { vida: 0.5, gravedad: -40, rozamiento: 4, desde: 0.5, hasta: 1.6 },
  chispa: { vida: 0.45, gravedad: 1400, rozamiento: 1.5, desde: 1, hasta: 0.4 },
  lego: { vida: 0.9, gravedad: 2200, rozamiento: 0.6, desde: 1, hasta: 0.9 },
};

export function crearParticulas(mundo) {
  const capa = document.createElement('div');
  capa.className = 'particulas';
  capa.setAttribute('aria-hidden', 'true');
  mundo.appendChild(capa);
  const libres = [];
  for (let i = 0; i < MAXIMO; i++) {
    const el = document.createElement('span');
    el.hidden = true;
    capa.appendChild(el);
    libres.push({ el, vivo: false });
  }
  return { lista: libres, siguiente: 0 };
}

function tomar(p) {
  // Si no queda ninguna libre se recicla la más antigua (en orden circular)
  const n = p.lista.length;
  for (let k = 0; k < n; k++) {
    const q = p.lista[(p.siguiente + k) % n];
    if (!q.vivo) {
      p.siguiente = (p.siguiente + k + 1) % n;
      return q;
    }
  }
  const q = p.lista[p.siguiente];
  p.siguiente = (p.siguiente + 1) % n;
  return q;
}

// x, y en unidades del mundo; angulo y abanico en radianes (0 = derecha, -π/2 = arriba)
export function emitir(p, tipo, x, y, { cantidad = 1, velocidad = 200, angulo = -Math.PI / 2, abanico = Math.PI, tam = 1 } = {}) {
  if (!p) return;
  const def = TIPOS[tipo];
  for (let i = 0; i < cantidad; i++) {
    const q = tomar(p);
    const a = angulo + (Math.random() - 0.5) * abanico;
    const v = velocidad * (0.55 + Math.random() * 0.45);
    Object.assign(q, {
      vivo: true,
      def,
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      giro: Math.random() * 360,
      vgiro: (Math.random() - 0.5) * 900,
      edad: 0,
      tam: tam * (0.7 + Math.random() * 0.6),
    });
    q.el.className = `particula particula-${tipo}`;
    if (tipo === 'lego') q.el.style.setProperty('--color', COLORES_LEGO[Math.floor(Math.random() * COLORES_LEGO.length)]);
    q.el.hidden = false;
  }
}

export function actualizarParticulas(p, dt) {
  if (!p) return;
  for (const q of p.lista) {
    if (!q.vivo) continue;
    q.edad += dt;
    const t = q.edad / q.def.vida;
    if (t >= 1) {
      q.vivo = false;
      q.el.hidden = true;
      continue;
    }
    const roce = Math.max(0, 1 - q.def.rozamiento * dt);
    q.vx *= roce;
    q.vy = q.vy * roce + q.def.gravedad * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.giro += q.vgiro * dt;
    const escala = q.tam * (q.def.desde + (q.def.hasta - q.def.desde) * t);
    q.el.style.transform = `translate3d(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px, 0) rotate(${q.giro.toFixed(0)}deg) scale(${escala.toFixed(2)})`;
    q.el.style.opacity = (t < 0.7 ? 1 : (1 - t) / 0.3).toFixed(2);
  }
}
