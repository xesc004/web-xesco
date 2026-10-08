import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRango, formatoTiempo } from '../js/juego/resumen.js';
import { crearKonami } from '../js/juego/secretos.js';

test('el rango premia piezas, rapidez y secretos', () => {
  assert.equal(calcularRango({ segundos: 120, piezas: 36, total: 36, secretos: 2 }), 'S');
  assert.equal(calcularRango({ segundos: 300, piezas: 36, total: 36, secretos: 0 }), 'B');
  assert.equal(calcularRango({ segundos: 100, piezas: 33, total: 36, secretos: 0 }), 'A');
  assert.equal(calcularRango({ segundos: 50, piezas: 0, total: 36, secretos: 0 }), 'C');
});

test('el tiempo se muestra como m:ss', () => {
  assert.equal(formatoTiempo(0), '0:00');
  assert.equal(formatoTiempo(83.4), '1:23');
  assert.equal(formatoTiempo(600), '10:00');
});

test('el código Konami se reconoce aunque haya teclas antes y se reinicia al fallar', () => {
  const konami = crearKonami();
  const codigo = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  assert.equal(['Space', 'ArrowUp', ...codigo].map(konami).at(-1), true);
  assert.equal([...codigo.slice(0, 5), 'KeyX', ...codigo.slice(5)].map(konami).some(Boolean), false);
});
