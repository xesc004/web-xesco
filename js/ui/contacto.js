// Envío del formulario de contacto a Web3Forms.
export function activarFormulario(form) {
  const exito = form.querySelector('.form-exito');
  const boton = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = boton.textContent;
    boton.disabled = true;
    boton.textContent = '…';
    try {
      const respuesta = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const datos = await respuesta.json();
      if (!datos.success) throw new Error(datos.message || 'Error en el servidor');
      form.reset();
      exito.hidden = false;
    } catch {
      alert(form.dataset.error);
    } finally {
      boton.disabled = false;
      boton.textContent = texto;
    }
  });
}
