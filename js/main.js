/* ============================================================
   XESCO ALABAU — main.js
   Funcionalidades: navbar scroll, menú móvil, formulario, AOS
   ============================================================ */

/* ─── Inicializar AOS ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({
    duration: 680,
    once: true,
    offset: 70,
    easing: 'ease-out-cubic',
  });

  initNavbar();
  initMobileMenu();
  initContactForm();
  initSmoothScroll();
  initScrollProgress();
});

/* ─── Navbar: efecto al hacer scroll ─────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const update = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', update, { passive: true });
  update(); // on load
}

/* ─── Menú móvil ─────────────────────────────────────────── */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  const close  = document.getElementById('menu-close');

  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeMobileMenu = () => {
    menu.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', open);
  if (close) close.addEventListener('click', window.closeMobileMenu);

  // Cerrar al pulsar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeMobileMenu();
  });
}

/* ─── Smooth scroll para anclas ─────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─── Barra de progreso de scroll ───────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  const update = () => {
    const scrolled = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
}

/* ─── Formulario de contacto ─────────────────────────────── */
function initContactForm() {
  const form        = document.getElementById('contact-form');
  const successMsg  = document.getElementById('form-success');
  const submitBtn   = document.getElementById('submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';
    }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        form.style.display = 'none';
        if (successMsg) successMsg.classList.add('visible');
      } else {
        throw new Error(data.message || 'Error en el servidor');
      }
    } catch {
      alert('Hubo un error al enviar el mensaje. Por favor, escríbeme directamente a xescoalabaucalatayud2@gmail.com');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar mensaje';
      }
    }
  });
}
