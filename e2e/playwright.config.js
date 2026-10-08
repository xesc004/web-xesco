// Pruebas E2E del portfolio. En local: npm install && npm run navegadores && npm test.
// Sin WebKit/Firefox instalados: npx playwright test --project=chromium --project=movil-chromium
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './pruebas',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  // El juego anima mucho: con demasiados navegadores a la vez en una máquina modesta las pruebas se ahogan
  workers: process.env.CI ? 2 : '50%',
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8080',
    locale: 'es-ES',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node herramientas/servidor.mjs',
    cwd: '..',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Móvil táctil con el motor de cada plataforma, y la misma pantalla en Chromium para entornos sin WebKit
    { name: 'movil-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'movil-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
