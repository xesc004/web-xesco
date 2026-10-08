// Genera el CV en PDF (español e inglés) imprimiendo el modo «CV rápido» con Chromium.
//
//   node herramientas/servidor.mjs &          # la web en http://localhost:8080
//   node herramientas/generar-cv-pdf.mjs      # escribe cv/Francisco-Alabau-Calatayud-CV(-en).pdf
//
// Necesita Playwright (npm i -g playwright). Si Google Fonts no es accesible, --fuentes DIR usa los archivos
// woff2 de @fontsource/inter y @fontsource/fredoka que haya en DIR (se buscan por nombre).
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const WEB = process.env.WEB || 'http://localhost:8080';
const DESTINO = fileURLToPath(new URL('../cv/', import.meta.url));
const IDIOMAS = { es: 'Francisco-Alabau-Calatayud-CV.pdf', en: 'Francisco-Alabau-Calatayud-CV-en.pdf' };
const FUENTES = [
  ['Inter', 400, 'inter-latin-400-normal.woff2'],
  ['Inter', 600, 'inter-latin-600-normal.woff2'],
  ['Fredoka', 500, 'fredoka-latin-500-normal.woff2'],
  ['Fredoka', 600, 'fredoka-latin-600-normal.woff2'],
];

function buscar(dir, nombre) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (entrada === nombre) return ruta;
    if (statSync(ruta).isDirectory()) {
      const encontrada = buscar(ruta, nombre);
      if (encontrada) return encontrada;
    }
  }
  return null;
}

async function servirFuentesLocales(contexto, dir) {
  const css = FUENTES.map(([familia, peso, archivo]) =>
    `@font-face{font-family:"${familia}";font-weight:${peso};font-style:normal;src:url(https://fonts.gstatic.com/local/${archivo}) format("woff2")}`).join('');
  await contexto.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: css }));
  await contexto.route('https://fonts.gstatic.com/local/**', (r) => {
    const archivo = buscar(dir, r.request().url().split('/').pop());
    return archivo ? r.fulfill({ contentType: 'font/woff2', body: readFileSync(archivo) }) : r.abort();
  });
}

const indice = process.argv.indexOf('--fuentes');
const navegador = await chromium.launch();
mkdirSync(DESTINO, { recursive: true });
for (const [idioma, archivo] of Object.entries(IDIOMAS)) {
  const contexto = await navegador.newContext({ locale: idioma === 'es' ? 'es-ES' : 'en-GB' });
  // Sin analítica: el PDF no debe contar como visita
  await contexto.route('https://www.googletagmanager.com/**', (r) => r.abort());
  if (indice > 0) await servirFuentesLocales(contexto, process.argv[indice + 1]);
  await contexto.addInitScript((i) => localStorage.setItem('xesco.idioma', i), idioma);
  const pagina = await contexto.newPage();
  await pagina.goto(`${WEB}/?cv`, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({
    path: join(DESTINO, archivo),
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
  });
  console.log(`${archivo}: ${(statSync(join(DESTINO, archivo)).size / 1024).toFixed(0)} KB`);
  await contexto.close();
}
await navegador.close();
