# Guía de publicación (fase 4)

Pasos para publicar el hub en `xaska.co`. Todo lo hace Daniel con su cuenta. Los pasos van en orden: cada etapa supone que la anterior quedó bien.

> **Reglas de seguridad**
>
> - Nunca pegues claves secretas (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`) en un chat, un archivo del repositorio o una captura.
> - No toques el registro de `app.xaska.co` (XASKA POS) ni los del correo de Spacemail, salvo para copiarlos tal cual a Cloudflare.

## Resumen

| Etapa | Qué pasa                                                                       | ¿Afecta lo que ya funciona?                               |
| ----- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| A     | Subir el proyecto a GitHub en la rama `desarrollo`                             | No                                                        |
| B     | Conectar el repositorio a Cloudflare y ver el sitio en una dirección de prueba | No                                                        |
| C     | Cuentas de Turnstile y Resend (`docs/GUIA-CUENTAS.md`) y probar el formulario  | No                                                        |
| D     | Mover el DNS de Spaceship a Cloudflare                                         | Sí, si se copia mal un registro. Es la etapa más delicada |
| E     | Día de publicación: fecha de vigencia, analítica, rama `main` y dominio        | No (el POS y el correo siguen igual)                      |
| F     | Después de publicar: `www`, Search Console y comprobaciones                    | No                                                        |

Las ramas funcionan así:

- **`desarrollo`:** donde se trabaja. Hasta el día de publicación, Cloudflare la publica en su dirección de prueba (`*.workers.dev`) como versión de prueba, con franja y `noindex`.
- **`main`:** producción. Su build falla a propósito mientras quede algún `PENDIENTE:` (hoy, la fecha de vigencia y los textos de la factura electrónica). Por eso `main` se crea el día de publicación, y ese día pasa a ser la rama de producción en Cloudflare.

---

## A. Subir el proyecto a GitHub

1. Entra a https://github.com/new con tu cuenta `Xaska312`:
   - **Repository name:** `xaska-hub`
   - **Visibility:** Private (no hay nada secreto, pero no hace falta que sea público).
   - **No** marques "Add a README", ni `.gitignore`, ni licencia: el repositorio debe quedar vacío.
   - **Create repository.**
2. En PowerShell, en la carpeta del proyecto:

   ```powershell
   cd C:\Users\danii\Documents\GitHub\Xaska-HUB
   git init -b desarrollo
   git add .
   git status
   ```

3. Revisa la lista de `git status`. **No** debe aparecer ninguno de estos:
   - `.dev.vars` o `.env` (claves locales)
   - `node_modules/`, `dist/`, `.astro/`, `.wrangler/`
   - `_to_delete/`, `_capturas/`, `xaska-logo.zip`, `lighthouse-report/`

   Si aparece alguno, avísame antes de seguir.

4. Primer commit y subida:

   ```powershell
   git commit -m "Hub de XASKA: fases 0 a 3"
   git remote add origin https://github.com/Xaska312/xaska-hub.git
   git push -u origin desarrollo
   ```

5. En GitHub → **Actions** debe aparecer la CI corriendo sobre `desarrollo` (formato, lint, tipos, build, pruebas y Lighthouse). Tarda unos 10 minutos y debe terminar en verde.

## B. Conectar el repositorio a Cloudflare

Mientras no publiquemos, la rama de producción de Cloudflare es **`desarrollo`**. Así Cloudflare crea el Worker y lo publica solo en su dirección de prueba (`*.workers.dev`), siempre como versión de prueba: con franja y `noindex`, porque el sitio solo se arma en modo producción desde la rama `main`. El día de publicación se cambia a `main` (etapa E).

1. Entra a https://dash.cloudflare.com (crea la cuenta si aún no la tienes y activa la verificación en dos pasos).
2. **Workers & Pages → Create application → Import a repository** (o "Continue with GitHub"). Autoriza la app de Cloudflare en GitHub **solo para el repositorio `xaska-hub`** y elígelo.
3. Configura:
   - **Project name:** `xaska-hub` (igual a `name` en `wrangler.jsonc`).
   - **Git branch / Production branch:** `desarrollo`.
   - **Build command:** `pnpm build`
   - **Deploy command:** `pnpm exec wrangler deploy`
   - **Root directory:** vacío (la raíz del repositorio).
   - Node y pnpm no hay que configurarlos: Cloudflare usa la versión de `.nvmrc` (Node 24.22.1) y la de `packageManager` en `package.json` (pnpm 12.15.0).
4. **Create and deploy.** El primer build tarda unos minutos. Si falla, cópiame el registro (**View build → Build log**) desde la primera línea en rojo.
5. Cuando termine, Cloudflare muestra la dirección `https://xaska-hub.<tu-subdominio>.workers.dev`. Ábrela: debe verse igual que con `pnpm preview`, con la franja "Versión de prueba".
6. **Anota esa dirección.** Hay que agregarla a los hostnames del widget de Turnstile (etapa C).
7. **Settings → Build → Variables and secrets:** agrega `PUBLIC_TURNSTILE_SITE_KEY` cuando la tengas (etapa C). Mientras no exista, la versión de prueba usa la clave de prueba de Cloudflare.

Desde ahora, cada `git push` a `desarrollo` vuelve a publicar la versión de prueba en esa dirección.

Si al desplegar Cloudflare dice que tu plan no admite `ratelimits`, sigue la sección "Límite de envíos" de `docs/GUIA-CUENTAS.md`.

## C. Cuentas del formulario

Sigue `docs/GUIA-CUENTAS.md`, pasos 2 a 4 (Turnstile, Resend y secretos en Cloudflare).

- Los registros DNS de Resend (`envios.xaska.co`) se pueden crear ya en Spaceship. En la etapa D se copian a Cloudflare como cualquier otro.
- Prueba el formulario en la dirección de previsualización. Debe llegar el correo a `soporte@xaska.co` y, al responder, el destinatario debe ser el visitante.

## D. Mover el DNS a Cloudflare

Spaceship sigue siendo el **registrador** (allí pagas el dominio). Solo cambia quién responde el DNS. Hazlo en un horario de poco uso del POS.

### D1. Antes de empezar, en Spaceship

1. Entra a **Spaceship → xaska.co → DNS** y **toma capturas de todos los registros**. Guárdalas en `_capturas/dns-spaceship/` (esa carpeta no se sube a GitHub). Deben aparecer, al menos:
   - **A** `app` → la IP del servidor de Contabo (XASKA POS).
   - **MX** del correo (Spacemail).
   - **TXT** de SPF (`v=spf1 …`), **TXT** de DKIM y **TXT** `_dmarc`.
   - **SRV** y **CNAME** del correo (por ejemplo, `autodiscover`), si existen.
   - Los de Resend, si ya los agregaste.
2. Revisa si **DNSSEC** está activado en Spaceship. Si lo está, **desactívalo** y espera **al menos 24 horas** antes de cambiar los nameservers. Si no lo haces, el dominio completo (POS y correo incluidos) puede dejar de resolver. Para saber si ya se puede, en PowerShell:

   ```powershell
   nslookup -type=DS xaska.co 1.1.1.1
   ```

   Si la respuesta ya **no** trae registros `DS` (sale algo como "No answer" o solo datos de `SOA`), se puede cambiar. Si todavía aparecen, espera más.

### D2. En Cloudflare

1. **Add a domain → `xaska.co`** → plan **Free** → deja que haga el escaneo rápido de registros.
2. Compara **uno por uno** los registros que importó con tus capturas:
   - Falta alguno → agrégalo igual (tipo, nombre, valor, prioridad).
   - Sobra alguno que no está en Spaceship → bórralo.
   - **`app`** (registro A): debe quedar con la **nube gris ("DNS only")**. Así XASKA POS sigue igual: con su propio certificado y sus propias cabeceras, sin pasar por Cloudflare.
   - **Todos los del correo** (MX, TXT, SRV, CNAME de Spacemail y de Resend): **nube gris**.
   - Si hay un registro **A o CNAME para `xaska.co` (la raíz) o `www`** (por ejemplo, una página de aparcamiento de Spaceship), **bórralo**. La raíz la ocupará el Worker en la etapa E.
3. Cloudflare te muestra **dos nameservers** (algo como `xxx.ns.cloudflare.com`). Cópialos.

### D3. Cambiar los nameservers en Spaceship

1. **Spaceship → xaska.co → Nameservers → Custom** → pega los dos de Cloudflare → guarda.
2. Espera a que Cloudflare marque el dominio como **Active** (minutos a unas horas; Cloudflare te avisa por correo).

### D4. Comprobar que nada se rompió

En PowerShell:

```powershell
nslookup -type=NS xaska.co
nslookup app.xaska.co
nslookup -type=MX xaska.co
```

- `NS` debe mostrar los nameservers de Cloudflare.
- `app.xaska.co` debe dar la **misma IP de Contabo** que antes (si da una IP de Cloudflare, la nube de `app` quedó naranja: ponla gris).
- Abre https://app.xaska.co e inicia sesión.
- Envíate un correo a `soporte@xaska.co` desde otra cuenta y responde uno desde Spacemail.

Si algo falla, el arreglo casi siempre es un registro que no se copió: compáralo con tus capturas. Como último recurso, en Spaceship puedes volver a sus nameservers por defecto.

### D5. Volver a activar DNSSEC, ahora con Cloudflare

Cuando todo lleve un día funcionando bien:

1. Cloudflare → **xaska.co → DNS → Settings → DNSSEC → Enable**. Te muestra un registro **DS** (Key Tag, Algorithm, Digest Type y Digest).
2. Spaceship → **xaska.co → DNSSEC** → agrega ese DS con los mismos datos.
3. Cloudflare marca DNSSEC como **Active** en unas horas.

## E. Día de publicación

1. **Factura electrónica:** si ya salió en el POS, dame los detalles (documentos, proveedor, costo y cómo se activa) y completo los textos de `eInvoicing`, con `E_INVOICING: true`. Si todavía no está lista y quieres publicar igual, se dejan los textos con la bandera apagada y quito sus `PENDIENTE:`.
2. **Analítica:** Cloudflare → **Analytics & Logs → Web Analytics → Add a site → `xaska.co`**:
   - Elige la instalación **manual (JS snippet)** y deja **desactivada** la inyección automática.
   - Copia el **token** (el valor de `"token"` en el fragmento). Es público.
   - Agrégalo en **Workers & Pages → xaska-hub → Settings → Build → Variables** como `PUBLIC_CF_ANALYTICS_TOKEN`.
   - Me avisas y pongo `ANALYTICS: true` en `site.ts`. ✅ Hecho el 2026-11-02.
3. **Fecha de vigencia:** pongo la fecha del día en la política de privacidad.
4. Con todo en verde en `desarrollo` (`pnpm verify` y la CI), crea la rama de producción:

   ```powershell
   git checkout -b main
   git push -u origin main
   ```

   En Cloudflare: **Workers & Pages → xaska-hub → Settings → Build → Branch control → Production branch: `main`** → guarda y vuelve a desplegar (**Deployments → Retry** o un `git push` a `main`). Cloudflare construye `main` en modo producción: sin franja de prueba, sin `noindex` y con la revisión de pendientes estricta. Si el build falla por un pendiente, el mensaje dice cuál.

   Desde ese día se trabaja así: los cambios se hacen en `desarrollo` y, cuando estén listos, se pasan a `main` con un pull request en GitHub (la CI debe quedar en verde antes de fusionar).

5. **Dominio:** **Workers & Pages → xaska-hub → Settings → Domains & Routes → Add → Custom domain → `xaska.co`.** Cloudflare crea el registro y el certificado solo.
6. Abre https://xaska.co. Debe cargar el sitio sin la franja "Versión de prueba".

## F. Después de publicar

1. **`www` → `xaska.co` (redirección 301):**
   - **DNS → Add record:** tipo `AAAA`, nombre `www`, contenido `100::`, **nube naranja (Proxied)**.
   - **Rules → Redirect Rules → Create rule** (o la plantilla "Redirect from WWW to root"):
     - Si `Hostname` es igual a `www.xaska.co`.
     - **Dynamic redirect** a `concat("https://xaska.co", http.request.uri.path)`, **301**, conservando la query string.
   - Comprueba en PowerShell: `curl.exe -I https://www.xaska.co/servicios` debe responder `301` con `location: https://xaska.co/servicios`.
2. **Cabeceras:** `curl.exe -I https://xaska.co` debe mostrar `strict-transport-security: max-age=31536000` (sin `includeSubDomains`), `x-content-type-options: nosniff` y `content-security-policy: frame-ancestors 'none'`. Y `curl.exe -I https://app.xaska.co` **no** debe mostrar esas cabeceras del hub.
3. **Google Search Console:** https://search.google.com/search-console → **Agregar propiedad → Dominio → `xaska.co`**. Te da un registro **TXT**: agrégalo en Cloudflare DNS (nube gris) y pulsa **Verificar**. Luego **Sitemaps → `https://xaska.co/sitemap-index.xml` → Enviar**.
4. **Lighthouse de producción** (sin la excepción de "página indexable"), en PowerShell:

   ```powershell
   $env:LIGHTHOUSE_STRICT=1; pnpm build; pnpm lighthouse
   ```

   (Ojo con el antivirus: ver "Lighthouse en tu PC" en el README.)

5. **Formulario en producción:** envía un mensaje desde https://xaska.co/contacto y revisa que llegue a `soporte@xaska.co`.
6. **Tarjetas:** ya se pueden repartir.
7. Avísame para cerrar la fase 4: actualizo el roadmap, las decisiones y los pendientes.
