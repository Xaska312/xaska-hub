# Pendientes

Lo que falta aportar o decidir. La sección "Marcadores en el código" se regenera con `pnpm pendientes`.

## Pasos que te tocan

- [x] Node 24 en tu equipo (fase 0 probada en local).
- [x] Repositorio en GitHub (`Xaska312/xaska-hub`) y conectado a Cloudflare (versión de prueba en `xaska-hub.daniimejia1558.workers.dev`).

## Que XASKA aparezca en los buscadores (2026-11-15)

La auditoría del 2026-11-15 encontró 0 enlaces de otros sitios, y en algunos computadores buscar "XASKA" no muestra el sitio. Lo más probable es que esos equipos busquen con Bing (Edge y Windows) y que Bing no conozca el sitio: solo se registró en Google. Lo del código ya está hecho (títulos, negocio local, preguntas frecuentes, `llms.txt`). Lo que te toca:

- [ ] **Bing Webmaster Tools** (`bing.com/webmasters`): entrar con la cuenta de Microsoft → "Importar desde Google Search Console". Cubre también DuckDuckGo y Yahoo.
- [ ] **Cloudflare → Caching → Configuration → Crawler Hints: activado.** Avisa a Bing y otros buscadores (IndexNow) cuando cambia algo.
- [ ] **Search Console → Inspección de URL** de `/`, `/productos/xaska-pos` y `/aska` → "Solicitar indexación" (después de publicar este cambio en `main`).
- [x] **Perfil de empresa en Google** (2026-11-15): "XASKA", empresa de software, servicio en Ibagué y Tolima sin dirección visible.
- [ ] Pasarle a Claude el enlace del perfil de Google ("Compartir perfil") y la dirección definitiva de la página de Facebook (`facebook.com/<usuario>`) para `socialProfiles`.
- [x] **Redes:** Instagram, Facebook y LinkedIn en `socialProfiles` (pie de página y `sameAs`). Revisar que cada una tenga `https://xaska.co` en la biografía.
- [ ] **Enlaces desde lo que ya tienes:** `app.xaska.co` (pie de página y correos) y tu perfil de LinkedIn personal enlazando a `https://xaska.co`.
- [ ] **Directorios de empresas** de Colombia y del Tolima (por ejemplo, el de la Cámara de Comercio de Ibagué cuando XASKA esté formalizada), con el mismo nombre, teléfono y sitio.
- [ ] Repetir la auditoría en unas 4 semanas.

## ASKA (2026-11-09)

- [x] Textos de ASKA y del registro abierto aprobados (2026-11-09).
- [ ] Publicar la política de datos 1.3 en `app.xaska.co/privacidad` y la actualización del POS antes de pasar ASKA a `main`.
- [ ] Opcional: imagen para redes propia de ASKA y capturas reales del panel de ASKA.

## Datos de la empresa (sección 10 del prompt)

- [x] Horario de atención (lunes a sábado, 8:00 a. m. a 6:00 p. m.).
- [x] Botón principal: "Pedir una demo" por WhatsApp. Condiciones de la prueba tomadas del repositorio del POS.
- [x] Planes por nivel publicados: Emprende ($34.900), Negocio ($69.900) y Empresa ($129.900), según el POS (2026-11-05).
- [x] Respuesta sobre DIAN en las preguntas frecuentes ("Todavía no").
- [x] Capturas de XASKA POS sin datos de clientes reales.
- [x] Bio y foto de Daniel Mejía.
- [x] Datos del responsable del tratamiento de datos (nombre y dirección para notificaciones).
- [x] `app.xaska.co/privacidad` y `app.xaska.co/terminos` existen en el repositorio del POS.
- [x] Misión (opción 2) y visión (opción 1) elegidas.
- [x] Aprobar valores y textos (fase 1).
- [ ] Nombre definitivo de la línea de hardware y si se incluye (hoy "Xaska Tech", oculta).
- [x] Cuentas de Cloudflare (Turnstile), Resend y GitHub, y registros DNS de `envios.xaska.co`.
- [x] Revisión del abogado de la política de datos y los términos del sitio.
- [x] Formulario probado con Turnstile y Resend reales (2026-10-31).
- [x] Mover el DNS a Cloudflare (2026-11-02).
- [x] Publicado en `xaska.co` con Search Console (2026-11-02).
- [x] Formulario probado en `xaska.co/contacto` (2026-11-06).
- [ ] Activar DNSSEC con Cloudflare (`docs/GUIA-PUBLICACION.md`, D5).
- [ ] Apagar la dirección `workers.dev` (`docs/GUIA-PUBLICACION.md`, F, paso 7).
- [ ] Factura electrónica en XASKA POS: cuando salga, completar `eInvoicing` en `src/content/pos/index.yaml` y poner `E_INVOICING: true`.

## Marcadores en el código

<!-- inicio:automatico -->

_Generado con `pnpm pendientes`. 0 datos pendientes y 0 borradores por aprobar._

| Tipo | Archivo | Línea | Texto |
| ---- | ------- | ----- | ----- |

<!-- fin:automatico -->
