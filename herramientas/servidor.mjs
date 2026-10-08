// Servidor estático para desarrollo: node herramientas/servidor.mjs (PORT opcional, por defecto 8080).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const RAIZ = process.cwd();
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};
const puerto = Number(process.env.PORT || 8080);

createServer(async (peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
  const fichero = normalize(join(RAIZ, ruta.endsWith('/') ? `${ruta}index.html` : ruta));
  if (!fichero.startsWith(RAIZ)) {
    respuesta.writeHead(403).end();
    return;
  }
  try {
    const datos = await readFile(fichero);
    respuesta.writeHead(200, { 'Content-Type': TIPOS[extname(fichero)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    respuesta.end(datos);
  } catch {
    respuesta.writeHead(404).end('No encontrado');
  }
}).listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));
