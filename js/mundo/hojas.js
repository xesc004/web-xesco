// Hojas de la Aldea de la Hoja: partículas en dos capas (detrás y delante del mundo) que caen meciéndose,
// se desplazan con la cámara a distinta profundidad y se arremolinan alrededor del muñeco cuando corre.
// Cada hoja es un elemento pequeño que solo cambia de transform: lo mueve el compositor, sin repintar nada.
const COLORES = 5;
const TAM_BASE = 32;
const RADIO_REMOLINO = 230;

// Generador con semilla: el reparto inicial es siempre el mismo
function crearAzar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crearHoja(azar, ancho, alto, frente) {
  return {
    x: azar() * ancho,
    y: azar() * alto,
    // Profundidad = parallax: las del fondo se mueven más despacio que el mundo; las de delante, más deprisa
    profundidad: frente ? 1.25 + azar() * 0.35 : 0.25 + azar() * 0.6,
    tam: frente ? 26 + azar() * 16 : 9 + azar() * 9,
    caida: frente ? 50 + azar() * 30 : 22 + azar() * 30,
    fase: azar() * Math.PI * 2,
    vaiven: 0.8 + azar() * 1.4,
    giro: azar() * Math.PI * 2,
    vgiro: (azar() - 0.5) * 2.4,
    ex: 0,
    ey: 0,
    color: Math.floor(azar() * COLORES),
    el: null,
  };
}

function crearElemento(p, contenedor) {
  p.el = document.createElement('span');
  p.el.className = `hoja hoja-${p.color}`;
  contenedor.appendChild(p.el);
}

export function crearHojas(contenedorFondo, contenedorFrente, { fondo = 26, frente = 6 } = {}) {
  const azar = crearAzar(1906);
  const h = {
    capas: [
      { contenedor: contenedorFondo, hojas: [], frente: false },
      { contenedor: contenedorFrente, hojas: [], frente: true },
    ],
    ancho: 1,
    alto: 1,
    escala: 1,
    tiempo: 0,
  };
  redimensionarHojas(h, 1);
  h.capas[0].hojas = Array.from({ length: fondo }, () => crearHoja(azar, h.ancho, h.alto, false));
  h.capas[1].hojas = Array.from({ length: frente }, () => crearHoja(azar, h.ancho, h.alto, true));
  for (const capa of h.capas) for (const p of capa.hojas) crearElemento(p, capa.contenedor);
  return h;
}

export function redimensionarHojas(h, escala) {
  h.ancho = innerWidth;
  h.alto = innerHeight;
  h.escala = escala;
}

// Paso de simulación (puro salvo por los datos de h): dx es lo que se ha movido la cámara, en px de pantalla
export function moverHojas(h, dt, dx, jugador) {
  h.tiempo += dt;
  const { ancho, alto } = h;
  for (const capa of h.capas) {
    for (const p of capa.hojas) {
      // Remolino: si el muñeco corre, las hojas cercanas giran a su alrededor y se levantan
      if (jugador.corriendo) {
        const rx = p.x - jugador.x;
        const ry = p.y - jugador.y;
        const d = Math.hypot(rx, ry);
        const radio = RADIO_REMOLINO * h.escala;
        if (d < radio && d > 1) {
          const fuerza = (1 - d / radio) * 900 * dt;
          p.ex += (-ry / d) * fuerza * jugador.dir + (-rx / d) * fuerza * 0.25;
          p.ey += (rx / d) * fuerza * jugador.dir - fuerza * 0.6;
          p.vgiro += fuerza * 0.02;
        }
      }
      const amortigua = Math.max(0, 1 - 2.2 * dt);
      p.ex *= amortigua;
      p.ey *= amortigua;
      p.vgiro = p.vgiro * Math.max(0, 1 - 0.8 * dt) + (Math.sign(p.vgiro) || 1) * 0.6 * dt;
      const mecer = Math.sin(h.tiempo * p.vaiven + p.fase);
      p.x += (mecer * 26 - 12 + p.ex) * dt * h.escala - dx * p.profundidad;
      p.y += (p.caida * h.escala + p.ey) * dt;
      p.giro += p.vgiro * dt;
      // Al salir por un borde reaparecen por el contrario
      const m = 40;
      if (p.y > alto + m) { p.y = -m; p.ex = 0; p.ey = 0; }
      if (p.y < -m * 3) p.y = alto + m;
      if (p.x < -m) p.x += ancho + 2 * m;
      if (p.x > ancho + m) p.x -= ancho + 2 * m;
    }
  }
}

export function dibujarHojas(h) {
  for (const capa of h.capas) {
    for (const p of capa.hojas) {
      // Achatamiento horizontal según el giro: parece que la hoja da vueltas en 3D
      const aplastar = 0.35 + 0.65 * Math.abs(Math.sin(p.giro * 0.7 + p.fase));
      const tam = (p.tam * h.escala) / TAM_BASE;
      p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${p.giro.toFixed(2)}rad) scale(${(tam * aplastar).toFixed(3)}, ${tam.toFixed(3)})`;
    }
  }
}
