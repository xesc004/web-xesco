// Física del muñeco: funciones puras sin DOM, en unidades de diseño (el mundo mide 900 de alto).
export const FISICA = {
  gravedad: 2600,
  velocidadMax: 380,
  aceleracion: 2400,
  frenado: 3000,
  controlAereo: 0.6,
  salto: 1000,
  corteSalto: 0.45,
  // Cerca del punto más alto, con el salto pulsado, la gravedad se suaviza: el muñeco «flota» un instante
  flotacion: 0.6,
  velocidadCima: 140,
  caidaMax: 1400,
  margenSalto: 0.1,
  memoriaSalto: 0.12,
  rebote: 1500,
  tiempoAtravesar: 0.25,
  // Paredes: deslizamiento lento y salto que impulsa hacia el lado contrario
  deslizarPared: 240,
  saltoPared: 940,
  impulsoPared: 480,
  bloqueoPared: 0.16,
  margenPared: 24,
};

const EPS = 0.01;
const SOLIDOS = new Set(['solido', 'sorpresa']);

export function crearCuerpo({ x, y, w, h }) {
  return {
    x, y, w, h,
    vx: 0,
    vy: 0,
    enSuelo: false,
    sobre: null,
    tiempoAire: 0,
    memoriaSalto: 0,
    saltando: false,
    atravesando: null,
    tiempoAtravesar: 0,
    pared: 0,
    bloqueo: 0,
  };
}

function solapaX(a, b) {
  return a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS;
}

function solapa(a, b) {
  return solapaX(a, b) && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;
}

function aterrizar(c, p) {
  c.vy = 0;
  c.enSuelo = true;
  c.sobre = p;
  c.saltando = false;
}

export function paso(c, entrada, colisionadores, dt) {
  const F = FISICA;
  const eventos = [];
  const estabaEnSuelo = c.enSuelo;

  // Movimiento horizontal: acelera con la entrada y frena sin ella (menos control en el aire).
  // Tras un salto de pared la entrada horizontal se ignora un instante para que el impulso se note.
  if (c.bloqueo > 0) c.bloqueo -= dt;
  const dir = c.bloqueo > 0 ? 0 : (entrada.derecha ? 1 : 0) - (entrada.izquierda ? 1 : 0);
  const control = c.enSuelo ? 1 : F.controlAereo;
  const maxima = F.velocidadMax;
  const aceleracion = F.aceleracion;
  if (dir !== 0) {
    // Por encima de la máxima (tras el impulso de un salto de pared) se frena poco a poco en vez de recortar de golpe
    const v = c.vx + dir * aceleracion * control * dt;
    c.vx = Math.abs(v) <= maxima ? v : Math.sign(v) * Math.max(maxima, Math.abs(c.vx) - F.frenado * control * dt);
  } else if (c.bloqueo <= 0) {
    const frena = F.frenado * control * dt;
    c.vx = Math.abs(c.vx) <= frena ? 0 : c.vx - Math.sign(c.vx) * frena;
  }

  // Salto: margen tras salir de un borde y memoria si se pulsa justo antes de aterrizar
  c.tiempoAire = c.enSuelo ? 0 : c.tiempoAire + dt;
  c.memoriaSalto = entrada.saltar ? F.memoriaSalto : Math.max(0, c.memoriaSalto - dt);
  if (c.memoriaSalto > 0 && !c.saltando && (c.enSuelo || c.tiempoAire <= F.margenSalto)) {
    c.vy = -F.salto;
    c.saltando = true;
    c.enSuelo = false;
    c.sobre = null;
    c.memoriaSalto = 0;
    c.tiempoAire = F.margenSalto + dt;
    eventos.push({ tipo: 'salta' });
  } else if (c.memoriaSalto > 0 && c.pared !== 0 && !c.enSuelo) {
    // Salto de pared: sale despedido hacia el lado contrario
    c.vy = -F.saltoPared;
    c.vx = -c.pared * F.impulsoPared;
    c.saltando = true;
    c.memoriaSalto = 0;
    c.bloqueo = F.bloqueoPared;
    eventos.push({ tipo: 'saltaPared', lado: c.pared });
    c.pared = 0;
  }
  if (c.saltando && c.vy < 0 && !entrada.saltoPulsado) {
    c.vy *= F.corteSalto;
    c.saltando = false;
  }

  // Bajar de una plataforma de un sentido
  if (entrada.bajar && c.enSuelo && c.sobre?.tipo === 'unSentido') {
    c.atravesando = c.sobre.id;
    c.tiempoAtravesar = F.tiempoAtravesar;
    c.enSuelo = false;
    c.sobre = null;
    c.tiempoAire = F.margenSalto + dt;
  }
  if (c.tiempoAtravesar > 0) {
    c.tiempoAtravesar -= dt;
    if (c.tiempoAtravesar <= 0) c.atravesando = null;
  }

  const enCima = c.saltando && entrada.saltoPulsado && Math.abs(c.vy) < F.velocidadCima;
  c.vy = Math.min(c.vy + F.gravedad * (enCima ? F.flotacion : 1) * dt, F.caidaMax);
  const vyAntes = c.vy;

  // Eje X: choques laterales con sólidos y con los costados de los carteles (data-pared).
  // Un cartel solo hace de pared al caer y empujando contra él: subiendo se atraviesa como siempre.
  const xAntes = c.x;
  c.x += c.vx * dt;
  c.pared = 0;
  for (const p of colisionadores) {
    if (SOLIDOS.has(p.tipo)) {
      if (!solapa(c, p)) continue;
      const lado = c.vx > 0 ? 1 : c.vx < 0 ? -1 : 0;
      if (lado > 0) c.x = p.x - c.w;
      else if (lado < 0) c.x = p.x + p.w;
      c.vx = 0;
      if (!c.enSuelo && lado !== 0 && lado === dir) c.pared = lado;
    } else if (p.pared && !c.enSuelo && dir !== 0 && c.vy >= 0
      && c.y < p.y + p.h && c.y + c.h > p.y + F.margenPared) {
      const entraPorIzquierda = dir > 0 && xAntes + c.w <= p.x + EPS && c.x + c.w > p.x;
      const entraPorDerecha = dir < 0 && xAntes >= p.x + p.w - EPS && c.x < p.x + p.w;
      if (!entraPorIzquierda && !entraPorDerecha) continue;
      c.x = entraPorIzquierda ? p.x - c.w : p.x + p.w;
      c.vx = 0;
      c.pared = dir;
    }
  }
  // Pegado a una pared se resbala despacio
  if (c.pared !== 0 && c.vy > F.deslizarPared) c.vy = F.deslizarPared;

  // Eje Y: suelos, techos, plataformas de un sentido y camas elásticas
  const pieAntes = c.y + c.h;
  c.y += c.vy * dt;
  c.enSuelo = false;
  c.sobre = null;
  for (const p of colisionadores) {
    if (p.id === c.atravesando || !solapaX(c, p)) continue;
    if (SOLIDOS.has(p.tipo)) {
      if (!solapa(c, p)) continue;
      if (c.vy > 0) {
        c.y = p.y - c.h;
        aterrizar(c, p);
      } else if (c.vy < 0) {
        c.y = p.y + p.h;
        c.vy = 0;
        c.saltando = false;
        if (p.tipo === 'sorpresa') eventos.push({ tipo: 'golpeaTecho', id: p.id });
      }
    } else if (c.vy >= 0 && pieAntes <= p.y + 0.5 && c.y + c.h >= p.y) {
      c.y = p.y - c.h;
      if (p.tipo === 'elastico') {
        c.vy = -F.rebote;
        c.saltando = false;
        c.tiempoAire = F.margenSalto + dt;
        eventos.push({ tipo: 'rebota', id: p.id });
      } else {
        aterrizar(c, p);
      }
    }
  }
  // impacto: velocidad de caída al tocar el suelo (para aplastar al muñeco, el polvo y el temblor)
  if (c.enSuelo && !estabaEnSuelo) eventos.push({ tipo: 'aterriza', id: c.sobre.id, impacto: Math.max(0, vyAntes) });
  return eventos;
}

// Saca el cuerpo de cualquier sólido empujándolo hacia arriba (tras redimensionar o soltar al muñeco)
export function desatascar(c, colisionadores) {
  for (let intento = 0; intento < 6; intento++) {
    const atrapado = colisionadores.find((p) => SOLIDOS.has(p.tipo) && solapa(c, p));
    if (!atrapado) return;
    c.y = atrapado.y - c.h;
    c.vy = 0;
  }
}
