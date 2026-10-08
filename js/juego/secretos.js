// Secretos del nivel: una pieza escondida y el código Konami (modo Kyūbi). Se recuerdan entre visitas.
const CLAVE = 'xesco.secretos';
export const SECRETOS = ['pieza', 'konami'];
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

export function leerSecretos() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return new Set(lista.filter((s) => SECRETOS.includes(s)));
  } catch {
    return new Set();
  }
}

export function guardarSecretos(secretos) {
  try { localStorage.setItem(CLAVE, JSON.stringify([...secretos])); } catch { /* sin almacenamiento */ }
}

// Detector del código Konami (puro): devuelve una función que recibe cada e.code y dice si se acaba de completar.
// Compara las últimas teclas, así «↑↑↑↓↓…» también vale.
export function crearKonami() {
  let ultimas = [];
  return (codigo) => {
    ultimas = [...ultimas, codigo].slice(-KONAMI.length);
    if (ultimas.length < KONAMI.length || ultimas.some((c, i) => c !== KONAMI[i])) return false;
    ultimas = [];
    return true;
  };
}
