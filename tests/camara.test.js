import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCamara, seguirCamara, centrarCamara, limitarCamara } from '../js/juego/camara.js';

test('la cámara no sale del mundo por ningún lado', () => {
  assert.equal(limitarCamara(-300, 1000, 18500), 0);
  assert.equal(limitarCamara(99999, 1000, 18500), 17500);
});

test('si el mundo cabe entero, la cámara se queda en 0', () => {
  assert.equal(limitarCamara(50, 20000, 18500), 0);
});

test('centrar deja al jugador al 40 % del ancho visible', () => {
  const cam = centrarCamara(crearCamara(), 5000, 1000, 18500);
  assert.equal(cam.x, 4600);
});

test('seguir se acerca al objetivo con adelanto hacia donde mira', () => {
  const cam = crearCamara();
  for (let i = 0; i < 600; i++) seguirCamara(cam, 5000, 1, 1000, 18500, 1 / 120);
  assert.ok(Math.abs(cam.x - 4700) < 1);
});
