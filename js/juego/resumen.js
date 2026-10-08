// Resumen al llegar a la meta: tiempo, piezas, secretos y rango, con botones de contacto, CV en PDF,
// compartir en LinkedIn, tarjeta descargable y «Jugar otra vez».
import { posicionFotograma } from './jugador.js';

const URL_WEB = 'https://xescosolutions.com/';
const TIEMPO_RAPIDO = 60;
const TIEMPO_LENTO = 240;

// Puntuación sobre 100: piezas (60), rapidez (30) y secretos (5 cada uno). Puro, para poder probarlo.
export function calcularRango({ segundos, piezas, total, secretos }) {
  const rapidez = Math.max(0, Math.min(1, (TIEMPO_LENTO - segundos) / (TIEMPO_LENTO - TIEMPO_RAPIDO)));
  const puntos = (total ? piezas / total : 0) * 60 + rapidez * 30 + secretos * 5;
  if (puntos >= 90) return 'S';
  if (puntos >= 75) return 'A';
  if (puntos >= 55) return 'B';
  return 'C';
}

export function formatoTiempo(segundos) {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function texto(id) {
  return document.getElementById(id)?.textContent.trim() ?? '';
}

function rellenar(plantilla, datos) {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => datos[k] ?? '');
}

// Tarjeta de 1200 × 630 (el formato de LinkedIn) con el rango, los datos y el muñeco celebrando
async function dibujarTarjeta(datos, sprites) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 1200;
  lienzo.height = 630;
  const ctx = lienzo.getContext('2d');
  const fondo = ctx.createLinearGradient(0, 0, 1200, 630);
  fondo.addColorStop(0, '#2A3858');
  fondo.addColorStop(1, '#1D2840');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, 1200, 630);
  // Studs de ladrillo en la franja inferior
  ctx.fillStyle = '#F47B20';
  ctx.fillRect(0, 560, 1200, 70);
  for (let x = 20; x < 1200; x += 40) {
    ctx.beginPath();
    ctx.arc(x, 560, 12, Math.PI, 0);
    ctx.fill();
  }
  await document.fonts?.ready;
  const titulos = '600 {t}px Fredoka, "Trebuchet MS", sans-serif';
  const fuente = (t) => titulos.replace('{t}', t);
  ctx.fillStyle = '#FFE2C7';
  ctx.font = fuente(30);
  ctx.fillText(datos.cabecera, 70, 100);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = fuente(64);
  ctx.fillText(datos.titulo, 70, 180);
  ctx.font = fuente(34);
  ctx.fillStyle = '#FFE2C7';
  datos.lineas.forEach((linea, i) => ctx.fillText(linea, 70, 260 + i * 52));
  // Rango
  ctx.fillStyle = '#F47B20';
  ctx.beginPath();
  ctx.arc(1000, 190, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = fuente(170);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(datos.rango, 1000, 200);
  ctx.font = fuente(26);
  ctx.fillText(datos.etiquetaRango, 1000, 345);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = fuente(30);
  ctx.fillText('xescosolutions.com', 70, 520);
  // Muñeco celebrando, sacado de la hoja de sprites
  const hoja = new Image();
  hoja.src = `img/personaje/${sprites.imagen}`;
  await hoja.decode().catch(() => {});
  if (hoja.naturalWidth) {
    const a = sprites.animaciones.celebrar;
    const escalaHoja = hoja.naturalWidth / (sprites.columnas * sprites.fotograma);
    const [x, y] = posicionFotograma(sprites, a.inicio + 1).split(' ').map((v) => -parseFloat(v) * escalaHoja);
    const lado = sprites.fotograma * escalaHoja;
    ctx.drawImage(hoja, x, y, lado, lado, 560, 250, 320, 320);
  }
  return new Promise((resolver) => lienzo.toBlob(resolver, 'image/png'));
}

export function crearResumen({ sprites, alContactar, alJugarOtraVez, alAbrir, alCerrar }) {
  const dialogo = document.getElementById('resumen');
  const aviso = dialogo.querySelector('.resumen-aviso');
  let datos = null;

  function avisar(mensaje) {
    aviso.textContent = mensaje;
    aviso.hidden = false;
  }

  dialogo.addEventListener('close', () => alCerrar());
  dialogo.querySelector('.resumen-cerrar').addEventListener('click', () => dialogo.close());
  // Clic en el fondo oscuro: cierra
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  document.getElementById('resumen-contacto').addEventListener('click', () => {
    dialogo.close();
    alContactar();
  });
  document.getElementById('resumen-otra').addEventListener('click', () => {
    dialogo.close();
    alJugarOtraVez();
  });

  function textoCompartir() {
    return rellenar(texto('resumen-texto-compartir'), {
      rango: datos.rango, tiempo: formatoTiempo(datos.segundos), piezas: datos.piezas, total: datos.total,
    }) + ` ${URL_WEB}`;
  }

  document.getElementById('resumen-linkedin').addEventListener('click', async () => {
    // LinkedIn solo acepta la URL: el texto se copia para pegarlo en la publicación
    try {
      await navigator.clipboard.writeText(textoCompartir());
      avisar(texto('resumen-copiado'));
    } catch { /* sin portapapeles: se comparte solo el enlace */ }
    open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(URL_WEB)}`, '_blank', 'noopener');
  });

  document.getElementById('resumen-tarjeta').addEventListener('click', async () => {
    const blob = await dibujarTarjeta({
      cabecera: texto('resumen-tarjeta-cabecera'),
      titulo: texto('resumen-titulo'),
      lineas: [
        `${texto('resumen-etiqueta-tiempo')}: ${formatoTiempo(datos.segundos)}`,
        `${texto('resumen-etiqueta-piezas')}: ${datos.piezas}/${datos.total}`,
        `${texto('resumen-etiqueta-secretos')}: ${datos.secretos}/${datos.totalSecretos}`,
      ],
      rango: datos.rango,
      etiquetaRango: texto('resumen-etiqueta-rango'),
    }, sprites);
    if (!blob) return;
    const archivo = new File([blob], `xesco-rango-${datos.rango}.png`, { type: 'image/png' });
    // En el móvil se abre el menú de compartir (LinkedIn incluido); en escritorio se descarga
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], text: textoCompartir() });
        return;
      } catch { /* cancelado: se descarga */ }
    }
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = archivo.name;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  });

  return {
    abierto: () => dialogo.open,
    mostrar(d) {
      datos = { ...d, rango: calcularRango(d) };
      document.getElementById('resumen-tiempo').textContent = formatoTiempo(d.segundos);
      document.getElementById('resumen-piezas').textContent = `${d.piezas}/${d.total}`;
      document.getElementById('resumen-secretos').textContent = `${d.secretos}/${d.totalSecretos}`;
      const letra = document.getElementById('resumen-letra');
      letra.textContent = datos.rango;
      letra.dataset.rango = datos.rango;
      document.querySelectorAll('[data-comentario-rango]').forEach((p) => {
        p.hidden = p.dataset.comentarioRango !== datos.rango;
      });
      aviso.hidden = true;
      alAbrir();
      dialogo.showModal();
    },
  };
}
