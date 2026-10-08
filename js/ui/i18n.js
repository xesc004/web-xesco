// Cambio de idioma: el español vive en el HTML; el inglés se carga de i18n/en.json.
const CLAVE = 'xesco.idioma';
let espanol = null;
let ingles = null;

function paresAtributo(nodo) {
  return nodo.dataset.i18nAttr.split(';').map((par) => par.split(':').map((s) => s.trim()));
}

function capturarEspanol() {
  espanol = {};
  document.querySelectorAll('[data-i18n]').forEach((n) => { espanol[n.dataset.i18n] = n.textContent; });
  document.querySelectorAll('[data-i18n-attr]').forEach((n) => {
    for (const [atributo, clave] of paresAtributo(n)) espanol[clave] = n.getAttribute(atributo) ?? '';
  });
}

export function idiomaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'es' || guardado === 'en') return guardado;
  } catch { /* sin almacenamiento */ }
  return /^(es|ca|gl|eu)\b/i.test(navigator.language || 'es') ? 'es' : 'en';
}

export function idiomaActual() {
  return document.documentElement.lang === 'en' ? 'en' : 'es';
}

export async function aplicarIdioma(idioma) {
  if (!espanol) capturarEspanol();
  let textos = espanol;
  if (idioma === 'en') {
    if (!ingles) {
      const respuesta = await fetch('i18n/en.json');
      if (!respuesta.ok) throw new Error('No se pudo cargar i18n/en.json');
      ingles = await respuesta.json();
    }
    textos = ingles;
  }
  document.querySelectorAll('[data-i18n]').forEach((n) => {
    const t = textos[n.dataset.i18n];
    if (t != null) n.textContent = t;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((n) => {
    for (const [atributo, clave] of paresAtributo(n)) {
      const t = textos[clave];
      if (t != null) n.setAttribute(atributo, t);
    }
  });
  document.documentElement.lang = idioma;
  try { localStorage.setItem(CLAVE, idioma); } catch { /* sin almacenamiento */ }
  document.dispatchEvent(new CustomEvent('idioma', { detail: idioma }));
}
