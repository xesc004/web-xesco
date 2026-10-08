import { test } from 'node:test';
import assert from 'node:assert/strict';
import { premiosPara } from '../js/juego/jugador.js';

test('los premios llegan a las 12, 24 y 36 piezas', () => {
  assert.deepEqual(premiosPara(0), []);
  assert.deepEqual(premiosPara(11), []);
  assert.deepEqual(premiosPara(12), ['bandana']);
  assert.deepEqual(premiosPara(30), ['bandana', 'capa']);
  assert.deepEqual(premiosPara(36), ['bandana', 'capa', 'aura']);
});
