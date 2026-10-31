# HUB de XASKA — roadmap y prompt de traspaso

Actualizado: 2026-10-31.

Este documento sirve para seguir el proyecto desde otra conversación o cuenta de Claude. Tiene dos partes:

1. **Roadmap:** en qué va el proyecto y qué falta.
2. **Prompt de traspaso:** el texto que pegas en la conversación nueva, después de adjuntar los archivos.

---

## Parte 1 — Roadmap

### Estado por fases

| Fase                                 | Qué incluye                                                                                                              | Estado                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Esqueleto y marca                | Astro + Tailwind, tokens de color y tipografía, Header/Footer, logo con tema claro/oscuro sin parpadeo, CSP, CI, pruebas | ✅ Aprobada en local                                                                                                              |
| 1 — Páginas y contenido              | Inicio, Nosotros, Servicios, Productos, XASKA POS, Contacto, 404; textos en `src/content/`; `check:pendientes`           | ✅ Hecha. Misión (opción 2) y visión (opción 1) elegidas. Faltan aprobar los demás textos                                         |
| 2 — Contacto y legal                 | Formulario con Turnstile + Resend (Worker), campo trampa, límite por IP, páginas `/legal/privacidad` y `/legal/terminos` | 🧪 Construida y probada con claves de prueba (67 pruebas en verde). Falta la prueba de Daniel en su navegador y crear las cuentas |
| 3 — SEO, rendimiento y accesibilidad | Metadatos, JSON-LD, imagen Open Graph, sitemap, analítica sin cookies, Lighthouse ≥ 95, revisión con teclado             | ✅ Aprobada el 2026-10-31 (revisión con teclado hecha por Daniel; Lighthouse 98–100 sin antivirus)                                |
| 4 — Publicación                      | GitHub, Cloudflare, DNS a Cloudflare, dominio `xaska.co`, `www` → 301, Search Console                                    | ⏳ Siguiente                                                                                                                      |
| Después                              | Blog, casos de éxito, estado del servicio, documentación, empleo, portal de clientes, inglés                             | ⏳                                                                                                                                |

### Para cerrar la fase 2 (te toca a ti)

- [ ] **Probar el formulario en tu PC:**
  - Copia `.dev.vars.example` como `.dev.vars` y ejecuta `pnpm preview`.
  - Abre http://localhost:8787/contacto y envía un mensaje.
  - Debe salir "Recibimos tu mensaje", sin errores de "Content Security Policy" en la consola (F12).
- [ ] **Crear las cuentas de Turnstile y Resend** (pasos en `docs/GUIA-CUENTAS.md`). Resend necesita 3 registros DNS en Spaceship para `envios.xaska.co`.
- [ ] **Prueba con correo real:** un mensaje llega a `soporte@xaska.co` y, al responderlo, el destinatario es el visitante.

### Para cerrar la fase 3 (te toca a ti)

- [x] **Instalar y verificar en tu PC** (PowerShell, en la carpeta del proyecto):
  - `pnpm install` (hay dependencias nuevas: `@astrojs/sitemap`, `@axe-core/playwright` y `lighthouse`).
  - `pnpm verify` debe terminar en verde.
  - `pnpm lighthouse` muestra la tabla de notas por página (meta ≥ 95) y deja los informes en `lighthouse-report/`.
- [ ] **Mirar la imagen para redes:** `public/og/xaska-og.png`. Si quieres otro diseño, dime qué cambiar.
- [x] **Revisión con teclado** (hecha el 2026-10-31: Tab y Shift+Tab en orden) (`pnpm preview`, http://localhost:8787, solo con el teclado: Tab, Shift+Tab, Enter, Espacio, Escape):
  - En cada página, el primer Tab muestra "Saltar al contenido" y Enter lleva al contenido.
  - El foco se ve siempre (contorno índigo) y avanza en el orden en que se lee la página.
  - Menú móvil (ventana angosta): se abre con Enter, se recorre con Tab, se cierra con Escape y el foco vuelve al botón.
  - Selector de tema: cambia con Enter o Espacio.
  - Preguntas frecuentes de XASKA POS: se abren y cierran con Enter.
  - Formulario de contacto: se llena y se envía sin ratón; con errores, el foco va al primer campo con error; Turnstile no atrapa el foco.
  - En tema claro y en oscuro.
- [x] **Aprobar la fase 3.** Los dos textos nuevos de la política de privacidad sobre Cloudflare Web Analytics (secciones 5 y 9) entran en la revisión del abogado.

### Fase 3 — qué se hizo

- Open Graph y Twitter Card en todas las páginas, con la imagen `public/og/xaska-og.png` (1200×630, logo oficial sin modificar; se regenera con `pnpm og:image`).
- Canonical corregido en la portada (antes salía `/index`) y título de portada "XASKA | Soluciones tecnológicas".
- JSON-LD: `Organization` en todas las páginas y `SoftwareApplication` en XASKA POS, sin precios, calificaciones ni `legalName`.
- `sitemap-index.xml` con solo las páginas publicadas y la línea `Sitemap:` en `robots.txt`.
- Cloudflare Web Analytics lista y apagada (bandera `ANALYTICS` + `PUBLIC_CF_ANALYTICS_TOKEN`); la CSP se abre solo cuando está activa. Mencionada en la política de privacidad.
- Lighthouse móvil (`pnpm lighthouse`, en la CI) sin la regla "página indexable" mientras haya `noindex`; axe en todas las páginas en tema claro y oscuro; corrección de la lista de valores de `/nosotros`.
- Detalle y motivos en `docs/DECISIONES.md` (2026-10-30).

### Fase 4 — publicación (resumen)

Pasos completos y en orden en `docs/GUIA-PUBLICACION.md`. Se trabaja en la rama `desarrollo`; `main` se crea el día de publicación.

- Crear el repositorio `xaska-hub` en GitHub y subir el proyecto. La CI ya existe en `.github/workflows/ci.yml`.
- Conectarlo a Cloudflare (Workers & Pages → Import a repository):
  - Build: `pnpm build`.
  - Deploy: `pnpm exec wrangler deploy`.
  - Previsualizaciones: `pnpm exec wrangler versions upload`.
- Cargar los secretos `TURNSTILE_SECRET_KEY` y `RESEND_API_KEY` y la variable de build `PUBLIC_TURNSTILE_SITE_KEY`.
- **Mover el DNS de Spaceship a Cloudflare.** El registrador sigue siendo Spaceship. Hay que copiar todos los registros actuales: el A de `app` (hacia el servidor de Contabo, en "solo DNS", nube gris), y los MX, SPF, DKIM, SRV y DMARC de Spacemail. Después se agregan los de Resend.
- Dominio `xaska.co` en el Worker y redirección 301 de `www.xaska.co` → `xaska.co`.
- Google Search Console: verificar y enviar el sitemap (`https://xaska.co/sitemap-index.xml`).
- **Analítica:** en Cloudflare → Web Analytics → Add a site → `xaska.co`, elegir la instalación manual (JS snippet), dejar **apagada** la inyección automática y copiar el token. Cargar `PUBLIC_CF_ANALYTICS_TOKEN` como variable de build y poner `ANALYTICS: true` en `site.ts`.
- Medir el build de producción con `$env:LIGHTHOUSE_STRICT=1; pnpm lighthouse` (PowerShell) (sin la excepción de "página indexable").
- El build de producción (rama `main`) falla mientras haya marcadores `PENDIENTE:` o `[BORRADOR]`, o páginas legales con `reviewed: false`.

### Datos que faltan aportar

- Horario de atención.
- Respuesta oficial sobre DIAN / factura electrónica (pregunta frecuente de XASKA POS).
- Bio y foto de Daniel Mejía.
- Capturas de XASKA POS sin datos de clientes reales.
- Cédula y dirección para notificaciones (política de privacidad), y fecha de vigencia.
- Revisión del abogado de la política y los términos (incluida la propuesta de conservar los mensajes 2 años).
- Nombre definitivo de la línea de hardware y si se incluye (hoy oculta).
- Aprobar los textos marcados `[BORRADOR]` (13 archivos). `pnpm pendientes` los lista.

---

## Parte 2 — Prompt de traspaso

### Antes de pegarlo

1. En la cuenta nueva, abre una conversación (mejor dentro de un Proyecto, para que el contexto quede guardado).
2. Adjunta:
   - **El proyecto comprimido**: un .zip de `C:\Users\danii\Documents\GitHub\Xaska-HUB` **sin** `node_modules`, `dist`, `.astro`, `.wrangler` ni `.dev.vars`. Si usas la app de escritorio con la carpeta conectada, basta con conectar la carpeta.
   - **`PROMPT-MAESTRO-HUB.md`** (el prompt original v3). Si no lo tienes a mano, este documento resume lo esencial.
   - **`xaska-logo.zip`** solo si no va dentro del proyecto (ya está copiado en `public/brand/`).
3. Pega el texto de abajo.

### Texto para pegar

```text
Hola. Vamos a continuar el sitio corporativo de mi empresa, XASKA (xaska.co). Ya están hechas las fases 0, 1 y 2, y la 3 está construida y pendiente de mi revisión; después sigue la fase 4. Te adjunto el proyecto completo (o tienes la carpeta conectada) y el prompt maestro original (PROMPT-MAESTRO-HUB.md). Antes de escribir código, lee estos archivos del proyecto en este orden:

1. docs/ROADMAP-Y-TRASPASO.md (estado y lo que falta)
2. docs/DECISIONES.md (decisiones técnicas y de diseño ya tomadas; respétalas)
3. docs/PENDIENTES.md y README.md
4. src/config/site.ts, src/content.config.ts, astro.config.mjs, wrangler.jsonc

Contexto mío:
- Soy Daniel Mejía, de Ibagué (Colombia). Trabajo en Windows con PowerShell. XASKA está en proceso de formalización: hoy opero como persona natural. Nunca escribas "S.A.S.", NIT ni razón social.
- Nuestro producto es XASKA POS (https://app.xaska.co), un sistema de punto de venta en la web, en producción en un servidor de Contabo. Este proyecto NO toca app.xaska.co (ni su código, ni su DNS, ni sus cabeceras). El código del POS es público: https://github.com/Xaska312/sistema-facturacion-pos (revísalo si necesitas confirmar funciones; no inventes).
- El dominio está en Spaceship (registrador y DNS). El correo soporte@xaska.co está en Spacemail. No toques esos registros.
- Respondes en español de Colombia, claro y práctico. Tuteo.

Cómo está hecho el sitio (no lo cambies sin preguntarme):
- Astro 7.4.2 (salida estática) + Tailwind 4.3.3 + TypeScript 6.0.3 estricto, pnpm 12.15.0, Node 24.22.1 (.nvmrc). Versiones exactas, sin ^ ni ~; el lockfile se versiona. Antes de agregar una dependencia, verifica su versión estable actual y su configuración vigente en la documentación oficial.
- Hosting: Cloudflare Workers con assets estáticos. worker/index.ts solo atiende /api/contacto (run_worker_first ["/api/*"]). Todavía no está publicado: trabajo en local y lo subo en la fase 4.
- Textos en src/content/ (colecciones con esquema). Marcadores: "PENDIENTE:" = dato que debo aportar; "[BORRADOR]" = texto tuyo que debo aprobar. `pnpm pendientes` los lista; en producción (rama main o XASKA_ENV=production) el build falla si queda alguno; en prueba se ve la franja "Versión de prueba" y todas las páginas llevan noindex.
- CSP generada por Astro (security.csp) con hashes, sin unsafe-inline en scripts. Solo /contacto permite challenges.cloudflare.com (Astro.csp, volviendo a incluir 'self'). frame-ancestors y el resto de cabeceras van en public/_headers. HSTS sin includeSubDomains ni preload.
- Banderas en site.ts: POS_LAUNCHED=false (el botón principal es "Pedir una demo" por WhatsApp, porque el registro del POS exige un código de activación) y SHOW_HARDWARE=false (no se genera /hardware).
- Marca: Noche #111827, Índigo #4F46E5 (sobre claro), Índigo claro #818CF8 (sobre oscuro). Logo oficial en public/brand/ sin modificar; no se redibuja ni se reescribe con texto. Plus Jakarta Sans variable (400–800) autoalojada, la misma letra de XASKA POS; títulos en 800, subtítulos 700, botones 600, texto 400. El motivo gráfico es el rombo, con moderación. Contraste WCAG 2.2 AA (tabla en DECISIONES.md).
- Contenido aprobado: misión = opción 2, visión = opción 1. Planes Básico $49.900/mes (1 sucursal, 3 usuarios) y Pro $99.900/mes (5 sucursales, usuarios sin límite), ambos con todas las funciones; prueba gratis de 1 mes sin tarjeta; estoy excluido de IVA (no se menciona IVA). No uses la palabra "facturación" para describir el producto, y no digas ni insinúes que emite factura electrónica DIAN.
- Prohibido inventar clientes, testimonios, cifras, calificaciones, equipo o años de experiencia.

Cómo trabajamos:
- Por fases. No pases a la siguiente sin que yo apruebe la actual.
- Todo debe pasar `pnpm verify` (formato, lint, astro check + tipos del Worker, build y pruebas Playwright) antes de entregarme algo.
- Si algo es ambiguo, pregúntame. Si asumes algo, déjalo escrito en docs/DECISIONES.md (fecha, decisión, motivo, alternativa descartada).
- Lo que solo yo puedo hacer (cuentas, DNS, claves, conectar el repo) no lo simules: dame los pasos exactos y espera mi confirmación. Nunca me pidas pegar claves secretas en el chat.
- Al terminar cada fase: actualiza docs/ROADMAP-Y-TRASPASO.md, docs/DECISIONES.md, docs/PENDIENTES.md (con `pnpm pendientes`) y el README, y dime cómo probarlo en mi PC.

Primera tarea: confirma en pocas líneas que entendiste el estado, dime si ves algo inconsistente en el proyecto, y dime qué me falta para cerrar las fases 2 y 3 antes de proponer el plan de la fase 4.
```

---

## Notas técnicas para quien continúe

- **Comandos:**
  - `pnpm dev` muestra las páginas, pero sin el Worker.
  - `pnpm preview` hace el build y lo sirve con Wrangler en http://localhost:8787, igual que en Cloudflare. El formulario solo funciona aquí.
  - `pnpm verify` corre todo lo de la CI menos Lighthouse.
  - `pnpm lighthouse` mide el build con Lighthouse (perfil móvil, meta ≥ 95). La CI lo corre después de las pruebas.
  - `pnpm test:install` descarga el navegador de Playwright (una sola vez).
- **Pruebas:**
  - Playwright levanta Wrangler con la clave secreta de prueba de Turnstile y `MAIL_TRANSPORT=log`. El script de Turnstile se reemplaza por uno de prueba (`tests/helpers.ts`).
  - `tests/seo.spec.ts` revisa metadatos, JSON-LD, sitemap y analítica; `tests/a11y.spec.ts` pasa axe en todas las páginas, en tema claro y oscuro.
  - Cada prueba de la API usa su propia `CF-Connecting-IP`, para no chocar con el límite de 5 envíos por minuto.
- **Tipos del Worker:** `worker/tsconfig.json` (aparte del de Astro). Si cambias `wrangler.jsonc`, ejecuta `pnpm types:worker`.
- **Validación del formulario:** `src/lib/contact.ts`, compartida por el navegador y el Worker.
- **CSP:** Astro inserta los scripts pequeños en línea y calcula su hash. Si una página agrega un origen con `Astro.csp.insertScriptResource`, hay que volver a incluir `'self'`.
- **Fuentes:** Plus Jakarta Sans variable, con el proveedor `local` de la API de fuentes de Astro (`astro.config.mjs`). El archivo está en `src/assets/fonts/plus-jakarta-sans/` y es el mismo que usa XASKA POS.
- **pnpm 12** bloquea los scripts de instalación: `pnpm-workspace.yaml` permite `esbuild` y `workerd` (`allowBuilds`).
