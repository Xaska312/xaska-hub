# Guía: cuentas para el formulario de contacto

Pasos que te tocan a ti para que el formulario envíe correos de verdad. Mientras tanto, el sitio funciona en local con las claves de prueba de Cloudflare y el correo simulado.

> Nunca pegues en un chat, en un archivo del repositorio ni en una captura las claves secretas (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`). Solo van en Cloudflare o en tu archivo local `.dev.vars`.

## 1. Probar en tu PC con las claves de prueba (sin cuentas)

1. En la carpeta del proyecto, copia `.dev.vars.example` y renombra la copia a `.dev.vars`. Ya trae la clave secreta de prueba y el correo simulado (`MAIL_TRANSPORT=log`).
2. Ejecuta `pnpm preview` y abre http://localhost:8787/contacto.
3. Verás el recuadro de Cloudflare ("Exitoso" o "Testing only"). Llena el formulario y envíalo: debe salir "Recibimos tu mensaje".
4. Abre las herramientas del navegador (F12) → **Consola**. No debe aparecer ningún error de "Content Security Policy". Si aparece alguno, cópiame el texto.
5. En la ventana de PowerShell debe salir una línea `contacto: correo simulado para soporte@xaska.co`.

## 2. Cloudflare Turnstile (anti-bots)

No necesitas mover el DNS para esto.

1. Crea una cuenta gratis en https://dash.cloudflare.com/sign-up (si aún no la tienes) y activa la verificación en dos pasos.
2. En el menú, entra a **Turnstile** → **Add widget**.
3. Configura:
   - **Widget name:** `xaska-hub formulario`
   - **Hostnames:** `xaska.co`, `www.xaska.co` y `localhost`. Cuando conectes el repositorio a Cloudflare, agrega también la dirección `xaska-hub.<tu-cuenta>.workers.dev`.
   - **Widget mode:** Managed.
   - **Pre-clearance:** No.
4. Al crearlo te muestra dos claves:
   - **Site key** (pública): va en la variable de build `PUBLIC_TURNSTILE_SITE_KEY`. Para probar en local, créala en un archivo `.env` en la carpeta del proyecto: `PUBLIC_TURNSTILE_SITE_KEY=0x...`
   - **Secret key** (secreta): va como secreto `TURNSTILE_SECRET_KEY`. En local, reemplaza la de prueba en `.dev.vars`.

## 3. Resend (envío del correo)

El plan gratis alcanza de sobra para un formulario: 3.000 correos al mes y 100 al día.

Se usa un subdominio de envío (`envios.xaska.co`) para no tocar los registros del correo de `soporte@xaska.co` (Spacemail).

1. Crea una cuenta en https://resend.com y activa la verificación en dos pasos.
2. **Domains → Add domain:** escribe `envios.xaska.co`. Elige la región que te ofrezca más cercana (por ejemplo, São Paulo si aparece).
3. Resend te muestra los registros DNS (formato de octubre de 2026, región São Paulo). Agrégalos en **Spaceship → tu dominio → DNS** copiando el valor completo de cada uno con el botón de copiar de Resend (en pantalla salen recortados). En "Host" va solo la parte antes de `.xaska.co`:

   | Tipo  | Host                       | Valor (cópialo de Resend)             |
   | ----- | -------------------------- | ------------------------------------- |
   | TXT   | `resend._domainkey.envios` | `p=MIGfMA…` (la clave DKIM, completa) |
   | CNAME | `rsend.envios`             | `rsend-sa….mta.net`                   |
   | CNAME | `send.envios`              | `send.for….mta.net`                   |
   - Deja **apagado** "Enable receiving": el subdominio solo envía.
   - **No cambies** los registros que ya existen: el MX, SPF, DKIM, SRV y DMARC de Spacemail, ni el registro A de `app`.
   - El DMARC que ya tienes en `xaska.co` (`p=none`) también cubre el subdominio. No hace falta otro.
   - **Cuando el DNS pase a Cloudflare (etapa D de la guía de publicación):** estos tres registros se copian igual y van con la **nube gris (DNS only)**. Si los dos CNAME quedan con la nube naranja, Resend deja de poder enviar.

4. En Resend, pulsa **Verify**. Puede tardar desde minutos hasta unas horas. Para comprobarlo desde PowerShell:
   ```powershell
   nslookup -type=TXT resend._domainkey.envios.xaska.co
   nslookup -type=CNAME send.envios.xaska.co
   nslookup -type=CNAME rsend.envios.xaska.co
   ```
5. **API Keys → Create API key:**
   - **Permission:** Sending access.
   - **Domain:** `envios.xaska.co`.
   - Copia la clave (empieza por `re_`). Va como secreto `RESEND_API_KEY`.
6. El remitente ya está configurado en `wrangler.jsonc`: `XASKA <formulario@envios.xaska.co>`. El correo llega a `soporte@xaska.co`, y al darle **Responder** le contestas directamente al visitante (`Reply-To`).

### Prueba real en local

En `.dev.vars` pon tu `TURNSTILE_SECRET_KEY` real, `RESEND_API_KEY=re_...` y `MAIL_TRANSPORT=resend`. En `.env` pon `PUBLIC_TURNSTILE_SITE_KEY`. Luego ejecuta `pnpm preview`, envía un mensaje y revisa que:

- llegue a `soporte@xaska.co`;
- al responder, el destinatario sea el correo que escribiste en el formulario.

## 4. Cuando conectes el repositorio a Cloudflare

En el proyecto `xaska-hub` de Cloudflare:

1. **Settings → Variables and Secrets:** agrega `TURNSTILE_SECRET_KEY` y `RESEND_API_KEY` como **Secret**.
2. **Settings → Build → Variables and secrets:** agrega `PUBLIC_TURNSTILE_SITE_KEY` (es pública, puede ser texto normal).
3. Vuelve a desplegar.

### Límite de envíos

`wrangler.jsonc` trae un límite de 5 envíos por minuto por IP (`ratelimits`). Si al desplegar Cloudflare dice que tu plan no lo permite, borra ese bloque y crea esta regla cuando el dominio esté en Cloudflare:

1. **Security → WAF → Rate limiting rules → Create rule.**
2. **Rule name:** `Formulario de contacto`.
3. **If incoming requests match:** `URI Path` equals `/api/contacto` **and** `Request Method` equals `POST`.
4. **With the same characteristics:** IP.
5. **When rate exceeds:** 3 requests per 10 seconds (el plan gratis solo permite periodos de 10 segundos).
6. **Then take action:** Block, **duration** 10 seconds.
7. **Deploy.**

Además, cada token de Turnstile sirve una sola vez, así que reenviar el mismo formulario no funciona.
