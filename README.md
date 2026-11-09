# xaska-hub

Sitio corporativo de XASKA (`xaska.co`). Astro 7 + TypeScript estricto + Tailwind CSS 4, salida estática, desplegado en Cloudflare Workers con assets estáticos.

> XASKA POS vive aparte en `app.xaska.co`. Este repositorio no toca su código, su DNS ni sus cabeceras.

## Requisitos

- Node **24.22.1** o superior dentro de la 24 (ver `.nvmrc`). Descarga: https://nodejs.org (versión 24 LTS).
- pnpm **12.15.0** (`corepack enable pnpm` o `npm install -g pnpm@12.15.0`).

## Cómo correrlo (Windows, PowerShell)

```powershell
cd C:\Users\danii\Documents\GitHub\Xaska-HUB
pnpm install
pnpm dev
```

Abre http://localhost:4321. Los cambios se ven al guardar.

Para ver el sitio igual que en Cloudflare (con cabeceras, CSP y página 404):

```powershell
pnpm preview
```

Abre http://localhost:8787. La CSP solo se aplica en el build, no en `pnpm dev`.

El formulario de contacto necesita el Worker, así que solo funciona con `pnpm preview` (no con `pnpm dev`). Antes de la primera vez, copia `.dev.vars.example` como `.dev.vars`; trae las claves de prueba de Cloudflare y el correo simulado. Para los envíos reales sigue `docs/GUIA-CUENTAS.md`.

## Comandos

| Comando                             | Qué hace                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                          | Servidor de desarrollo                                                   |
| `pnpm build`                        | Genera el sitio en `dist/` y lista los pendientes                        |
| `pnpm pendientes`                   | Lista pendientes y actualiza `docs/PENDIENTES.md`                        |
| `pnpm preview`                      | Build + servidor local de Cloudflare (Wrangler)                          |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                                                   |
| `pnpm format` / `pnpm format:check` | Prettier                                                                 |
| `pnpm check`                        | `astro check` y tipos del Worker                                         |
| `pnpm types:worker`                 | Regenera los tipos del Worker tras cambiar Wrangler                      |
| `pnpm test:install`                 | Descarga el navegador de Playwright (una sola vez)                       |
| `pnpm test`                         | Pruebas de humo, SEO y accesibilidad (axe); necesita `pnpm build` antes  |
| `pnpm verify`                       | Todo lo anterior, en el mismo orden que la CI                            |
| `pnpm lighthouse`                   | Lighthouse móvil sobre el build (meta ≥ 95); necesita `pnpm build` antes |
| `pnpm og:image`                     | Regenera la imagen para redes (`public/og/xaska-og.png`)                 |

## Dónde se cambia cada cosa

- **Datos de la empresa, contacto, enlaces y banderas:** `src/config/site.ts`. Ninguna página repite estos datos.
- **Colores, tipografía, espaciado, radios y sombras:** `src/styles/global.css` (tokens). La tabla de contrastes está en `docs/DECISIONES.md`.
- **Estilo bento (el de XASKA POS):** las piezas que arman cada página están en `src/components/`:
  - `PageHeader.astro`: encabezado con la tarjeta grande (`tone="feature"`, degradado índigo, o `tone="deep"`, índigo profundo), la palabra gigante opcional (`word="POS"`) y las tarjetas de al lado (slot `visual`).
  - `Card.astro`: tarjeta (`tone` default, feature o deep; `size="panel"` para bloques grandes).
  - `ScreenCard.astro`: captura de XASKA POS en tarjeta, completa (`fit="full"`) o con acercamiento (`fit="zoom"`).
  - `Icon.astro`: íconos de trazo. El ícono de cada servicio se elige en `src/lib/service-icons.ts`.
  - `Steps.astro`, `Faq.astro`, `RomboList.astro`, `CTA.astro` y `WhatsAppButton.astro`.
- **Capturas de XASKA POS:** `src/assets/pos/` (sin datos de clientes reales; las del encabezado, al doble de resolución).
- **Tipografía:** Plus Jakarta Sans variable (la misma de XASKA POS), en `src/assets/fonts/plus-jakarta-sans/` y declarada en `astro.config.mjs`. Títulos en 800, subtítulos 700, botones 600 y texto 400.
- **Logo y favicons:** `public/brand/` (archivos oficiales, sin modificar).
- **Páginas:** `src/pages/`. **Componentes:** `src/components/`. **Plantilla base:** `src/layouts/BaseLayout.astro`.
- **Formulario de contacto:** `src/components/ContactForm.astro` (pantalla), `src/lib/contact.ts` (reglas de validación) y `worker/index.ts` (servidor: Turnstile y Resend).
- **Textos legales:** `src/content/legal/` (revisados por el abogado: `reviewed: true`). Si cambias uno, actualiza su fecha `updated`.
- **Cabeceras de seguridad:** `public/_headers` (la CSP de scripts y estilos la genera Astro en cada página; ver `astro.config.mjs`).
- **Textos del sitio:** `src/content/` (ver "Cómo editar textos").
- **SEO:** el título y la descripción de cada página están en su archivo de `src/content/` (campo `seo`). Open Graph, Twitter Card, canonical y el JSON-LD de la organización los pone `BaseLayout.astro`; los datos estructurados se arman en `src/lib/structured-data.ts`. La imagen para redes es `public/og/xaska-og.png` (`pnpm og:image`).
- **Sitemap:** lo genera `@astrojs/sitemap` en el build (`astro.config.mjs`, con las páginas excluidas). `public/robots.txt` apunta a él.

## Cómo editar textos

| Página                                      | Archivo                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Inicio                                      | `src/content/home/index.yaml`                                                               |
| Nosotros (incluye misión, visión y valores) | `src/content/about/index.md`                                                                |
| Servicios                                   | `src/content/services-page/index.yaml` y un archivo por servicio en `src/content/services/` |
| Productos                                   | `src/content/products/index.yaml`                                                           |
| XASKA POS                                   | `src/content/pos/index.yaml`                                                                |
| Preguntas frecuentes de XASKA POS           | `src/content/faq/xaska-pos.yaml`                                                            |

- Si un texto tiene dos puntos (`:`), ponlo entre comillas en el YAML.
- **Aprobar un texto:** borra la línea `# [BORRADOR] ...` del inicio del archivo.
- **Elegir misión y visión:** en `src/content/about/index.md`, cambia `selected: null` por `0`, `1` o `2`.
- **Ver qué falta:** `pnpm pendientes` lista cada borrador y dato pendiente con su archivo y línea, y actualiza `docs/PENDIENTES.md`.
- Mientras haya pendientes, el sitio muestra la franja "Versión de prueba" y no se indexa. El build de producción (rama `main`) falla hasta que no quede ninguno.

## Banderas (`src/config/site.ts`)

| Bandera         | Valor   | Efecto                                                                                                                                                                          |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POS_LAUNCHED`  | `true`  | Botón principal "Probar gratis 14 días" hacia el registro de XASKA POS (desde el 2026-11-09). En `false` vuelve a "Pedir una demo" por WhatsApp.                                |
| `SHOW_HARDWARE` | `false` | Línea de hardware oculta: no hay `/hardware`, ni enlaces, ni opción en el formulario, ni entrada en el sitemap.                                                                 |
| `ANALYTICS`     | `true`  | Cloudflare Web Analytics, sin cookies. Solo carga si además existe la variable de build `PUBLIC_CF_ANALYTICS_TOKEN` (está en Cloudflare; en tu PC y en la CI no).               |
| `E_INVOICING`   | `false` | La página de XASKA POS dice que todavía no emite factura electrónica. En `true` muestra los textos de `eInvoicing` (`src/content/pos/index.yaml`), que hay que completar antes. |

## Cómo se publica un cambio

El sitio está publicado en https://xaska.co. Cloudflare lo construye solo desde GitHub; no se sube nada a mano.

1. Trabaja en la rama `desarrollo`. Revisa en tu PC con `pnpm dev` y corre `pnpm verify` (debe terminar en verde).
2. Sube: `git add -A`, `git commit -m "..."` y `git push`. Lo que llega a `desarrollo` es una versión de prueba: no cambia `xaska.co`.
3. Publica: en GitHub, **Pull requests → New pull request**, con **base `main`** y **compare `desarrollo`**. Cuando la CI quede en verde, **Merge pull request**. (O en PowerShell: `git checkout main`, `git pull`, `git merge desarrollo`, `git push`, `git checkout desarrollo`.)
4. En Cloudflare (**Workers & Pages → xaska-hub → Deployments**) aparece el despliegue de `main`; en unos 2 minutos está en `xaska.co`.
5. **Volver atrás:** en esa misma lista, en una versión anterior, **··· → Deploy version**.

El build de `main` es de producción: falla a propósito si queda algún `PENDIENTE:` o `[BORRADOR]`. Cómo se montó todo (GitHub, Cloudflare, DNS, dominio, Search Console) está en `docs/GUIA-PUBLICACION.md`.

## Lighthouse en tu PC

`pnpm lighthouse` mide en tu equipo. Algunos antivirus (por ejemplo Kaspersky) y extensiones meten scripts en todas las páginas que abre el navegador, incluso en `127.0.0.1`, y eso baja las notas (sobre todo "buenas prácticas"). Cuando pasa, el script lo avisa al final. Para medir limpio, desactiva un momento la opción del antivirus que inyecta scripts en el tráfico web (en Kaspersky está en la configuración de red, con un nombre parecido a "Inyectar script en el tráfico web"), o agrega `127.0.0.1` a sus direcciones de confianza (exclusiones de análisis del tráfico). Si no, fíate de la medición de la CI de GitHub, que corre sin antivirus.

## Documentación

- `docs/ROADMAP-Y-TRASPASO.md`: estado del proyecto, lo que falta y el texto para seguir en otra conversación.
- `docs/DECISIONES.md`: decisiones técnicas y de diseño, con motivo y alternativa descartada, y la tabla de contrastes.
- `docs/PENDIENTES.md`: lo que falta aportar o decidir.
- `docs/GUIA-PUBLICACION.md`: cómo se publicó (GitHub, Cloudflare, DNS, dominio, Search Console).
- `docs/GUIA-CUENTAS.md`: pasos para Turnstile, Resend y el límite de envíos.
