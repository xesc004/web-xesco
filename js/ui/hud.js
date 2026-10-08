// Barra superior del juego: minimapa (viajes y progreso), contador de piezas y sonido.
export function crearHud({ alViajar, alSonido, sonidoInicial }) {
  const botonesZona = [...document.querySelectorAll('.minimapa [data-ir]')];
  const etiqueta = document.querySelector('.minimapa-zona');
  const marcador = document.querySelector('.minimapa-marcador');
  const contador = document.getElementById('contador-piezas');
  const botonSonido = document.getElementById('boton-sonido');
  const minimapa = document.querySelector('.minimapa');
  const abrirMapa = document.querySelector('.minimapa-abrir');
  const zonaMovil = document.querySelector('.minimapa-abrir-zona');
  let ultimoProgreso = -1;

  // Desplegable de zonas en móvil (en escritorio el botón está oculto y los puntos se ven siempre)
  function desplegar(abierto) {
    minimapa.classList.toggle('abierto', abierto);
    abrirMapa.setAttribute('aria-expanded', String(abierto));
  }
  abrirMapa.addEventListener('click', () => desplegar(!minimapa.classList.contains('abierto')));
  document.addEventListener('pointerdown', (e) => { if (!minimapa.contains(e.target)) desplegar(false); });
  minimapa.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && minimapa.classList.contains('abierto')) {
      desplegar(false);
      abrirMapa.focus();
    }
  });

  const soltarFoco = (e) => { if (e.detail > 0) e.currentTarget.blur(); };

  botonesZona.forEach((boton) => boton.addEventListener('click', (e) => {
    alViajar(boton.dataset.ir);
    desplegar(false);
    soltarFoco(e);
  }));
  botonSonido.setAttribute('aria-pressed', String(sonidoInicial));
  botonSonido.addEventListener('click', (e) => {
    botonSonido.setAttribute('aria-pressed', String(alSonido()));
    soltarFoco(e);
  });

  function rotularActual() {
    const actual = botonesZona.find((b) => b.classList.contains('actual'));
    if (!actual) return;
    etiqueta.textContent = actual.textContent.trim();
    zonaMovil.textContent = actual.textContent.trim();
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
      minimapa.style.setProperty('--progreso', String(valor / 100));
    },
    piezas(n, total) {
      contador.textContent = `${n}/${total}`;
    },
  };
}
