# HUB de XASKA — roadmap y prompt de traspaso

Actualizado: 2026-11-06. **El sitio está publicado en https://xaska.co desde el 2026-11-02.**

Este documento sirve para seguir el proyecto desde otra conversación o cuenta de Claude. Tiene dos partes:

1. **Roadmap:** en qué va el proyecto y qué falta.
2. **Prompt de traspaso:** el texto que pegas en la conversación nueva, después de adjuntar los archivos.

---

## Parte 1 — Roadmap

### Estado por fases

| Fase                                 | Qué incluye                                                                                                              | Estado                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Esqueleto y marca                | Astro + Tailwind, tokens de color y tipografía, Header/Footer, logo con tema claro/oscuro sin parpadeo, CSP, CI, pruebas | ✅ Aprobada en local                                                                                                                                                                                                                                                                            |
| 1 — Páginas y contenido              | Inicio, Nosotros, Servicios, Productos, XASKA POS, Contacto, 404; textos en `src/content/`; `check:pendientes`           | ✅ Cerrada: todos los textos aprobados (2026-10-31)                                                                                                                                                                                                                                             |
| 2 — Contacto y legal                 | Formulario con Turnstile + Resend (Worker), campo trampa, límite por IP, páginas `/legal/privacidad` y `/legal/terminos` | ✅ Cerrada el 2026-10-31: probada con Turnstile y Resend reales en la versión de prueba de Cloudflare; textos legales revisados por el abogado                                                                                                                                                  |
| 3 — SEO, rendimiento y accesibilidad | Metadatos, JSON-LD, imagen Open Graph, sitemap, analítica sin cookies, Lighthouse ≥ 95, revisión con teclado             | ✅ Aprobada el 2026-10-31 (revisión con teclado hecha por Daniel; Lighthouse 98–100 sin antivirus)                                                                                                                                                                                              |
| 4 — Publicación                      | GitHub, Cloudflare, DNS a Cloudflare, dominio `xaska.co`, `www` → 301, Search Console                                    | ✅ Publicada el 2026-11-02 en https://xaska.co: DNS en Cloudflare, `www` → 301, cabeceras comprobadas, analítica, Search Console con sitemap y PageSpeed 100 en las cuatro categorías. Formulario probado en producción (2026-11-06). Quedan: DNSSEC con Cloudflare (D5) y apagar `workers.dev` |
| Rediseño bento                       | Todo el sitio con el estilo de XASKA POS (boceto 1 de 6), tarjetas, encabezados nuevos, capturas sin cortes en celular   | ✅ Hecho el 2026-11-04 y publicado. Ver `docs/DECISIONES.md`                                                                                                                                                                                                                                    |
| Planes por nivel                     | Emprende, Negocio y Empresa, tabla para comparar, módulo de droguerías y funciones nuevas del POS                        | ✅ Hecho el 2026-11-05 (por publicar). Ver `docs/DECISIONES.md`                                                                                                                                                                                                                                 |
| Después                              | Blog, casos de éxito, estado del servicio, documentación, empleo, portal de clientes, inglés                             | ⏳                                                                                                                                                                                                                                                                                              |

### Fase 2 — cerrada

- [x] Formulario probado en la versión de prueba de Cloudflare, con Turnstile real y envío por Resend (`formulario@envios.xaska.co` → `soporte@xaska.co`, con `Reply-To` al visitante).
- [x] Cuentas de Turnstile y Resend creadas; dominio `envios.xaska.co` verificado.
- [x] Textos legales revisados por el abogado.

### Fase 3 — qué se hizo (cerrada el 2026-10-31)

- Open Graph y Twitter Card en todas las páginas, con la imagen `public/og/xaska-og.png` (1200×630, logo oficial sin modificar; se regenera con `pnpm og:image`).
- Canonical corregido en la portada (antes salía `/index`) y título de portada "XASKA | Soluciones tecnológicas".
- JSON-LD: `Organization` en todas las páginas y `SoftwareApplication` en XASKA POS, sin precios, calificaciones ni `legalName`.
- `sitemap-index.xml` con solo las páginas publicadas y la línea `Sitemap:` en `robots.txt`.
- Cloudflare Web Analytics lista y apagada (bandera `ANALYTICS` + `PUBLIC_CF_ANALYTICS_TOKEN`); la CSP se abre solo cuando está activa. Mencionada en la política de privacidad.
- Lighthouse móvil (`pnpm lighthouse`, en la CI) sin la regla "página indexable" mientras haya `noindex`; axe en todas las páginas en tema claro y oscuro; corrección de la lista de valores de `/nosotros`.
- Detalle y motivos en `docs/DECISIONES.md` (2026-10-30).

### Fase 4 — publicación (cerrada el 2026-11-02)

Pasos completos en `docs/GUIA-PUBLICACION.md`. Cómo quedó:

- **Repositorio:** `Xaska312/xaska-hub`. Se trabaja en `desarrollo`; lo listo se pasa a `main` (producción) con un pull request o un `git merge`, con la CI en verde.
- **Cloudflare Workers (`xaska-hub`):** la rama de producción es `main` y sirve `xaska.co`. `desarrollo` se construye como versión de prueba (franja y `noindex`) sin tocar la publicada.
- **Variables de build (públicas):** `PUBLIC_TURNSTILE_SITE_KEY` y `PUBLIC_CF_ANALYTICS_TOKEN`. **Secretos del Worker:** `TURNSTILE_SECRET_KEY` y `RESEND_API_KEY`.
- **DNS en Cloudflare** desde el 2026-11-02 (Spaceship sigue de registrador). `app` y todo el correo (Spacemail y Resend) en "DNS only" (nube gris). `www` es un AAAA `100::` con proxy y una Redirect Rule 301 a `xaska.co`. "Always Use HTTPS" activado; el HSTS de Cloudflare **no** (lo manda el sitio, sin `includeSubDomains`).
- **Web Analytics** con instalación manual (sin inyección automática, por la CSP).
- **Search Console:** propiedad de dominio `xaska.co` verificada (TXT puesto por Cloudflare; no se borra) y sitemap `https://xaska.co/sitemap-index.xml` enviado.
- **CI:** hace un build de producción estricto (con las claves públicas) y otro de prueba para las pruebas.

### Rediseño y planes (después de publicar)

- **Rediseño bento (2026-11-04):** se hicieron 6 bocetos del inicio (en un lienzo de diseño en Claude) y Daniel eligió el 1, "Bento". Se aplicó a todas las páginas. Componentes nuevos: `Card`, `PageHeader`, `ScreenCard`, `Icon`; se eliminaron `ScreenShowcase` y `Convergence`. Pruebas: 149 en verde; Lighthouse 100 en casi todo (Contacto 96 en buenas prácticas, por Turnstile).
- **Planes por nivel (2026-11-05):** tomados del repositorio del POS (decisión 288). Ver `docs/DECISIONES.md`.
- **Cómo se publica un cambio:** README, sección "Cómo se publica un cambio".

### Lo que falta

- [ ] Confirmar DNSSEC con Cloudflare (guía, D5).
- [ ] Confirmar que se apagó la dirección `workers.dev` (guía, F).
- [x] Formulario probado en https://xaska.co/contacto (2026-11-06).
- [ ] Opcional: revisar la imagen para redes (`public/og/xaska-og.png`); se hizo antes del rediseño.
- [ ] **Factura electrónica:** cuando salga en XASKA POS, completar `eInvoicing` en `src/content/pos/index.yaml` (documentos, proveedor, costo y cómo se activa) y poner `E_INVOICING: true`.
- [ ] Nombre definitivo de la línea de hardware y si se incluye (hoy oculta).
- [ ] `POS_LAUNCHED: true` cuando el registro del POS ya no exija código de activación.

---

## Parte 2 — Prompt de traspaso

### Antes de pegarlo

1. En la cuenta nueva, abre una conversación (mejor dentro de un Proyecto, para que el contexto quede guardado).
2. Adjunta:
   - **El proyecto comprimido**: un .zip de `C:\Users\danii\Documents\GitHub\Xaska-HUB` **sin** `node_modules`, `dist`, `.astro`, `.wrangler` ni `.dev.vars`. Si usas la app de escritorio con la carpeta conectada, basta con conectar la carpeta.
   - **`PROMPT-MAESTRO-HUB.md`** (el prompt original v3). Si no lo tienes a mano, este documento resume lo esencial.
   - **`xaska-logo.zip`** solo si no va dentro del proyecto (ya está copiado en `public/brand/`).
3. Pega el texto de abajo. Usa siempre esta versión: los textos de traspaso anteriores (con Básico/Pro, IBM Plex Sans o "1 mes" de prueba) ya no sirven.

### Texto para pegar

```text
Hola. Vamos a continuar el sitio corporativo de mi empresa, XASKA (xaska.co). Las fases 0 a 4 están cerradas: el sitio está publicado en https://xaska.co desde el 2026-11-02, con el estilo bento de XASKA POS desde el 2026-11-04. Te adjunto el proyecto completo (o tienes la carpeta conectada) y el prompt maestro original (PROMPT-MAESTRO-HUB.md). Antes de escribir código, lee estos archivos del proyecto en este orden:

1. docs/ROADMAP-Y-TRASPASO.md (estado y lo que falta)
2. docs/DECISIONES.md (decisiones técnicas y de diseño ya tomadas; respétalas)
3. docs/PENDIENTES.md y README.md
4. src/config/site.ts, src/content.config.ts, astro.config.mjs, wrangler.jsonc

Contexto mío:
- Soy Daniel Mejía, de Ibagué (Colombia). Trabajo en Windows con PowerShell. XASKA está en proceso de formalización: hoy opero como persona natural. Nunca escribas "S.A.S.", NIT ni razón social.
- Nuestro producto es XASKA POS (https://app.xaska.co), un sistema de punto de venta en la web, en producción en un servidor de Contabo. Este proyecto NO toca app.xaska.co (ni su código, ni su DNS, ni sus cabeceras). El código del POS está en el repositorio privado `Xaska312/sistema-facturacion-pos` (copia local en `C:\Users\danii\Documents\GitHub\Pos-Hibrid-Dan`; pídeme acceso a esa carpeta). Su README y su `docs/DECISIONES.md` son la fuente de funciones, planes y precios: no inventes.
- El dominio está registrado en Spaceship y su DNS está en Cloudflare. `app` y los registros del correo (soporte@xaska.co en Spacemail, envios.xaska.co en Resend) van en "DNS only"; no los toques.
- Respondes en español de Colombia, claro y práctico. Tuteo.

Cómo está hecho el sitio (no lo cambies sin preguntarme):
- Astro 7.4.2 (salida estática) + Tailwind 4.3.3 + TypeScript 6.0.3 estricto, pnpm 12.15.0, Node 24.22.1 (.nvmrc). Versiones exactas, sin ^ ni ~; el lockfile se versiona. Antes de agregar una dependencia, verifica su versión estable actual y su configuración vigente en la documentación oficial.
- Hosting: Cloudflare Workers con assets estáticos. worker/index.ts solo atiende /api/contacto (run_worker_first ["/api/*"]). Se trabaja en la rama desarrollo (versión de prueba en Cloudflare) y se publica pasando los cambios a main.
- Textos en src/content/ (colecciones con esquema). Marcadores: "PENDIENTE:" = dato que debo aportar; "[BORRADOR]" = texto tuyo que debo aprobar. `pnpm pendientes` los lista; en producción (rama main o XASKA_ENV=production) el build falla si queda alguno; en prueba se ve la franja "Versión de prueba" y todas las páginas llevan noindex.
- CSP generada por Astro (security.csp) con hashes, sin unsafe-inline en scripts. Solo /contacto permite challenges.cloudflare.com (Astro.csp, volviendo a incluir 'self'). frame-ancestors y el resto de cabeceras van en public/_headers. HSTS sin includeSubDomains ni preload.
- Banderas en site.ts: POS_LAUNCHED=false (el botón principal es "Pedir una demo" por WhatsApp, porque el registro del POS exige un código de activación), SHOW_HARDWARE=false (no se genera /hardware), ANALYTICS=true (Cloudflare Web Analytics) y E_INVOICING=false (la página dice que todavía no emite factura electrónica).
- Marca: Noche #111827, Índigo #4F46E5 (sobre claro), Índigo claro #818CF8 (sobre oscuro). Logo oficial en public/brand/ sin modificar; no se redibuja ni se reescribe con texto. Plus Jakarta Sans variable (400–800) autoalojada, la misma letra de XASKA POS; títulos en 800, subtítulos 700, botones 600, texto 400. El motivo gráfico es el rombo, con moderación. Estilo bento, el de XASKA POS: tarjetas redondeadas, tarjeta destacada en degradado índigo y paneles en índigo profundo (componentes Card, PageHeader y ScreenCard). Contraste WCAG 2.2 AA (tabla en DECISIONES.md).
- Contenido aprobado: misión = opción 2, visión = opción 1. Planes Emprende $34.900/mes, Negocio $69.900/mes y Empresa $129.900/mes (el año vale 10 meses; detalle en DECISIONES.md, "Planes por nivel"); prueba gratis de 14 días sin tarjeta; estoy excluido de IVA (no se menciona IVA). No uses la palabra "facturación" para describir el producto, y no digas ni insinúes que emite factura electrónica DIAN.
- Prohibido inventar clientes, testimonios, cifras, calificaciones, equipo o años de experiencia.

Cómo trabajamos:
- Por fases. No pases a la siguiente sin que yo apruebe la actual.
- Todo debe pasar `pnpm verify` (formato, lint, astro check + tipos del Worker, build y pruebas Playwright) antes de entregarme algo.
- Si algo es ambiguo, pregúntame. Si asumes algo, déjalo escrito en docs/DECISIONES.md (fecha, decisión, motivo, alternativa descartada).
- Lo que solo yo puedo hacer (cuentas, DNS, claves, conectar el repo) no lo simules: dame los pasos exactos y espera mi confirmación. Nunca me pidas pegar claves secretas en el chat.
- Al terminar cada fase: actualiza docs/ROADMAP-Y-TRASPASO.md, docs/DECISIONES.md, docs/PENDIENTES.md (con `pnpm pendientes`) y el README, y dime cómo probarlo en mi PC.

Primera tarea: confirma en pocas líneas que entendiste el estado, dime si ves algo inconsistente en el proyecto y espera lo que te pida.
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
