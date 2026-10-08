// Pantalla de entrada «MUNDO 1-1 · XESCO»: el muñeco se monta pieza a pieza mientras cargan los sprites.
// Está en el HTML para verse desde el primer pintado; si el JS fallara, el CSS la quita sola a los pocos segundos.
const raiz = document.documentElement;
const CLAVE = 'xesco.intro';
// El montaje del muñeco acaba hacia 1,45 s (cuando aparece «XESCO»); se deja un segundo más para verlo entero.
// En las recargas de la misma sesión, algo más breve pero sin cortar el montaje.
const MINIMO = 3100;
const MINIMO_REPETIDA = 2500;

function minimo() {
  try {
    const vista = sessionStorage.getItem(CLAVE) === '1';
    sessionStorage.setItem(CLAVE, '1');
    return vista ? MINIMO_REPETIDA : MINIMO;
  } catch {
    return MINIMO;
  }
}

export function introActiva() {
  return raiz.classList.contains('intro-activa');
}

// Cierra la intro cuando el juego está listo y ha pasado el tiempo mínimo, o antes si se pulsa algo
export function cerrarIntro(listo) {
  const intro = document.getElementById('intro');
  if (!intro || !introActiva()) return Promise.resolve();
  return new Promise((resolver) => {
    let cerrada = false;
    const cerrar = () => {
      if (cerrada) return;
      cerrada = true;
      removeEventListener('keydown', saltar, true);
      removeEventListener('pointerdown', saltar, true);
      raiz.classList.remove('intro-activa');
      intro.classList.add('saliendo');
      const quitar = () => intro.remove();
      intro.addEventListener('animationend', (e) => { if (e.target === intro) quitar(); });
      setTimeout(quitar, 600);
      resolver();
    };
    const saltar = () => listo.then(cerrar);
    addEventListener('keydown', saltar, true);
    addEventListener('pointerdown', saltar, true);
    const espera = minimo() - performance.now();
    Promise.all([listo, new Promise((r) => setTimeout(r, Math.max(0, espera)))]).then(cerrar);
  });
}

// En modo CV (o si el juego no arranca) la intro se quita sin más
export function quitarIntro() {
  raiz.classList.remove('intro-activa');
  document.getElementById('intro')?.remove();
}
