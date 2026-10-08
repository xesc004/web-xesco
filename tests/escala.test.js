import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularEscala, anchoVisible, ALTO_MUNDO } from '../js/mundo/escala.js';

test('en escritorio la escala la marca el alto de la ventana', () => {
  assert.equal(calcularEscala(1440, 900), 1);
  assert.equal(calcularEscala(1920, 1080), 1.2);
});

test('en un móvil en vertical la escala la limita el ancho mínimo visible', () => {
  const escala = calcularEscala(390, 844);
  assert.ok(Math.abs(escala - 390 / 560) < 1e-9);
  assert.ok(Math.abs(anchoVisible(390, escala) - 560) < 1e-9);
  assert.ok(ALTO_MUNDO * escala < 844);
});
