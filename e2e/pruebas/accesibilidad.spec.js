import AxeBuilder from '@axe-core/playwright';
import { test, expect, abrirJuego } from './base.js';

// WCAG 2.2 A y AA
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function resumen(violaciones) {
  return violaciones.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

test.describe('accesibilidad', () => {
  test('modo juego sin infracciones WCAG 2.2 AA', async ({ page }) => {
    await abrirJuego(page);
    const { violations } = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
    expect(resumen(violations)).toEqual([]);
  });

  test('modo CV sin infracciones WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/?cv');
    const { violations } = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
    expect(resumen(violations)).toEqual([]);
  });

  test('la sala de una app y el resumen sin infracciones', async ({ page }) => {
    await abrirJuego(page);
    await page.locator('[data-ir="aldiax"]').dispatchEvent('click');
    await page.locator('.tuberia-boton[data-sala="aldiax"]').dispatchEvent('click');
    await expect(page.locator('#sala')).toBeVisible();
    let r = await new AxeBuilder({ page }).include('#sala').withTags(ETIQUETAS).analyze();
    expect(resumen(r.violations)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('#sala')).toBeHidden({ timeout: 8_000 });
    await page.locator('[data-ir="contacto"]').dispatchEvent('click');
    await expect(page.locator('#resumen')).toBeVisible({ timeout: 8_000 });
    r = await new AxeBuilder({ page }).include('#resumen').withTags(ETIQUETAS).analyze();
    expect(resumen(r.violations)).toEqual([]);
  });

  test('el primer Tab enfoca «Saltar al CV» y los bloques sorpresa usan aria-expanded', async ({ page }, info) => {
    test.skip(info.project.name.startsWith('movil'), 'teclado solo en escritorio');
    await abrirJuego(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('.saltar-cv')).toBeFocused();
    const bloque = page.locator('#sorpresa-aldiax');
    await expect(bloque).toHaveAttribute('aria-expanded', 'false');
    await bloque.focus();
    await page.keyboard.press('Enter');
    await expect(bloque).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#capturas-aldiax')).toBeVisible();
  });
});
