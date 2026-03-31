# Xesco Alabau — Sitio Web Personal

Sitio web profesional para **Francisco Alabau Calatayud (Xesco Alabau)**.
Stack: HTML5 · CSS3 · JavaScript Vanilla · Tailwind CSS CDN · AOS

---

## Estructura del proyecto

```
webXesco/
├── index.html          ← Página principal
├── css/
│   └── style.css       ← Estilos personalizados (variables, animaciones, componentes)
├── js/
│   └── main.js         ← Lógica: navbar, menú móvil, formulario, AOS
├── vercel.json         ← Configuración de despliegue en Vercel
├── netlify.toml        ← Configuración de despliegue en Netlify
└── README.md           ← Este archivo
```

---

## Despliegue gratuito

### Opción A — Vercel (recomendado)

1. Crea una cuenta gratuita en [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. En "Framework Preset" selecciona **Other**
4. Haz clic en **Deploy** → listo en ~30 segundos

O vía CLI:
```bash
npm i -g vercel
vercel --prod
```

---

### Opción B — Netlify

1. Ve a [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Selecciona tu repositorio
3. Build command: **(vacío)**
4. Publish directory: `.`
5. Deploy

O arrastra la carpeta `webXesco/` a [app.netlify.com/drop](https://app.netlify.com/drop) para deploy instantáneo.

---

### Opción C — GitHub Pages

1. Sube el proyecto a un repositorio de GitHub
2. Ve a **Settings → Pages**
3. Source: `main` branch, carpeta `/` (root)
4. Tu web estará en `https://usuario.github.io/repositorio`

---

## Conectar dominio personalizado

### Vercel
1. Ve a tu proyecto → **Settings → Domains**
2. Añade tu dominio (ej. `xescoalabau.com`)
3. Añade los registros DNS que te indica Vercel en tu proveedor de dominio

### Netlify
1. Ve a **Domain settings → Add custom domain**
2. Sigue las instrucciones de DNS

---

## Activar el formulario de contacto (Formspree)

1. Crea cuenta gratuita en [formspree.io](https://formspree.io) (hasta 50 envíos/mes gratis)
2. Crea un nuevo formulario y copia tu **Form ID** (formato: `xyzabcde`)
3. En `index.html`, busca la línea:
   ```html
   action="https://formspree.io/f/YOUR_FORM_ID"
   ```
4. Sustituye `YOUR_FORM_ID` por tu ID real
5. Guarda y redespliega

> **Mientras no esté configurado:** el botón de envío abrirá automáticamente el cliente de email con los datos prellenados.

---

## Personalizar contenido fácilmente

### Datos de contacto
Busca y reemplaza en `index.html`:
- `+34 658 240 032` → tu número
- `xescoalabaucalatayud2@gmail.com` → tu email
- `francisco-alabau-calatayud` → tu slug de LinkedIn

### Estadísticas del hero ("+50 proyectos", etc.)
Busca `<!-- Stats de confianza -->` en `index.html`

### Testimonios
Busca `<!-- Testimonio 1 -->` — reemplaza con datos reales de clientes

### Colores
En `css/style.css`, modifica las variables en `:root`:
```css
--primary:       #6366f1;   /* Color principal */
--primary-light: #818cf8;   /* Variante clara */
--accent:        #38bdf8;   /* Acento azul */
```

### Servicios / Casos de uso / Proceso
Cada sección está claramente comentada en el HTML con `<!-- SERVICIOS -->`, etc.

---

## Recursos utilizados (100% gratuitos)

| Recurso | URL |
|---|---|
| Tailwind CSS CDN | cdn.tailwindcss.com |
| AOS (animaciones) | unpkg.com/aos@2.3.4 |
| Google Fonts – Inter | fonts.google.com |
| Iconos SVG inline | Lucide Icons (sin dependencia) |
| Formulario | Formspree (gratis hasta 50/mes) |

---

## SEO

El `<head>` incluye:
- Meta description y keywords
- Open Graph (og:title, og:description, og:type)
- Twitter Card
- `<link rel="canonical">`

Actualiza la URL canónica en `index.html`:
```html
<link rel="canonical" href="https://TU-DOMINIO.com/" />
```

---

## Soporte y contacto

- **Xesco Alabau** — [xescoalabaucalatayud2@gmail.com](mailto:xescoalabaucalatayud2@gmail.com)
- LinkedIn: [Francisco Alabau Calatayud](https://www.linkedin.com/in/francisco-alabau-calatayud)
- WhatsApp: [+34 658 240 032](https://wa.me/34658240032)
