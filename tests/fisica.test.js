import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCuerpo, paso, desatascar } from '../js/motor/fisica.js';

const DT = 1 / 120;
const nada = { izquierda: false, derecha: false, saltar: false, saltoPulsado: false, bajar: false };
const suelo = { id: 'suelo', x: -1000, y: 780, w: 5000, h: 400, tipo: 'solido' };

function simular(c, colisionadores, segundos, entrada = nada) {
  const eventos = [];
  const pasos = Math.round(segundos / DT);
  for (let i = 0; i < pasos; i++) {
    const e = typeof entrada === 'function' ? entrada(i) : entrada;
    eventos.push(...paso(c, e, colisionadores, DT));
  }
  return eventos;
}

test('cae por gravedad y aterriza sobre el suelo', () => {
  const c = crearCuerpo({ x: 100, y: 300, w: 60, h: 140 });
  const eventos = simular(c, [suelo], 2);
  assert.equal(c.enSuelo, true);
  assert.equal(c.y + c.h, 780);
  assert.ok(eventos.some((e) => e.tipo === 'aterriza' && e.id === 'suelo'));
});

test('una plataforma de un sentido se atraviesa desde abajo y sostiene desde arriba', () => {
  const plataforma = { id: 'p', x: 0, y: 650, w: 300, h: 40, tipo: 'unSentido' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  simular(c, [suelo, plataforma], 0.5);
  assert.equal(c.y + c.h, 780);
  simular(c, [suelo, plataforma], 1.2, (i) => ({ ...nada, saltar: i === 0, saltoPulsado: i < 60 }));
  assert.equal(c.enSuelo, true);
  assert.equal(c.y + c.h, 650);
});

test('con bajar se deja caer desde una plataforma de un sentido', () => {
  const plataforma = { id: 'p', x: 0, y: 650, w: 300, h: 40, tipo: 'unSentido' };
  const c = crearCuerpo({ x: 100, y: 500, w: 60, h: 140 });
  simular(c, [suelo, plataforma], 0.3);
  assert.equal(c.y + c.h, 650);
  simular(c, [suelo, plataforma], 1, (i) => ({ ...nada, bajar: i === 0 }));
  assert.equal(c.y + c.h, 780);
});

test('un sólido frena el avance lateral', () => {
  const muro = { id: 'muro', x: 300, y: 500, w: 100, h: 280, tipo: 'solido' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  simular(c, [suelo, muro], 2, { ...nada, derecha: true });
  assert.equal(c.x + c.w, 300);
  assert.equal(c.vx, 0);
});

test('se puede saltar justo después de salir de un borde', () => {
  const plataforma = { id: 'p', x: 0, y: 650, w: 200, h: 40, tipo: 'unSentido' };
  const c = crearCuerpo({ x: 130, y: 510, w: 60, h: 140 });
  simular(c, [suelo, plataforma], 0.2);
  assert.equal(c.enSuelo, true);
  let pasosEnAire = 0;
  const eventos = simular(c, [suelo, plataforma], 0.6, () => {
    if (!c.enSuelo && c.vy >= 0) pasosEnAire++;
    return { ...nada, derecha: true, saltar: pasosEnAire === 6, saltoPulsado: pasosEnAire >= 6 && pasosEnAire < 40 };
  });
  assert.ok(eventos.some((e) => e.tipo === 'salta'));
});

test('no se puede saltar en el aire pasado el margen', () => {
  const c = crearCuerpo({ x: 100, y: 0, w: 60, h: 140 });
  const eventos = simular(c, [suelo], 0.3, (i) => ({ ...nada, saltar: i === 30, saltoPulsado: i >= 30 }));
  assert.ok(!eventos.some((e) => e.tipo === 'salta'));
});

test('el salto se memoriza si se pulsa justo antes de aterrizar', () => {
  const c = crearCuerpo({ x: 100, y: 560, w: 60, h: 140 });
  let pedido = false;
  const eventos = simular(c, [suelo], 0.5, () => {
    const cerca = !pedido && !c.enSuelo && c.vy > 0 && 780 - (c.y + c.h) < 15;
    if (cerca) pedido = true;
    return { ...nada, saltar: cerca, saltoPulsado: pedido };
  });
  assert.ok(eventos.some((e) => e.tipo === 'salta'));
});

test('soltar el salto pronto lo hace más bajo', () => {
  const alto = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  const bajo = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  let minAlto = Infinity;
  let minBajo = Infinity;
  for (let i = 0; i < 90; i++) {
    paso(alto, { ...nada, saltar: i === 0, saltoPulsado: true }, [suelo], DT);
    paso(bajo, { ...nada, saltar: i === 0, saltoPulsado: i < 6 }, [suelo], DT);
    minAlto = Math.min(minAlto, alto.y);
    minBajo = Math.min(minBajo, bajo.y);
  }
  assert.ok(minBajo > minAlto + 60);
});

test('la cama elástica devuelve al muñeco hacia arriba', () => {
  const cama = { id: 'neurona-cama', x: 0, y: 620, w: 200, h: 160, tipo: 'elastico' };
  const c = crearCuerpo({ x: 50, y: 330, w: 60, h: 140 });
  const eventos = simular(c, [suelo, cama], 0.4);
  assert.ok(eventos.some((e) => e.tipo === 'rebota' && e.id === 'neurona-cama'));
  assert.ok(c.vy < 0);
});

test('golpear un bloque sorpresa desde abajo emite golpeaTecho', () => {
  const bloque = { id: 'sorpresa-aldiax', x: 80, y: 420, w: 96, h: 96, tipo: 'sorpresa' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  const eventos = simular(c, [suelo, bloque], 0.6, (i) => ({ ...nada, saltar: i === 0, saltoPulsado: true }));
  assert.ok(eventos.some((e) => e.tipo === 'golpeaTecho' && e.id === 'sorpresa-aldiax'));
});

test('desatascar saca al muñeco de un sólido hacia arriba', () => {
  const caja = { id: 'caja', x: 0, y: 600, w: 200, h: 180, tipo: 'solido' };
  const c = crearCuerpo({ x: 50, y: 650, w: 60, h: 140 });
  desatascar(c, [suelo, caja]);
  assert.equal(c.y + c.h, 600);
});

test('por encima de la velocidad máxima frena poco a poco en vez de recortar de golpe', () => {
  const c = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  simular(c, [suelo], 0.1);
  c.vx = 600;
  paso(c, { ...nada, derecha: true }, [suelo], DT);
  assert.ok(c.vx > 560, 'no se recorta de golpe');
  simular(c, [suelo], 1, { ...nada, derecha: true });
  assert.ok(Math.abs(c.vx - 380) < 1);
});

test('cayendo contra el costado de un cartel se resbala y puede saltar hacia el otro lado', () => {
  const cartel = { id: 'cartel', x: 300, y: 300, w: 400, h: 260, tipo: 'unSentido', pared: true };
  const c = crearCuerpo({ x: 200, y: 260, w: 60, h: 140 });
  c.vy = 100;
  const eventos = simular(c, [suelo, cartel], 0.4, { ...nada, derecha: true });
  assert.equal(c.x + c.w, 300);
  assert.equal(c.pared, 1);
  assert.ok(c.vy <= 240, 'se resbala despacio');
  assert.ok(!eventos.some((e) => e.tipo === 'aterriza'));
  const salto = simular(c, [suelo, cartel], 0.05, (i) => ({ ...nada, derecha: true, saltar: i === 0, saltoPulsado: true }));
  assert.ok(salto.some((e) => e.tipo === 'saltaPared' && e.lado === 1));
  assert.ok(c.vx < 0 && c.vy < 0);
});

test('subiendo, el costado de un cartel se atraviesa como antes', () => {
  const cartel = { id: 'cartel', x: 300, y: 620, w: 400, h: 100, tipo: 'unSentido', pared: true };
  const c = crearCuerpo({ x: 220, y: 640, w: 60, h: 140 });
  simular(c, [suelo, cartel], 1.2, (i) => ({ ...nada, derecha: i < 50, saltar: i === 0, saltoPulsado: true }));
  assert.equal(c.y + c.h, 620, 'acaba encima del cartel');
});

test('en el suelo, empujar un sólido no cuenta como pared', () => {
  const muro = { id: 'muro', x: 300, y: 500, w: 100, h: 280, tipo: 'solido' };
  const c = crearCuerpo({ x: 100, y: 640, w: 60, h: 140 });
  simular(c, [suelo, muro], 1, { ...nada, derecha: true });
  assert.equal(c.pared, 0);
});

test('el aterrizaje informa de la velocidad del impacto', () => {
  const alto = crearCuerpo({ x: 0, y: 0, w: 60, h: 140 });
  const bajo = crearCuerpo({ x: 0, y: 600, w: 60, h: 140 });
  const a = simular(alto, [suelo], 2).find((e) => e.tipo === 'aterriza');
  const b = simular(bajo, [suelo], 2).find((e) => e.tipo === 'aterriza');
  assert.ok(a.impacto > 1000 && b.impacto < 500);
});

test('manteniendo el salto, el muñeco flota un poco en la cima', () => {
  const pulsado = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  const sinFlotar = crearCuerpo({ x: 0, y: 640, w: 60, h: 140 });
  let aire = 0;
  let aireSin = 0;
  for (let i = 0; i < 200; i++) {
    paso(pulsado, { ...nada, saltar: i === 0, saltoPulsado: true }, [suelo], DT);
    // Soltar justo en la cima no corta el salto (ya no sube) pero tampoco flota
    paso(sinFlotar, { ...nada, saltar: i === 0, saltoPulsado: sinFlotar.vy < -150 || i === 0 }, [suelo], DT);
    if (!pulsado.enSuelo) aire++;
    if (!sinFlotar.enSuelo) aireSin++;
  }
  assert.ok(aire > aireSin);
});
