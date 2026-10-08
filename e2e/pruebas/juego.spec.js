import { test, expect, abrirJuego, estadoJugador, esMovil } from './base.js';

test.describe('juego', () => {
  test('carga sin errores y muestra el nivel', async ({ page }) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(String(e)));
    await abrirJuego(page);
    await expect(page).toHaveTitle(/Xesco/);
    await expect(page.locator('html')).toHaveClass(/juego/);
    await expect(page.locator('#muneco')).toBeVisible();
    await expect(page.locator('#contador-piezas')).toHaveText(/\d+\/36/);
    expect(errores).toEqual([]);
  });

  test('anda con las flechas y salta con espacio', async ({ page }, info) => {
    test.skip(esMovil(info), 'teclado solo en escritorio');
    await abrirJuego(page);
    const antes = await estadoJugador(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowRight');
    const despues = await estadoJugador(page);
    expect(despues.x).toBeGreaterThan(antes.x + 100);
    await page.waitForTimeout(400);
    await page.keyboard.down('Space');
    await page.waitForTimeout(200);
    const enElAire = await estadoJugador(page);
    await page.keyboard.up('Space');
    expect(enElAire.enSuelo).toBe(false);
    expect(enElAire.y).toBeLessThan(despues.y - 50);
    await expect.poll(async () => (await estadoJugador(page)).enSuelo, { timeout: 3_000 }).toBe(true);
  });

  test('se puede coger y lanzar al muñeco', async ({ page }, info) => {
    test.skip(esMovil(info), 'el arrastre táctil se prueba con los controles');
    await abrirJuego(page);
    const caja = await page.locator('#muneco').boundingBox();
    await page.mouse.move(caja.x + caja.width / 2, caja.y + 30);
    await page.mouse.down();
    await page.mouse.move(caja.x + 300, caja.y - 150, { steps: 6 });
    expect((await estadoJugador(page)).estado).toBe('colgado');
    await page.mouse.up();
    await expect.poll(async () => (await estadoJugador(page)).estado).not.toBe('colgado');
  });

  test('el minimapa lleva a cada zona', async ({ page }) => {
    await abrirJuego(page);
    await page.locator('[data-ir="habilidades"]').dispatchEvent('click');
    await expect.poll(async () => (await estadoJugador(page)).x).toBeGreaterThan(11400);
    await expect(page.locator('.minimapa [data-ir="habilidades"]')).toHaveClass(/actual/);
  });

  test('los controles táctiles mueven al muñeco', async ({ page }, info) => {
    test.skip(!esMovil(info), 'solo en móvil');
    await abrirJuego(page);
    await expect(page.locator('.tactil')).toBeVisible();
    const antes = await estadoJugador(page);
    const derecha = page.locator('.tactil-boton[data-control="derecha"]');
    await derecha.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true });
    await page.waitForTimeout(600);
    await derecha.dispatchEvent('pointerup', { pointerId: 7, isPrimary: true });
    expect((await estadoJugador(page)).x).toBeGreaterThan(antes.x + 100);
    const saltar = page.locator('.tactil-boton[data-control="saltar"]');
    await saltar.dispatchEvent('pointerdown', { pointerId: 8, isPrimary: true });
    await page.waitForTimeout(150);
    expect((await estadoJugador(page)).enSuelo).toBe(false);
    await saltar.dispatchEvent('pointerup', { pointerId: 8, isPrimary: true });
  });

  test('la tubería de una app abre su sala y se sale por la de salida', async ({ page }) => {
    await abrirJuego(page);
    await page.locator('[data-ir="aldiax"]').dispatchEvent('click');
    await page.locator('.tuberia-boton[data-sala="aldiax"]').dispatchEvent('click');
    const sala = page.locator('#sala');
    await expect(sala).toBeVisible();
    await expect(sala.locator('#sala-titulo')).toHaveText('Aldiax');
    await expect(sala.locator('.sala-stack li')).not.toHaveCount(0);
    await expect(sala.locator('.sala-tienda a')).toHaveAttribute('href', /apps\.apple\.com/);
    await sala.locator('.sala-salir').click();
    await expect(sala).toBeHidden({ timeout: 8_000 });
    await expect.poll(async () => (await estadoJugador(page)).sobre, { timeout: 4_000 }).toBe('salida-aldiax');
  });

  test('al llegar a la meta sale el resumen con contacto y CV en PDF', async ({ page, request }) => {
    await abrirJuego(page);
    await page.locator('[data-ir="contacto"]').dispatchEvent('click');
    const resumen = page.locator('#resumen');
    await expect(resumen).toBeVisible({ timeout: 8_000 });
    await expect(resumen.locator('#resumen-letra')).toHaveText(/^[SABC]$/);
    const pdf = await resumen.locator('#resumen-pdf').getAttribute('href');
    expect((await request.get(`/${pdf}`)).ok()).toBe(true);
    await resumen.locator('#resumen-contacto').click();
    await expect(resumen).toBeHidden();
    await expect(page.locator('#formulario-contacto input[name="name"]')).toBeFocused();
  });
});

test('en móvil el minimapa es un desplegable con las zonas', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('movil'), 'solo en móvil');
  await abrirJuego(page);
  const abrir = page.locator('.minimapa-abrir');
  await expect(abrir).toBeVisible();
  await abrir.click();
  await expect(abrir).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.minimapa [data-ir="charlas"]').click();
  await expect(abrir).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.minimapa-abrir-zona')).toHaveText('Charlas');
});
