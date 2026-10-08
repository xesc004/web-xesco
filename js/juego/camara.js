// Cámara horizontal: sigue al muñeco con suavizado y adelanto, sin salirse del mundo.
export function crearCamara() {
  return { x: 0 };
}

export function limitarCamara(x, anchoVisible, anchoMundo) {
  return Math.max(0, Math.min(Math.max(0, anchoMundo - anchoVisible), x));
}

export function seguirCamara(cam, centroJugador, mirando, anchoVisible, anchoMundo, dt) {
  const deseado = centroJugador - anchoVisible * 0.4 + mirando * anchoVisible * 0.1;
  cam.x += (deseado - cam.x) * Math.min(1, dt * 5);
  cam.x = limitarCamara(cam.x, anchoVisible, anchoMundo);
  return cam;
}

export function centrarCamara(cam, centroJugador, anchoVisible, anchoMundo) {
  cam.x = limitarCamara(centroJugador - anchoVisible * 0.4, anchoVisible, anchoMundo);
  return cam;
}
