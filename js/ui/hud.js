// Barra superior del juego: minimapa (viajes y progreso), contador de piezas y sonido.
export function crearHud({ alViajar, alSonido, sonidoInicial }) {
  const botonesZona = [...document.querySelectorAll('.minimapa [data-ir]')];
  const etiqueta = document.querySelector('.minimapa-zona');
  const marcador = document.querySelector('.minimapa-marcador');
  const contador = document.getElementById('contador-piezas');
  const botonSonido = document.getElementById('boton-sonido');
  let ultimoProgreso = -1;

  const soltarFoco = (e) => { if (e.detail > 0) e.currentTarget.blur(); };

  botonesZona.forEach((boton) => boton.addEventListener('click', (e) => {
    alViajar(boton.dataset.ir);
    soltarFoco(e);
  }));
  botonSonido.setAttribute('aria-pressed', String(sonidoInicial));
  botonSonido.addEventListener('click', (e) => {
    botonSonido.setAttribute('aria-pressed', String(alSonido()));
    soltarFoco(e);
  });

  function rotularActual() {
    const actual = botonesZona.find((b) => b.classList.contains('actual'));
    if (actual) etiqueta.textContent = actual.textContent.trim();
  }
  document.addEventListener('idioma', rotularActual);

  return {
    zona(id) {
      const actual = botonesZona.find((b) => b.dataset.ir === id);
      if (!actual) return;
      botonesZona.forEach((b) => b.classList.toggle('actual', b === actual));
      actual.classList.add('visitada');
      rotularActual();
    },
    progreso(p) {
      const valor = Math.round(Math.max(0, Math.min(1, p)) * 1000) / 10;
      if (valor === ultimoProgreso) return;
      ultimoProgreso = valor;
      marcador.style.left = `calc(${valor}% - 5px)`;
    },
    piezas(n, total) {
      contador.textContent = `${n}/${total}`;
    },
  };
}
