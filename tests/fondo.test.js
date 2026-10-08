import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorCielo } from '../js/mundo/fondo.js';

test('el cielo pasa de la mañana al mediodía y al atardecer', () => {
  assert.equal(colorCielo(0).arriba, 'rgb(169,220,245)');
  assert.equal(colorCielo(0.5).arriba, 'rgb(110,193,240)');
  assert.equal(colorCielo(1).arriba, 'rgb(247,163,92)');
});

test('el progreso fuera de rango se recorta', () => {
  assert.deepEqual(colorCielo(-1), colorCielo(0));
  assert.deepEqual(colorCielo(3), colorCielo(1));
});
