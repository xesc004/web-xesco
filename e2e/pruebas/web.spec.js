import { test, expect, abrirJuego } from './base.js';

test.describe('idioma, modo CV y formulario', () => {
  test('cambia a inglés (también lang) y lo recuerda', async ({ page }) => {
    await abrirJuego(page);
    await page.locator('#boton-idioma').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.titular')).toHaveText('Computer Engineering student');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('entra y sale del modo CV', async ({ page }) => {
    await abrirJuego(page);
    await page.locator('#boton-cv').click();
    await expect(page.locator('html')).toHaveClass(/cv/);
    await expect(page).toHaveURL(/\?cv$/);
    await expect(page.locator('#muneco')).toBeHidden();
    await page.locator('#boton-volver').click();
    await expect(page.locator('html')).toHaveClass(/juego/);
    await expect(page.locator('#muneco')).toBeVisible();
  });

  test('?cv abre directamente el CV y el PDF existe en los dos idiomas', async ({ page, request }) => {
    await page.goto('/?cv');
    await expect(page.locator('html')).toHaveClass(/cv/);
    await expect(page.locator('.boton-pdf')).toBeVisible();
    for (const pdf of ['cv/Francisco-Alabau-Calatayud-CV.pdf', 'cv/Francisco-Alabau-Calatayud-CV-en.pdf']) {
      expect((await request.get(`/${pdf}`)).ok()).toBe(true);
    }
  });

  test('el formulario se envía (interceptado) y muestra el éxito', async ({ page, envios }) => {
    await page.goto('/?cv');
    const form = page.locator('#formulario-contacto');
    await form.locator('input[name="name"]').fill('Prueba E2E');
    await form.locator('input[name="email"]').fill('prueba@example.com');
    await form.locator('textarea[name="message"]').fill('Mensaje de prueba automática');
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('.form-exito')).toBeVisible();
    expect(envios).toHaveLength(1);
    expect(envios[0]).toContain('Prueba E2E');
  });

  test('si Web3Forms falla se avisa al usuario', async ({ page, envios }) => {
    envios.respuesta = 'error';
    await page.goto('/?cv');
    const form = page.locator('#formulario-contacto');
    await form.locator('input[name="name"]').fill('Prueba E2E');
    await form.locator('input[name="email"]').fill('prueba@example.com');
    await form.locator('textarea[name="message"]').fill('Mensaje');
    let mensaje = '';
    page.once('dialog', (dialogo) => {
      mensaje = dialogo.message();
      dialogo.dismiss();
    });
    await form.locator('button[type="submit"]').click();
    await expect.poll(() => mensaje).toContain('xescoalabaucalatayud2@gmail.com');
  });

  test('con movimiento reducido no hay intro ni hojas', async ({ browser }) => {
    const contexto = await browser.newContext({ reducedMotion: 'reduce', locale: 'es-ES' });
    const page = await contexto.newPage();
    await page.route(/googletagmanager/, (r) => r.abort());
    await page.goto('/');
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 6_000 });
    await expect(page.locator('.hoja')).toHaveCount(0);
    await contexto.close();
  });
});

test('escribir en el formulario no activa el código Konami', async ({ page }, info) => {
  test.skip(info.project.name.startsWith('movil'), 'teclado solo en escritorio');
  await page.goto('/?depurar');
  await page.waitForFunction(() => window.__juego?.jugador);
  await page.locator('[data-ir="contacto"]').dispatchEvent('click');
  // Al llegar a la meta sale el resumen: se cierra antes de escribir para que no robe el foco
  await expect(page.locator('#resumen')).toBeVisible({ timeout: 8_000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#resumen')).toBeHidden();
  const campo = page.locator('#formulario-contacto textarea');
  await campo.focus();
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
    await page.keyboard.press(k);
  }
  await expect(campo).toHaveValue('ba');
  await expect(page.locator('#muneco')).not.toHaveClass(/modo-kyubi/);
});

test('la rueda desplaza la sala de una app en ventanas bajas', async ({ page }, info) => {
  test.skip(info.project.name.startsWith('movil'), 'rueda solo en escritorio');
  await page.setViewportSize({ width: 1000, height: 480 });
  await page.goto('/?depurar');
  await page.waitForFunction(() => window.__juego?.jugador);
  await page.locator('.tuberia-boton[data-sala="aldiax"]').dispatchEvent('click');
  const escena = page.locator('#sala .sala-escena');
  await expect(page.locator('#sala')).toBeVisible();
  await escena.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => escena.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});
