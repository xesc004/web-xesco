# Portfolio de Xesco: el nivel de la aldea

Fecha: 2026-10-08 · Estado: aprobado en conversación, pendiente de revisión escrita

## 1. Objetivo

Un portfolio profesional y memorable para Francisco Alabau Calatayud (Xesco) que funciona como un nivel de
plataformas 2D con desplazamiento horizontal. Su minifigura de bloques (modelada en Blender, ver
`minifigura/`) recorre el portfolio de izquierda a derecha saltando sobre los propios bloques de contenido
(textos, foto, capturas de las apps). El fondo es una ilustración propia inspirada en la Aldea Oculta de la
Hoja que se mueve en parallax según avanza el nivel.

Debe servir a dos públicos a la vez:

- Quien quiere jugar y descubrir el contenido de forma lúdica.
- Quien tiene prisa (reclutadores, profesorado, clientes): encuentra todo el contenido en un clic con el
  modo «CV rápido».

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Enfoque técnico | HTML real + motor de física propio en JavaScript, sin frameworks ni paso de compilación |
| Fondo | Ilustración propia en SVG inspirada en Konoha; sin arte oficial de Naruto ni su emblema |
| Marca | Sin nombre ni logo de LEGO; estilo «figura de bloques». Sin recursos de Nintendo |
| Móvil | Mismo juego con controles táctiles + botón «Ver CV rápido» visible en todos los dispositivos |
| Idiomas | Español (por defecto, en el HTML) e inglés (`i18n/en.json`) |
| Foto real | Sí, en la zona Perfil |
| Personaje | Sprites renderizados desde el modelo de Blender en vista de tres cuartos |
| Despliegue | Igual que hoy: sitio estático en la raíz del repo `web-xesco` (Cloudflare/Vercel); se conservan Google Analytics (`G-7QXF2EDSVY`), el dominio canónico `xescoalabau.com` y el formulario Web3Forms con su `access_key` actual |

## 3. Experiencia

### 3.1 Estructura del nivel

Un único mundo horizontal de unas 16 000 unidades de ancho y 900 de alto (unidades de diseño, ver §6.2).
El suelo es una franja de placas de bloques. Cada zona es una `<section data-zona>` con su bandera de
control al entrar.

| # | Zona | Contenido | Mecánica / decorado |
|---|---|---|---|
| 0 | Inicio | Nombre, titular «Estudiante de Ingeniería Informática», subtítulo «Desarrollo de software con IA · Automatización · Apps», pista de controles | Las letras del nombre son bloques sobre los que se puede saltar. El muñeco saluda al empezar |
| 1 | Perfil | Foto real enmarcada + texto de perfil del CV | La placa de la foto y la del texto son plataformas |
| 2 | Formación | Grado en Ingeniería Informática (UPV, Campus d'Alcoi, en 3.º) y FP Superior DAM (CEU, finalizado) | Dos plataformas en escalera ascendente |
| 3 | Experiencia | Prácticas en Premea (software para automatizar la generación de documentos) y atención al público en Delaware (EE. UU.) durante un verano | Dos plataformas a distinta altura |
| 4 | Proyectos | Cuatro subzonas, una por app (§4.2) | El icono de cada app es un bloque sorpresa: al golpearlo desde abajo se despliega su ficha |
| 4a | Aldiax | | El robot mascota saluda al acercarse |
| 4b | Yunque | | El yunque es plataforma; al aterrizar suena «clang» y suelta chispas |
| 4c | ChatADN | | Bocadillos de chat flotantes (estáticos) que sirven de plataformas |
| 4d | Una Neurona | | La neurona hace de cama elástica (rebote alto) |
| 5 | Habilidades | 7 habilidades con nivel (§4.3) | Cada habilidad es una torre de ladrillos de altura = nivel: gráfica de barras escalable |
| 6 | Metodología | Texto de metodología del CV | Al entrar, el muñeco lanza clones de sombra (orquestador → subagentes) que salen corriendo y se desvanecen |
| 7 | Charlas | Ponencia en el IES San Vicente Ferrer y aprendizaje en eventos | Escenario con atril y carteles |
| 8 | Idiomas y más | Español, valenciano, inglés; carnet B; disponibilidad para charlas | Banderas y un coche de bloques |
| 9 | Meta: contacto | Teléfono, email, WhatsApp, LinkedIn, GitHub y formulario | Puesto de ramen: el formulario es «tu pedido». Bandera de meta con celebración y recuento de piezas |

### 3.2 Controles y mecánicas

- **Teclado:** ← → o A D para andar; Espacio, ↑ o W para saltar (salto variable: más alto si se mantiene);
  ↓ o S sobre una plataforma de un sentido para bajarse.
- **Ratón / dedo sobre el muñeco:** al pulsarlo se coge; cuelga y se balancea siguiendo el puntero; al
  soltarlo sale lanzado con la velocidad del gesto (limitada).
- **Rueda del ratón / trackpad:** el muñeco corre automáticamente en la dirección del desplazamiento mientras
  dure el gesto.
- **Táctil (móvil y tableta):** botones ◀ ▶ abajo a la izquierda y botón de salto abajo a la derecha.
- **Plataformas de un sentido:** todos los bloques de contenido se atraviesan desde abajo y se aterriza
  encima; nunca bloquean el paso. Solo el suelo y algunos elementos de decorado son sólidos.
- **Sensación de juego:** margen de salto tras salir de un borde (0,1 s), salto memorizado si se pulsa justo
  antes de aterrizar (0,12 s), control reducido en el aire.
- **Piezas:** piezas de bloque coleccionables repartidas por el nivel; contador en la barra superior; en la meta
  se muestra «Has encontrado X de Y».
- **Bloques sorpresa:** golpe desde abajo → animación de rebote y despliegue de la ficha asociada (botón
  accesible con `aria-expanded`; también se abre con clic o teclado).
- **Banderas de control:** al entrar en cada zona se despliega su bandera y se marca en el minimapa.

### 3.3 Barra superior (HUD)

Minimapa con las zonas (clic → el muñeco «viaja» a esa zona con una nube de humo), contador de piezas,
selector ES/EN, sonido (apagado por defecto) y botón «Ver CV rápido».

### 3.4 Modo «CV rápido»

El mismo HTML recolocado en vertical con CSS (`html.cv`): sin fondo, muñeco, piezas ni controles. Se activa con
el botón, con `?cv` en la URL y automáticamente si el juego no puede arrancar. Incluye estilos de impresión.
Un botón «Volver al nivel» regresa al juego en la misma zona.

### 3.5 Accesibilidad

- Todo el contenido es HTML real: lectores de pantalla y buscadores lo leen.
- Al tabular por enlaces y botones, la cámara viaja hasta el elemento enfocado.
- Con `prefers-reduced-motion`: sin parallax, sin sacudidas ni clones; el resto funciona.
- Contraste AA en todos los textos; los botones táctiles miden al menos 48 px.
- Enlace «Saltar al CV» al principio del documento.

### 3.6 Sonido

Efectos sintetizados con Web Audio (salto, pieza, golpe, «clang», rebote): sin archivos ni licencias.
Apagado por defecto; la preferencia se recuerda. Sin música.

## 4. Contenido

### 4.1 Textos

El texto en español sale del CV (perfil, formación, experiencia, metodología, charlas, idiomas, otros datos)
con una revisión de estilo ligera. El inglés lo traduce el implementador.

### 4.2 Proyectos

Cada ficha: icono real, nombre, una frase, tres puntos clave, 2–3 capturas, tecnología y botón de App Store.
Material en las carpetas locales (solo lectura; nunca `.env`, credenciales ni tokens).

| App | Qué es | Puntos clave | Tecnología | App Store | Material |
|---|---|---|---|---|---|
| Aldiax | Aprende a usar la IA con ejercicios cortos al estilo Duolingo | Un agente renueva cada día las noticias de IA y crea niveles a partir de ellas; vocabulario de IA; 100 niveles gratis; disponible en 4 idiomas | Expo / React Native, Supabase, Edge Functions con IA, corrección en servidor | `id6801093580` | `C:\dev\aldiax\video\assets\` (icono y pantallas), `video/horizontal/assets/pantallas/` |
| Yunque | Hábitos para subir la testosterona de forma natural | Versión gratis y de pago; widgets de pantalla de inicio; todo en el dispositivo, sin cuentas | Expo / React Native, SQLite + Drizzle, HealthKit | `id6808992256` | `C:\dev\yunque\assets\icon.png`, `C:\dev\yunque-app-store-captures\yunque-app-store-export.zip` |
| ChatADN | Convierte un chat exportado de WhatsApp en una historia visual | Mensajes, tiempos de respuesta, palabras y emojis; análisis 100 % local, sin servidores; compra Pro única | Expo / React Native, RevenueCat | `id6817065918` | `C:\Users\xesco\ChatADN\mobile\assets\images\icon.png`, `mobile/store-screenshots/exports/` |
| Una Neurona | Juego de fiesta para descubrir quién es el más tonto del grupo | 100 minijuegos en 12 categorías, 5 al azar por partida; salas de hasta 8 jugadores; IQ de broma; gratis con anuncios o pago único para quitarlos | Expo / React Native (monorepo), Supabase en tiempo real, AdMob | `id6818739554` | `C:\Users\xesco\Lumiq\brand\originals\`, `store/listing/es-ES.json`, `store/promo/out/` |

Antes de publicar se comprueba que cada enlace `https://apps.apple.com/es/app/id<ID>` está vivo. Si una app
aún no está publicada (ChatADN estaba en revisión el 2026-10-05), su botón dice «Próximamente en App Store»
y no enlaza.

### 4.3 Habilidades (nivel sobre 7, del CV)

| Habilidad | Nivel |
|---|---|
| Agentes de IA para desarrollo de software | 6 |
| Automatización de procesos | 6 |
| Prompt engineering | 6 |
| Desarrollo de apps | 5 |
| Arquitectura de agentes / orquestación | 5 |
| Despliegue de productos digitales | 5 |
| Programación (Python, Java, C/C++, JavaScript/TypeScript) | 4 |

### 4.4 Contacto

+34 658 240 032 (teléfono y WhatsApp), xescoalabaucalatayud2@gmail.com, LinkedIn
`https://www.linkedin.com/in/francisco-alabau-calatayud-329196330/`, GitHub `https://github.com/xesc004` y el
formulario Web3Forms actual (mismo `access_key`, asunto y lógica de envío de `js/main.js`).

## 5. Dirección visual

- **Paleta:** naranja `#F47B20` (principal, el de su sudadera y su CV), naranja oscuro `#C85A0E`, azul marino
  `#1D2840`, crema `#FFF6EC`, madera `#8B5A2B`, verde hoja `#5E9E3F`, texto `#1D2030`. Cielo que interpola
  mañana `#A9DCF5` → mediodía `#6EC1F0` → atardecer `#F7A35C` según el progreso.
- **Tipografía:** Fredoka para títulos (redondeada, de juguete) e Inter para el texto; ambas de Google Fonts.
- **Plataformas de contenido:** placas color crema con fila de «studs» en el borde superior, canto inferior más
  oscuro y sombra suave. Texto oscuro sobre crema.
- **Fondo (4 capas SVG propias, parallax 0,1 / 0,25 / 0,5 / 0,8):**
  1. Cielo (degradado CSS animado por variables) con nubes.
  2. Montaña con cuatro rostros tallados al estilo minifigura; uno es el de Xesco.
  3. Aldea: tejados rojos de estilo japonés, depósito de agua redondo con un símbolo propio (un ladrillo),
     farolillos y cables.
  4. Primer plano: árboles de copa redonda y vallas de madera.
- **Muñeco:** unos 150 unidades de alto. Animaciones: parado (mirando a cámara, leve respiración), saludar (al
  empezar), giro, andar (8 fotogramas), saltar, caer, aterrizar, colgado (piernas balanceándose) y celebrar.

## 6. Arquitectura técnica

### 6.1 Estructura de archivos

```
index.html            contenido (ES) + estructura de zonas, HUD y controles táctiles
css/base.css          tokens, tipografía, reset
css/nivel.css         mundo, zonas, placas, objetos, fondo
css/hud.css           barra superior, minimapa, controles táctiles
css/cv.css            modo CV rápido e impresión
js/main.js            arranque y orquestación
js/motor/bucle.js     bucle de paso fijo (120 Hz) con pausa al ocultar la pestaña
js/motor/fisica.js    física y colisiones (funciones puras)
js/motor/entrada.js   teclado, táctil y rueda → estado de entrada
js/mundo/escala.js    escala diseño ↔ pantalla
js/mundo/plataformas.js  mide el HTML y devuelve colisionadores
js/mundo/fondo.js     parallax y color del cielo
js/juego/jugador.js   estados y animación del muñeco
js/juego/arrastre.js  coger y lanzar con puntero
js/juego/camara.js    seguimiento y viajes
js/juego/objetos.js   piezas, bloques sorpresa, yunque, neurona, clones, meta
js/ui/hud.js          minimapa, contador, sonido, idioma, CV
js/ui/i18n.js         cambio de idioma
js/ui/cv-rapido.js    modo CV rápido
js/ui/contacto.js     envío del formulario (lógica actual de js/main.js)
js/ui/sonido.js       efectos con Web Audio
i18n/en.json          textos en inglés
img/personaje/        hoja de sprites (WebP) + sprites.json
img/fondo/            capas SVG
img/apps/<app>/       icono y capturas (WebP)
img/foto/             foto recortada (WebP)
tests/                tests de la física (node --test)
minifigura/scripts/   generación del modelo y de los sprites (no se publica nada pesado)
```

### 6.2 Escala y coordenadas

El mundo se diseña con 900 unidades de alto. `escala = altoDeVentana / 900`. El contenedor `#mundo` se dibuja
con `transform: translate3d(-camX·escala, 0, 0) scale(escala)`, de modo que la física, las medidas y las
posiciones trabajan siempre en unidades de diseño, independientes de la pantalla.

### 6.3 Módulos e interfaces

- `fisica.js`: `crearCuerpo({x, y, w, h})`; `paso(cuerpo, entrada, colisionadores, dt)` → eventos
  (`aterriza`, `golpeaTecho(id)`, `rebota(id)`). Constantes iniciales (ajustables): gravedad 2600 u/s²,
  velocidad máxima 380 u/s, aceleración 2400 u/s², frenado 3000 u/s², control aéreo 0,6, salto 980 u/s
  (≈185 u de altura), corte de salto ×0,45, caída máxima 1400 u/s.
- `plataformas.js`: `medir(mundoEl)` → `[{id, x, y, w, h, tipo}]`, con `tipo ∈ {unSentido, solido, elastico,
  sorpresa}` leído de atributos `data-plataforma`. Se vuelve a medir tras cargar fuentes e imágenes, al
  redimensionar y al cambiar de idioma.
- `bucle.js`: `iniciar(actualizar, dibujar)` con acumulador de paso fijo.
- `entrada.js`: `leer()` → `{izquierda, derecha, saltar, soltarSalto, bajar}`.
- `jugador.js`: máquina de estados `parado | andando | saltando | cayendo | colgado | celebrando`; elige
  fotograma y orientación.
- `camara.js`: `seguir(x, dt)` con suavizado y adelanto; `viajarA(x)`; límites del mundo.
- `objetos.js`: reacciona a los eventos de la física y a la posición del jugador.
- `hud.js`, `i18n.js`, `cv-rapido.js`, `contacto.js`, `sonido.js`: interfaz de usuario, independientes del motor.

### 6.4 Flujo de datos

HTML → `plataformas.medir` → colisionadores → en cada paso: `entrada.leer` → `fisica.paso` → eventos →
`objetos` y `jugador` → `camara.seguir` → dibujo (transformaciones del mundo, el muñeco y las capas del
fondo). Los cambios de maquetación (fichas desplegadas, idioma) disparan una nueva medición.

## 7. Producción de recursos

- **Sprites (`minifigura/scripts/mf_sprites.py`):** sobre `minifigura_xesco.blend`, añade pivotes en cadera y
  hombros, anima piernas y brazos por rotación, renderiza cada animación con cámara ortográfica en tres
  cuartos y fondo transparente (320×320 por fotograma, se muestra a 160) y las empaqueta en una hoja WebP con
  `sprites.json` (`{fotograma: {w, h}, animaciones: {nombre: {inicio, n, fps, bucle}}}`). Para mirar a la
  izquierda se refleja la imagen.
- **Fondo:** SVG escritos a mano, ligeros (objetivo < 150 KB en total).
- **Apps y foto:** iconos a 256 px y capturas a 640 px de alto en WebP; foto recortada en círculo.
- **Git:** se ignoran `material/`, `minifigura/*.blend*`, `minifigura/renders/` y `minifigura/referencia/`,
  para que el material de trabajo no se publique.

## 8. Errores y casos límite

- Si falla la carga del juego (sprites, error de script), se activa el modo CV rápido.
- Sin JavaScript (`<noscript>`), el contenido se ve en modo CV rápido.
- Las fichas desplegadas o el cambio de idioma vuelven a medir las plataformas; si el muñeco queda dentro de
  un bloque sólido, se recoloca encima.
- Si el muñeco cae fuera del mundo o queda atascado, reaparece en la última bandera de control.
- Formulario: si Web3Forms falla, se mantiene el aviso actual con el email.
- Pestaña oculta: el bucle se pausa y al volver no se acumula tiempo.

## 9. Rendimiento

- Carga inicial < 2,5 MB; capturas con carga diferida al acercarse a su zona.
- Solo se animan `transform` y `opacity`; nada de medir el DOM dentro del bucle.
- 60 fps objetivo en un portátil medio y en un móvil de gama media.

## 10. Pruebas

- **Unitarias (`node --test`, sin dependencias):** aterrizar en plataforma de un sentido, atravesarla desde
  abajo, bajarse con ↓, choque lateral con sólidos, margen de salto, salto memorizado, rebote elástico,
  límites de cámara.
- **En navegador (panel integrado):** recorrido completo a 1440×900 y 390×844; teclado, arrastre, táctil,
  rueda, minimapa, bloques sorpresa, CV rápido, ES/EN, envío de formulario de prueba solo si el usuario lo
  autoriza; consola sin errores.

## 11. Fuera de alcance

Música, más niveles, guardado de partida (salvo idioma, sonido y piezas recogidas en `localStorage`),
clasificaciones, versión 3D en el navegador, CMS o blog, vídeos de las apps (se usan capturas).

## 12. Criterios de aceptación

1. En escritorio el nivel se completa de principio a fin solo con teclado, y todo el contenido es alcanzable.
2. El muñeco se puede coger, balancear y lanzar con el ratón; en móvil, con el dedo.
3. En móvil los controles táctiles funcionan y «Ver CV rápido» está a un toque.
4. El modo CV rápido muestra todo el contenido en vertical y se imprime bien.
5. ES/EN cambia todos los textos y el nivel sigue siendo jugable tras el cambio.
6. Los cuatro proyectos muestran icono real, capturas y su enlace de App Store verificado (o «Próximamente»).
7. El formulario envía a Web3Forms con la configuración actual; GA y el dominio canónico se conservan.
8. Sin errores en consola; carga inicial < 2,5 MB.
