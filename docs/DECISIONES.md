# Decisiones

Registro de decisiones del hub de XASKA: fecha, decisión, motivo y alternativa descartada.

## 2026-10-24 — Fase 0

### Hosting: Cloudflare Workers con assets estáticos (no Pages)

- **Decisión:** desplegar en Cloudflare Workers con assets estáticos (`wrangler.jsonc`).
- **Motivo:** la guía oficial de Astro para Cloudflare dice hoy que "Cloudflare recomienda usar Cloudflare Workers para proyectos nuevos" y deja Pages para proyectos existentes. Workers con assets soporta igual `_headers`, `_redirects` y una página 404 propia (`not_found_handling: "404-page"`). En la fase 2 el formulario será un Worker en el mismo proyecto.
- **Descartado:** Cloudflare Pages con Pages Functions (sigue funcionando, pero ya no es lo recomendado para proyectos nuevos).

### Versiones (fijadas exactas, sin `^` ni `~`)

| Paquete                         | Versión | Nota                                                     |
| ------------------------------- | ------- | -------------------------------------------------------- |
| Node                            | 24.22.1 | `.nvmrc` y `engines`                                     |
| pnpm                            | 12.15.0 | `packageManager`                                         |
| astro                           | 7.4.2   | estable actual; exige Node ≥ 22.23.4                     |
| tailwindcss / @tailwindcss/vite | 4.3.3   | configuración v4 por plugin de Vite y `@theme` en CSS    |
| typescript                      | 6.0.3   | `@astrojs/check` 0.9.12 aún no admite TypeScript 7       |
| @astrojs/check                  | 0.9.12  |                                                          |
| eslint                          | 10.13.0 | con typescript-eslint 8.72.0 y eslint-plugin-astro 3.2.1 |
| prettier                        | 3.9.10  | con prettier-plugin-astro 1.1.2                          |
| @playwright/test                | 1.64.1  |                                                          |
| wrangler                        | 4.152.0 | servidor local y despliegue                              |

### Node 24 (LTS) y no 26

- **Decisión:** Node 24.22.1.
- **Motivo:** el 24-10-2026 ninguna versión figura como "Active LTS": la 24 pasó a mantenimiento el 20-10-2026 y la 26 todavía figura como "próxima LTS". Se elige la 24 por ser LTS ya probada y compatible con Astro 7 (mínimo 22.23.4). Cuando la 26 sea LTS activa, se puede subir cambiando `.nvmrc` y `engines`.
- **Descartado:** Node 22 (Astro 7 exige 22.23.4; tu equipo tiene 22.18.0, así que igual hay que actualizar) y Node 26 (aún no es LTS).

### Fuente: IBM Plex Sans autoalojada con la API de fuentes de Astro (reemplazada el 2026-10-31 por Plus Jakarta Sans)

- **Decisión:** archivos `woff2` del subconjunto latino (incluye tildes y ñ), pesos 400, 500 y 600, guardados en `src/assets/fonts/ibm-plex-sans/` y servidos con el proveedor `local` de la API de fuentes de Astro. Precarga solo del peso 400. `font-display: swap`. Licencia OFL incluida.
- **Motivo:** el build no depende de internet ni de Google Fonts, y Astro genera las fuentes de respaldo ajustadas para evitar saltos de diseño.
- **Descartado:** proveedor de Google o Fontsource en el build (dependen de la red) y el paquete `@fontsource` como dependencia (traería pesos y alfabetos que no se usan).

### CSP: `<meta>` generado por Astro + cabecera para `frame-ancestors`

- **Decisión:** se activa `security.csp` de Astro, que calcula los hashes de cada script y estilo en línea y los pone en un `<meta http-equiv="content-security-policy">` por página. `frame-ancestors 'none'` va en la cabecera de `public/_headers`, porque un `<meta>` no puede expresarla.
- **Motivo:** los hashes se recalculan solos en cada build; no hay `unsafe-inline` en scripts. El script del tema queda permitido por su hash.
- **Consecuencias:** el resaltado de código de Markdown (Shiki) queda desactivado porque usa estilos en línea; este sitio no muestra código. En la fase 2 se agregará `https://challenges.cloudflare.com` a `script-src` y `frame-src` para Turnstile.
- **Descartado:** escribir la CSP completa a mano en `_headers` (habría que actualizar los hashes manualmente cada vez que cambie un script).

### HSTS sin `includeSubDomains` ni `preload`

- `Strict-Transport-Security: max-age=31536000`. Solo la envía el hub. Agregar `includeSubDomains` o `preload` lo decide Daniel más adelante.

### Tema claro / oscuro sin parpadeo

- Un script mínimo en el `<head>` pone `data-theme` en `<html>` antes de pintar: usa la elección guardada o, si no hay, la del sistema. Sin JavaScript, el CSS respeta `prefers-color-scheme`.
- El logo tiene las dos versiones en el HTML (normal y `-blanco`) y el CSS muestra una según el tema, así que no cambia después de cargar.

### Páginas provisionales en la fase 0

- Productos, Servicios, Nosotros y Contacto existen con un texto honesto ("Estamos preparando esta página") y contacto, para que el menú no tenga enlaces rotos. Se reemplazan en la fase 1.

### Motivo gráfico

- Rombo y "convergencia" (cuatro trazos que llegan a un rombo) como recurso propio, derivado de la geometría del logo, sin redibujar el logo. Animación de una sola vez en la portada, desactivada con `prefers-reduced-motion`.
- Colores derivados para `hover`: mezcla del Índigo con Noche (tema claro) y del Índigo claro con blanco (tema oscuro), con `color-mix`. No se agregaron tonos nuevos.

### Archivos del logo

- Copiados a `public/brand/` sin modificar ni renombrar. Diferencias con la lista del prompt: el zip venía con dos carpetas `xaska-logo/` anidadas; trae además `xaska-nombre-blanco` y `xaska-simbolo-blanco` (SVG y PNG) y `LEEME.txt`; las imágenes para redes son `xaska-perfil.png` (1080×1080) y `xaska-portada-facebook.png` (1640×624).

## 2026-10-24 — Fase 1

### Contenido en colecciones con esquema

- **Decisión:** los textos viven en `src/content/` (YAML y Markdown) y se validan con esquemas en `src/content.config.ts`: `home`, `about`, `services` (un archivo por servicio), `servicesPage`, `products`, `pos`, `faq` y `hardwareLine`.
- **Motivo:** se cambian textos sin tocar componentes, y si falta un campo el build falla con un mensaje claro.
- **Descartado:** textos dentro de las páginas `.astro` (mezcla contenido y diseño) y un CMS (innecesario por ahora).

### Marcadores y `check:pendientes`

- Cada archivo de contenido empieza con un comentario `[BORRADOR]`. Se quita al aprobar el texto. Los datos que faltan van como `PENDIENTE:` y se ven en la página de prueba.
- `scripts/check-pendientes.ts` (Node 24 ejecuta TypeScript sin compilar) recorre `src/content`, `src/config`, `src/pages` y `src/components` con archivo y línea, y las páginas de `dist/`. Corre al final de `pnpm build`. `pnpm pendientes` además actualiza `docs/PENDIENTES.md`.
- **Producción** = `WORKERS_CI_BRANCH=main` (Cloudflare Workers Builds), `GITHUB_REF=refs/heads/main` (GitHub Actions) o `XASKA_ENV=production`. Ahí el build falla si queda algún marcador o si la misión o la visión no están elegidas. `XASKA_ENV=preview` fuerza el modo de prueba.
- **Todo lo demás es versión de prueba:** franja "Versión de prueba — hay N pendientes" y `noindex` en todas las páginas.
- Consecuencia: mientras haya borradores, la CI de la rama `main` falla. Es lo que pide el prompt (no publicar con pendientes). Se trabaja en otra rama hasta aprobar los textos.

### Misión y visión

- Las tres opciones de cada una están en `src/content/about/index.md`. Se elige poniendo `selected: 0`, `1` o `2`. Mientras sea `null`, la página muestra las tres para compararlas en contexto.

### Línea de hardware

- `src/pages/[linea].astro` con `getStaticPaths` que devuelve una lista vacía si `SHOW_HARDWARE` es `false`: la página no se genera. El menú y las opciones del formulario (`interestOptions` en `site.ts`) la incluyen solo con la bandera en `true`.

### Contacto en la fase 1

- `/contacto` ofrece WhatsApp y correo. El formulario llega en la fase 2.

### Diseño de las páginas

- Se evitan las tarjetas idénticas en fila de tres: los pilares de la portada son columnas separadas por líneas; las tarjetas (`Card`) se usan solo para servicios en 2×2, planes y productos.
- Los pasos numerados (`Steps`) se usan solo para procesos reales en orden (cómo trabajamos, cómo empezar).
- Preguntas frecuentes con `<details>`: funcionan sin JavaScript y con teclado; el rombo se rellena al abrir.

## 2026-10-24 — Ajustes de la fase 1 (decisiones de Daniel)

- **Botón principal = "Pedir una demo" por WhatsApp** (`POS_LAUNCHED: false`). Motivo: en producción el registro de XASKA POS exige un código de activación (`SUBSCRIPTION_TRIAL_WITHOUT_CODE=false`), que se entrega en la demo. Si un día se abre la prueba sin código, se pone `true` y el botón lleva a `https://app.xaska.co/registro`. Donde el botón principal ya es WhatsApp, las páginas no ponen un segundo botón de WhatsApp al lado.
- **Planes publicados:** Básico $49.900 al mes (1 sucursal, hasta 3 usuarios) y Pro $99.900 al mes (hasta 5 sucursales, usuarios sin límite; desde el 2026-10-31, hasta 15 usuarios). Los límites salen del repositorio del POS (`V8__subscriptions.sql`). Los dos planes tienen las mismas funciones.
- **Funciones publicadas:** todas las que están en `main` del repositorio del POS, incluidos fiado, pedidos por encargo y cotizaciones.
- **Prueba gratis:** un mes, sin tarjeta (no hay pasarela de pagos). Al vencer, el negocio queda en solo consulta hasta pagar un plan, y el sistema avisa por correo antes. Fuente: módulo `subscription` del POS.
- **Textos legales del POS:** existen `app.xaska.co/terminos` y `app.xaska.co/privacidad` (rutas en `app.routes.ts`). Se enlazarán desde las páginas legales del hub en la fase 2.
- **Pie de página:** enlace "Entrar a XASKA POS" (`app.xaska.co/login`) para los clientes que ya lo usan.

## 2026-10-26 — Fase 2: contacto y legal

### Misión y visión elegidas

- Misión: opción 2 (ambiciosa). Visión: opción 1 (corta). Elección de Daniel.

### Formulario de contacto

- **Worker en el mismo proyecto** (`worker/index.ts`, `main` en `wrangler.jsonc`), que solo atiende `/api/*` (`assets.run_worker_first`). El resto del sitio sigue siendo estático.
- **Orden de defensas:** tamaño máximo (20 kB) → campo trampa (`sitio_web`; si llega lleno se responde "enviado" sin enviar nada) → límite por IP (binding `ratelimits`, 5 por minuto) → validación en el servidor (`src/lib/contact.ts`, la misma que usa el navegador) → Turnstile en el servidor (`siteverify` con `remoteip` e `idempotency_key`) → correo con Resend.
- **Respuestas genéricas:** nunca se muestran detalles técnicos. Solo se devuelven los errores por campo (cuáles faltan o están mal) para poder marcarlos.
- **Correo:** HTML con todo el contenido escapado y versión de texto; `Reply-To` = correo del visitante; remitente `formulario@envios.xaska.co`; `Idempotency-Key` en cada envío. El registro del Worker no guarda datos personales.
- **Sin base de datos:** los datos solo viajan en el correo.
- **Sin JavaScript:** Turnstile no funciona, así que el formulario muestra WhatsApp y correo. El Worker igual sabe responder a un envío normal, redirigiendo a `/contacto/enviado` o `/contacto/no-enviado`.
- **Claves de prueba:** con las claves secretas de prueba de Cloudflare (`1x…`, `2x…`, `3x…`), el Worker responde como Cloudflare sin llamar a la red. Así las pruebas no dependen de internet. Una clave real nunca coincide con esas.
- **Correo simulado:** `MAIL_TRANSPORT=log` no envía nada; se usa en las pruebas y en `.dev.vars.example`. En producción el valor es `resend` y, si falta la API key, el envío falla con el mensaje genérico (no finge que se envió).
- **Site key:** `PUBLIC_TURNSTILE_SITE_KEY` en el build. Si falta en producción, el build falla; en prueba se usa la clave de prueba de Cloudflare.
- **Accesibilidad:** cada campo tiene su error asociado con `aria-describedby` y `aria-invalid`; el foco va al primer campo con error; el resultado se anuncia en una región `aria-live`; la casilla de autorización empieza sin marcar.
- **Descartado:** Pages Functions (ya se eligió Workers) y guardar los mensajes en una base de datos (lo prohíbe el prompt).

### CSP con Turnstile

- Solo `/contacto` permite `https://challenges.cloudflare.com` en `script-src` y `frame-src` (API `Astro.csp` en la página). Al agregar un origen, Astro reemplaza las fuentes por defecto, por eso se vuelve a incluir `'self'`.
- Se quitó `frame-src 'none'` global: sin esa directiva rige `default-src 'self'`.
- Las respuestas del Worker llevan sus propias cabeceras de seguridad (`_headers` aplica a los archivos estáticos).
- En las pruebas automáticas, el script de Turnstile se reemplaza por uno de prueba servido desde la misma dirección. Así se comprueba que la CSP lo deja cargar. La prueba con el Turnstile real se hace en el navegador de Daniel (`docs/GUIA-CUENTAS.md`, paso 1).

### Páginas legales

- `src/content/legal/` (colección `legal`), servidas en `/legal/privacidad` y `/legal/terminos`. Con `reviewed: false` se ve "Borrador pendiente de revisión legal", y el build de producción falla.
- La política se basa en la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el 1074 de 2015). Plazos de consultas (10 + 5 días hábiles) y reclamos (15 + 8, subsanar en 5, desistimiento a los 2 meses). Encargados: Cloudflare y Resend (transmisión a EE. UU.).
- Propuesta a revisar con el abogado: conservar los mensajes hasta dos años después del último contacto.
- Enlazan a los textos de XASKA POS (`app.xaska.co/terminos` y `/privacidad`).

## 2026-10-30 — Fase 3: SEO, rendimiento y accesibilidad

### Lighthouse con las versiones de prueba (`noindex`)

- **Decisión:** Lighthouse mide el build de prueba y omite solo la regla `is-crawlable` (página indexable). Las demás reglas de SEO cuentan. Con `LIGHTHOUSE_STRICT=1` se mide sin la excepción; se usará con el build de producción en la fase 4. Elección de Daniel (opción a).
- **Motivo:** mientras haya borradores, todas las páginas llevan `noindex` a propósito, y esa regla bajaría la nota de SEO aunque el sitio esté bien.
- **Descartado:** un modo `XASKA_ENV=audit` que quite el `noindex` y la franja solo para medir (otro modo de build que mantener).

### Lighthouse directo y no `@lhci/cli`

- **Decisión:** `scripts/lighthouse.ts` usa `lighthouse` 13.6.0 (estable actual) con su API de Node. Levanta Wrangler, abre el Chromium de Playwright, mide cada página publicada con el perfil móvil por defecto y falla si alguna categoría queda por debajo de 95. Los informes HTML quedan en `lighthouse-report/`. Corre en la CI después de las pruebas (`pnpm lighthouse`), no dentro de `pnpm verify`, porque tarda y en un portátil la medición de rendimiento varía.
- **Motivo:** la última versión de `@lhci/cli` (0.15.1, junio de 2025) trae Lighthouse 12.6; no necesitamos su servidor ni su subida de informes.
- **Descartado:** `@lhci/cli` (versión de Lighthouse atrasada) y PageSpeed Insights (solo funciona con el sitio publicado).
- **Resultado del 2026-10-30:** todas las páginas en 96–100 en las cuatro categorías. En `/contacto`, buenas prácticas puede marcar un error de consola si el navegador no alcanza `challenges.cloudflare.com` (pasó en el entorno de pruebas sin internet).

### Metadatos

- `BaseLayout` pone en todas las páginas: Open Graph (`og:type`, `og:site_name`, `og:locale=es_CO`, título, descripción, URL canónica, imagen con tipo, ancho, alto y texto alternativo), Twitter Card `summary_large_image` y `<link rel="sitemap">`. Los datos de la imagen están en `ogImage` de `site.ts`.
- **Corrección:** el canonical de la portada salía `https://xaska.co/index` (con `build.format: 'file'` la portada es `/index.html`). Ahora es `https://xaska.co/`.
- **Título de la portada:** "XASKA | Soluciones tecnológicas" en lugar de solo "XASKA", para que el título diga qué es la empresa. Las demás páginas siguen como "Página | XASKA".

### Imagen Open Graph

- **Decisión:** una sola imagen para todo el sitio (elección de Daniel): `public/og/xaska-og.png`, 1200×630. Fondo Noche, logo oficial `xaska-horizontal-blanco.svg` sin modificar, "Soluciones tecnológicas" en mayúsculas espaciadas (desde el 2026-10-31 en Plus Jakarta Sans), `xaska.co` en Índigo claro y dos contornos de rombo discretos.
- Se genera con `pnpm og:image` (`scripts/generate-og-image.ts`, Chromium de Playwright) y el PNG se versiona. Solo hay que regenerarla si cambia el diseño.
- **Descartado:** imágenes por página (por ahora no hacen falta) y generarla en cada build (añade una dependencia de imágenes y tiempo de build sin beneficio).

### Datos estructurados (JSON-LD)

- `src/lib/structured-data.ts`, con todos los datos tomados de `site.ts`.
- `Organization` en todas las páginas: nombre "XASKA", url, logo (`xaska-icono-1024.png`, la versión cuadrada del ícono oficial), correo, ciudad (Ibagué, Tolima, sin dirección física), `areaServed: CO` y `contactPoint` con correo y WhatsApp. Sin `legalName`.
- `SoftwareApplication` en `/productos/xaska-pos`: `BusinessApplication`, `operatingSystem: Web`, `publisher` = la organización. Sin `offers` ni `aggregateRating`. Consecuencia: Google no mostrará un resultado enriquecido de app (exige precio o calificaciones); los datos siguen sirviendo para entender la página.
- Va en `<script type="application/ld+json">`, que el navegador no ejecuta, así que no hace falta abrir la CSP. Se escapan los `<` para que un texto no pueda cerrar la etiqueta.

### Sitemap

- `@astrojs/sitemap` 3.7.4 con `filter`: quedan fuera `/contacto/enviado`, `/contacto/no-enviado` y la 404, y `/hardware` mientras `SHOW_HARDWARE=false` (además, esa página ni se genera). Genera `sitemap-index.xml` y `sitemap-0.xml`. `robots.txt` apunta a `https://xaska.co/sitemap-index.xml`.

### Cloudflare Web Analytics (lista y apagada)

- **Decisión:** bandera `ANALYTICS` en `site.ts` (hoy `false`) más la variable de build `PUBLIC_CF_ANALYTICS_TOKEN`. Solo con las dos se carga el script `beacon.min.js` (fragmento manual con `type="module"`, como indica Cloudflare) y solo entonces la CSP agrega `https://static.cloudflareinsights.com` en `script-src` y `https://cloudflareinsights.com` en `connect-src`. Si la bandera está en `true` y falta el token, el build de producción falla.
- **Motivo:** el fragmento manual funciona igual con el DNS en Cloudflare o fuera de él y deja la CSP bajo control. La inyección automática de Cloudflare debe quedar **desactivada** para no cargar el script dos veces.
- **Política de privacidad:** se agregó Cloudflare Web Analytics en la sección 5 (encargados) y un párrafo en la sección 9. Si al publicar se decide no activar la analítica, hay que quitar esos dos textos.
- **Descartado:** activarla ya (el sitio no está publicado) y la inyección automática (no se controla qué páginas la cargan).

### Accesibilidad

- `tests/a11y.spec.ts`: axe (`@axe-core/playwright` 4.14.0) con las reglas WCAG 2.0, 2.1 y 2.2 A y AA en todas las páginas (incluidas 404 y resultados del formulario), en tema claro y oscuro, en escritorio y móvil.
- **Corrección:** en `/nosotros`, la lista de valores (`<dl>`) tenía el rombo fuera de `dt`/`dd`, lo que el HTML no permite. El rombo pasó dentro del `dt`; se ve igual.
- La revisión manual con teclado la hace Daniel con la lista de `docs/ROADMAP-Y-TRASPASO.md`.

### Orden previo

- `docs/ROADMAP-Y-TRASPASO.md` ahora vive en el repositorio. Se corrigió el valor de `POS_LAUNCHED` en el README y la tabla de contrastes. `_to_delete/`, `xaska-logo.zip` y `lighthouse-report/` quedaron en `.gitignore`.

## 2026-10-31 — Tipografía de marca: Plus Jakarta Sans

- **Decisión:** todo el hub usa **Plus Jakarta Sans**, la misma letra de XASKA POS, de las tarjetas y de las redes. Reemplaza a IBM Plex Sans. Decisión de Daniel: una sola letra para toda la marca.
- **Archivo:** `src/assets/fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2`, copiado sin cambios de `frontend/public/fonts/` del repositorio del POS. Es la versión variable recortada a caracteres latinos (tildes, ñ, ¿, ¡), y se declara con pesos 400 a 800, como en el POS. Pesa 27 kB y es un solo archivo, que se precarga.
- **Licencia:** SIL Open Font License 1.1, que permite el uso comercial. El `OFL.txt` del POS es solo un aviso de dos líneas, así que en el hub va el texto completo de la licencia con el copyright de Plus Jakarta Sans (la OFL pide distribuir la licencia junto a la fuente). Conviene hacer lo mismo en el POS.
- **Cómo se carga:** con la API de fuentes de Astro (proveedor `local`), alojada en el mismo sitio. La CSP no permite fuentes externas (`font-src 'self'`).
- **Pesos, igual que en el POS:** 800 para los títulos (`h1`, `h2`) y las cifras grandes (precios de los planes); 700 para subtítulos (`h3`), nombres y títulos de elementos; 600 para botones, etiquetas y negrillas; 400 para el texto. El peso 500 ya no se usa.
- **El logo no cambia:** el nombre XASKA está dibujado a medida y siempre sale de los SVG oficiales. El `LEEME.txt` del paquete del logo todavía menciona IBM Plex Sans; no se edita porque es parte del paquete oficial.
- **Imagen Open Graph:** se regeneró con Plus Jakarta Sans.
- **Contraste:** la tabla no cambia, porque los colores son los mismos.
- **Descartado:** mantener IBM Plex Sans en el hub (habría dos letras en la marca) y cargarla desde Google Fonts (lo bloquea la CSP y depende de un tercero).

### Lighthouse en un equipo con antivirus

- En el PC de Daniel, Lighthouse dio 81 en buenas prácticas en todas las páginas porque Kaspersky inyecta un script por HTTP (`gc.kis.v2.scr.kaspersky-labs.com`) en cada página que abre el navegador, incluido `127.0.0.1`. No es un problema del sitio. Ese script también puede bajar el rendimiento y mover el contenido (CLS).
- Medido en su informe: el script de Kaspersky (184 kB, cargado por HTTP antes que el contenido) retrasa el primer pintado unos 1,5 s, y por eso el rendimiento baja a 92–96. En la medición sin antivirus la portada da 100 y CLS 0.
- `scripts/lighthouse.ts` ahora avisa al final cuando la medición incluyó recursos de orígenes que el sitio no carga. Las notas válidas son las de la CI de GitHub, que corre sin antivirus.
- `tsconfig.json`, ESLint y Prettier ignoran `_to_delete/`, que tenía un componente viejo que rompía `astro check`.
- `pnpm pendientes` ahora formatea `docs/PENDIENTES.md` con Prettier al escribirlo. Antes la tabla quedaba sin alinear y `pnpm format:check` fallaba.

### Servicios oficiales

- La lista oficial de servicios es la del hub: desarrollo a medida, automatización, páginas web y consultoría (decisión de Daniel, 2026-10-31). Las tarjetas impresas dicen "Software a medida" y "Tiendas en línea", que son lo mismo con otras palabras. Para próximas piezas conviene usar los nombres del hub.

### Lema de XASKA POS

- **Decisión:** la página `/productos/xaska-pos` muestra bajo el título el lema de las tarjetas impresas, "Vende. Fía. Cobra. Controla.", en 800 y con la última palabra en el color de acento (Índigo en tema claro e Índigo claro en oscuro, los dos cumplen AA). Idea aprobada por Daniel el 2026-10-31.
- Vive en `src/content/pos/index.yaml` (campo `slogan`, una palabra por línea), y `PageHeader` lo pinta si la página lo trae. La entrada se ajustó a "Ventas, caja, fiados e inventario…", como en la tarjeta, para no repetir "Vende". El archivo sigue en `[BORRADOR]` hasta que apruebes todos sus textos.

### Textos y datos del 2026-10-31 (revisión de la portada)

- **Prueba gratis de 14 días** en todo el sitio (antes "1 mes"): portada, página de XASKA POS, planes, pasos para empezar, preguntas frecuentes y el botón "Probar gratis 14 días". La promoción de 1 mes para los primeros clientes no se publica; Daniel la ofrece en la demo. **Hay que ajustar la duración de la prueba en XASKA POS para que coincida.**
- **Nombre completo:** Daniel Felipe Mejía Martínez (con tildes) en `site.ts`, Nosotros y los documentos legales.
- **Tono:** se quitaron las frases que presentaban a XASKA como "pequeña" o "que está empezando". Sin inflar trayectoria: no se dicen años, cifras ni clientes.
- **Foto del fundador:** la entregó Daniel. Va en `src/assets/team/daniel-mejia.jpg` (reducida a 800 px) y Astro la publica en WebP en tres tamaños, con carga diferida. Se recorta en círculo con CSS porque el archivo original ya viene en círculo sobre negro. Más adelante conviene cambiarla por una sin gafas de sol.

### Factura electrónica (2026-10-31)

- XASKA POS todavía no emite factura electrónica; Daniel quiere incluirla lo antes posible. Mientras no exista, el sitio no la ofrece ni la insinúa. La pregunta frecuente lo dice tal cual y avisa que se anunciará cuando esté lista.
- **Cuando salga:** agregarla a las capacidades de XASKA POS, cambiar esa respuesta y revisar la regla de no usar la palabra "facturación" (y la prueba automática que la vigila), porque ya sería una función real.

### Revisión de XASKA POS (2026-10-31)

- **Plan Pro:** hasta 15 usuarios (antes "sin límite"). Cambio de Daniel en el POS.
- **Horario de atención:** lunes a sábado, de 8:00 a. m. a 6:00 p. m. (`contact.hours` en `site.ts`). Sale en el pie de página, en Contacto y en la pregunta sobre el soporte.
- **Respaldos:** confirmado en el repositorio del POS (`deploy/backup`): respaldo diario y prueba semanal de restauración. La pregunta frecuente lo dice así.
- **Restaurantes:** el POS ya tiene el tipo de negocio Restaurante abierto al público (fases 12a y 12b): mesas por zona, comandas con pantalla de cocina, adiciones, cobro por partes, propina e INC. Se agregó el grupo "Restaurantes" en las funciones y se mencionan en "Para quién es". También la opción de prender o apagar módulos.
- **Factura electrónica detrás de la bandera `E_INVOICING`** (hoy `false`). Daniel la publicará en los próximos días y quiere que el hub y las tarjetas salgan al mismo tiempo. Con la bandera apagada, la pregunta frecuente dice "Todavía no". Con la bandera encendida, se agrega el grupo "Factura electrónica" a las funciones y cambia la respuesta (textos en `eInvoicing`, en `src/content/pos/index.yaml`). Esos textos llevan `PENDIENTE:` hasta conocer los detalles reales, así que el build de producción no deja publicar sin completarlos.
- **Descartado:** escribir desde ya que XASKA POS emite factura electrónica (sería falso hasta que salga).

### Política de datos sin número de cédula (2026-10-31)

- Se quitó la línea del documento de identidad. El Decreto 1377 de 2013 (art. 13, compilado en el 1074 de 2015) pide en la política el nombre, el domicilio, la dirección, el correo y el teléfono del responsable, pero no el número de documento. Así la cédula de Daniel no queda publicada en internet. Debe confirmarlo el abogado en su revisión.
- Siguen pendientes la dirección para notificaciones y la fecha de vigencia.
- Productos y Servicios aprobados por Daniel. Confirmó que entrega sistemas en la nube y en los equipos del cliente, y que ya ofrece tiendas en línea.

### Textos legales revisados (2026-10-31)

- Daniel informa que el abogado revisó la política de datos y los términos y que, por ahora, están bien. Ambos quedan con `reviewed: true` y sin el aviso de borrador. Si el abogado pide cambios, se actualizan y se cambia la fecha.
- Dirección para notificaciones: Carrera 10 # 122-39, Ibagué, Tolima. Solo falta la fecha de vigencia, que se pone el día que se publique.
- **Fase 3 aprobada:** Daniel hizo la revisión con teclado y todo funciona en orden.

### Concepto del abogado sobre los textos legales (2026-10-31)

- **Cédula:** omitirla es legal y suficiente (art. 13 del Decreto 1377 de 2013).
- **Conservar 2 años:** plazo razonable bajo el principio de proporcionalidad (art. 4 de la Ley 1581 de 2012).
- **Cloudflare Web Analytics sin cookies:** la redacción es correcta y no hace falta banner de consentimiento.
- **Transmisión a EE. UU.:** basta con el aviso de la política y la casilla obligatoria del formulario (Circular 005 de 2017 de la SIC).
- Resultado: los textos del hub no cambian.
- **Fuera de este proyecto:** las cláusulas que propuso para los términos de XASKA POS (roles de habeas data, exención por la DIAN y el proveedor tecnológico, SLA y límite de responsabilidad, licencia SaaS y propiedad intelectual) van en `app.xaska.co/terminos`, que es donde las pymes se registran; el hub no tiene registro. También sus alertas: Registro Nacional de Bases de Datos (desde 100.000 UVT en activos), formalizar como S.A.S. y derecho de retracto si algún día se cobra en línea.
- **Cuando exista la S.A.S.:** actualizar `site.legal` en `site.ts`, la política, los términos y el JSON-LD (`legalName`).

### Capturas de XASKA POS (2026-10-31)

- Capturas tomadas por Daniel en negocios de prueba (Minimercado La Esquina, demo); los datos son de prueba, no de clientes. Van en `src/assets/pos/` (recortadas para quitar la barra inferior y los bordes vacíos), y Astro las publica en WebP en varios tamaños, con carga diferida.
- Sección "Así se ve" en `/productos/xaska-pos`: la pantalla de ventas en grande y seis miniaturas en dos columnas (cobro, tiquete, reportes, informe de caja, productos y mesa). Cada miniatura abre la imagen completa en otra pestaña. Los textos y el orden están en `screens`, en `src/content/pos/index.yaml`.
- Para cambiar una captura, se reemplaza el archivo con el mismo nombre.

### Servicio "Equipos y computadores" (2026-10-31)

- **Decisión de Daniel:** los equipos no van como una línea aparte con otra marca. Son el quinto servicio, "Equipos y computadores": puntos de venta completos (computador, lector, impresora térmica, cajón monedero, UPS y papel), computadores de oficina y computadores de alto rendimiento para diseño, video o juegos. La garantía es la del fabricante más la de XASKA por el ensamble.
- Se agregó la opción "Equipos y computadores" en el formulario de contacto, y en XASKA POS, debajo de los planes, una invitación con enlace al servicio. Los dos textos van en `[BORRADOR]` hasta que Daniel los apruebe.
- La línea aparte (`/hardware`, `SHOW_HARDWARE`) queda sin uso y sin marcadores pendientes. Solo volvería si se abre una marca propia, por ejemplo gaming.

### Portada con más presencia (2026-10-31)

- **Pedido de Daniel:** el diseño se sentía plano.
- **Decisión:** la entrada de la portada pasa a una banda en Noche, como las tarjetas impresas, con el título en 800 y, al lado, pantallas reales de XASKA POS: el inicio con las ventas del día, que sale por el borde inferior de la banda, y la ventana de cobro superpuesta. El cierre ("¿Hablamos de tu negocio?") usa la misma banda para cerrar la página. Es el único lugar con fondo oscuro en el tema claro.
- **Cómo:** `Section` tiene el tono `night` (clase `.on-night`), que redefine los tokens con los del tema oscuro, así que los contrastes son los mismos de la tabla. En el tema oscuro la banda es un poco más oscura (`#0b111e`) y lleva borde, para que se distinga.
- Los servicios de la portada pasan a tres columnas, y la sexta casilla es el enlace a todos los servicios.
- **Descartado:** un degradado morado (lo prohíbe el prompt y es un recurso genérico), animaciones al hacer scroll en cada sección y fotos de banco de imágenes. Se reemplazó la ilustración de convergencia de la entrada por las pantallas reales, que muestran el producto.
- **Lighthouse:** se mantiene en 100 en rendimiento en la portada (3 pasadas).

### Encabezados de todas las páginas (2026-10-31)

- **Pedido de Daniel:** le gustó la portada nueva, pero la vio algo borrosa, y pidió mejorar el inicio de Inicio, Productos, Servicios, Nosotros y Contacto. El resto de las secciones le gustaron.
- **Por qué se veía borrosa:** la captura completa se reducía a menos de la mitad y el texto quedaba diminuto. Ahora `ScreenShowcase` muestra la captura a unos 1040 px de ancho (cerca de su tamaño real) y deja que se corte por la derecha y por abajo, en WebP con calidad 90. Se quitó la ventana de cobro superpuesta, que tapaba las cifras.
- **`PageHeader` es ahora la banda en Noche en todas las páginas**, con un espacio (`visual`) para lo propio de cada una:
  - **Inicio:** pantalla de inicio de XASKA POS (ventas, gráfica y más vendidos).
  - **Productos:** "POS" en letra gigante con el degradado Índigo → lavanda, cortado por el borde, como en la tarjeta impresa. Es decorativo (`aria-hidden`).
  - **XASKA POS:** el lema y la pantalla de ventas. En "Así se ve" la imagen grande pasa a ser la de reportes, para no repetir la de ventas.
  - **Servicios:** el motivo de convergencia (cuatro trazos hacia el rombo) y los cinco servicios como botones dentro de la banda.
  - **Nosotros:** la foto de Daniel, grande, con su nombre y su cargo. Abajo, en "Quién está detrás", queda el texto sin repetir la foto.
  - **Contacto:** los canales directos en la banda (WhatsApp grande con su botón, correo, ciudad y horario). El formulario queda abajo, a una columna.
- **Accesibilidad y rendimiento:** axe sin infracciones en los dos temas; Lighthouse 99–100 en rendimiento (3 pasadas).

### Preparación de la publicación (2026-10-31)

- **Ramas:** se trabaja en `desarrollo`. Hasta publicar, `desarrollo` es la rama de producción de Cloudflare: así se crea el Worker y queda en su dirección `*.workers.dev`, siempre como versión de prueba, porque el modo producción del build solo se activa con `WORKERS_CI_BRANCH=main`. El día de publicación se crea `main` y pasa a ser la rama de producción. La CI corre en `desarrollo`, en `main` y en los pull requests.
- **Descartado:** `wrangler versions upload` para las ramas que no son de producción, porque exige que el Worker ya exista; y `wrangler preview`, que sigue en beta abierta y maneja sus propios secretos.
- **DNS:** pasa de Spaceship a Cloudflare (Spaceship sigue como registrador). `app.xaska.co` y todo el correo quedan en "DNS only" (nube gris), para que XASKA POS y Spacemail no pasen por Cloudflare. El hub se conecta como dominio propio del Worker. `www` se resuelve con un registro `AAAA 100::` con proxy y una regla de redirección 301 a la raíz. Pasos en `docs/GUIA-PUBLICACION.md`.
- **Capturas del encabezado al doble de resolución:** Daniel las tomó con device pixel ratio 2 (2880 px de ancho) para la portada (`header-reportes.png`) y XASKA POS (`header-vender.png`). `ScreenShowcase` ofrece hasta 2080 px, así que se ven nítidas también en pantallas de alta densidad.

## Tabla de contrastes (WCAG 2.2 AA)

Texto normal ≥ 4,5:1. Texto grande y componentes de interfaz ≥ 3:1.

| Tema   | Uso                    | Colores                   | Contraste | Mínimo | Resultado |
| ------ | ---------------------- | ------------------------- | --------- | ------ | --------- |
| Claro  | Texto                  | `#111827` sobre `#ffffff` | 17.74:1   | 4.5:1  | Cumple    |
| Claro  | Texto                  | `#111827` sobre `#f4f5f8` | 16.27:1   | 4.5:1  | Cumple    |
| Claro  | Texto secundario       | `#4b5563` sobre `#ffffff` | 7.56:1    | 4.5:1  | Cumple    |
| Claro  | Texto secundario       | `#4b5563` sobre `#f4f5f8` | 6.93:1    | 4.5:1  | Cumple    |
| Claro  | Enlace / acento        | `#4f46e5` sobre `#ffffff` | 6.29:1    | 4.5:1  | Cumple    |
| Claro  | Enlace / acento        | `#4f46e5` sobre `#f4f5f8` | 5.77:1    | 4.5:1  | Cumple    |
| Claro  | Texto de botón         | `#ffffff` sobre `#4f46e5` | 6.29:1    | 4.5:1  | Cumple    |
| Claro  | Texto de botón (hover) | `#ffffff` sobre `#443ec3` | 7.71:1    | 4.5:1  | Cumple    |
| Claro  | Borde de control       | `#6b7280` sobre `#ffffff` | 4.83:1    | 3:1    | Cumple    |
| Claro  | Foco (contorno)        | `#4f46e5` sobre `#ffffff` | 6.29:1    | 3:1    | Cumple    |
| Oscuro | Texto                  | `#f3f4f6` sobre `#111827` | 16.12:1   | 4.5:1  | Cumple    |
| Oscuro | Texto                  | `#f3f4f6` sobre `#1a2232` | 14.47:1   | 4.5:1  | Cumple    |
| Oscuro | Texto secundario       | `#aab1be` sobre `#111827` | 8.23:1    | 4.5:1  | Cumple    |
| Oscuro | Texto secundario       | `#aab1be` sobre `#1a2232` | 7.39:1    | 4.5:1  | Cumple    |
| Oscuro | Enlace / acento        | `#818cf8` sobre `#111827` | 5.95:1    | 4.5:1  | Cumple    |
| Oscuro | Enlace / acento        | `#818cf8` sobre `#1a2232` | 5.34:1    | 4.5:1  | Cumple    |
| Oscuro | Texto de botón         | `#111827` sobre `#818cf8` | 5.95:1    | 4.5:1  | Cumple    |
| Oscuro | Texto de botón (hover) | `#111827` sobre `#9aa3f9` | 7.59:1    | 4.5:1  | Cumple    |
| Oscuro | Borde de control       | `#8b93a3` sobre `#111827` | 5.74:1    | 3:1    | Cumple    |
| Oscuro | Foco (contorno)        | `#818cf8` sobre `#111827` | 5.95:1    | 3:1    | Cumple    |
| Claro  | Error de formulario    | `#b91c1c` sobre `#ffffff` | 6.47:1    | 4.5:1  | Cumple    |
| Claro  | Error de formulario    | `#b91c1c` sobre `#f4f5f8` | 5.93:1    | 4.5:1  | Cumple    |
| Oscuro | Error de formulario    | `#fca5a5` sobre `#111827` | 9.35:1    | 4.5:1  | Cumple    |
| Oscuro | Error de formulario    | `#fca5a5` sobre `#1a2232` | 8.39:1    | 4.5:1  | Cumple    |

Comprobación: el Índigo `#4f46e5` sobre Noche `#111827` da 2.82:1 y **no** cumple; por eso en tema oscuro el acento es el Índigo claro.
Los bordes `--c-line` (`#e1e4ea` / `#2b3446`) son solo decorativos (separadores); los controles usan `--c-line-strong`.
