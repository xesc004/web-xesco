// Base común: el formulario NUNCA se envía de verdad (Web3Forms se intercepta) y no se cuenta en Analytics.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  envios: [async ({ page }, usar) => {
    const envios = [];
    await page.route('https://api.web3forms.com/**', async (ruta) => {
      envios.push(ruta.request().postData() ?? '');
      const fallar = envios.respuesta === 'error';
      await ruta.fulfill({
        status: fallar ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(fallar ? { success: false, message: 'Error de prueba' } : { success: true }),
      });
    });
    await page.route(/googletagmanager\.com|google-analytics\.com/, (ruta) => ruta.abort());
    await usar(envios);
  }, { auto: true }],
});

export { expect };

// Abre el juego con ?depurar (expone window.__juego) y espera a que se vaya la intro
export async function abrirJuego(page, extra = '') {
  await page.goto(`/?depurar${extra}`);
  await expect(page.locator('#intro')).toHaveCount(0, { timeout: 10_000 });
  await page.waitForFunction(() => window.__juego?.jugador);
}

export function estadoJugador(page) {
  return page.evaluate(() => {
    const j = window.__juego.jugador;
    const c = j.cuerpo;
    return { x: c.x, y: c.y, vx: c.vx, enSuelo: c.enSuelo, estado: j.estado, sobre: c.sobre?.id ?? null };
  });
}

export function esMovil(testInfo) {
  return testInfo.project.name.startsWith('movil');
}
