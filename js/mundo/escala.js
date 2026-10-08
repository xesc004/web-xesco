// Constantes del mundo en unidades de diseño y conversión a píxeles de pantalla.
export const ALTO_MUNDO = 900;
export const Y_SUELO = 780;
export const ANCHO_MUNDO = 18500;
export const ANCHO_MINIMO_VISIBLE = 560;

export function calcularEscala(anchoVentana, altoVentana) {
  return Math.min(altoVentana / ALTO_MUNDO, anchoVentana / ANCHO_MINIMO_VISIBLE);
}

export function anchoVisible(anchoVentana, escala) {
  return anchoVentana / escala;
}
