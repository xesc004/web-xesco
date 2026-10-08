import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorCielo, oscuridad } from '../js/mundo/fondo.js';

test('el cielo pasa de la mañana al mediodía, al atardecer y a la noche', () => {
  assert.equal(colorCielo(0).arriba, 'rgb(169,220,245)');
  assert.equal(colorCielo(0.4).arriba, 'rgb(110,193,240)');
  assert.equal(colorCielo(0.7).arriba, 'rgb(247,163,92)');
  assert.equal(colorCielo(1).arriba, 'rgb(26,34,76)');
});

test('el progreso fuera de rango se recorta', () => {
  assert.deepEqual(colorCielo(-1), colorCielo(0));
  assert.deepEqual(colorCielo(3), colorCielo(1));
});

test('la noche solo llega al final del nivel y crece sin saltos', () => {
  assert.equal(oscuridad(0), 0);
  assert.equal(oscuridad(0.6), 0);
  assert.equal(oscuridad(1), 1);
  let anterior = 0;
  for (let p = 0.6; p <= 1; p += 0.01) {
    const n = oscuridad(p);
    assert.ok(n >= anterior && n - anterior < 0.08);
    anterior = n;
  }
});
