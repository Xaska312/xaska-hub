/**
 * Genera la imagen Open Graph del sitio (1200×630) en public/og/xaska-og.png.
 *
 *   pnpm og:image
 *
 * Usa el logo oficial sin modificarlo (public/brand/svg/xaska-horizontal-blanco.svg),
 * los colores de marca y Plus Jakarta Sans autoalojada (la letra de la marca). Se dibuja con el Chromium de Playwright,
 * así que necesita `pnpm test:install` una vez. El PNG resultante se versiona en el repositorio;
 * solo hay que volver a generarlo si cambia el diseño.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT = 'public/og/xaska-og.png';

const logo = readFileSync('public/brand/svg/xaska-horizontal-blanco.svg').toString('base64');
const font = readFileSync(
  'src/assets/fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2',
).toString('base64');

const html = `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Plus Jakarta Sans';
    font-weight: 400 800;
    src: url(data:font/woff2;base64,${font}) format('woff2');
  }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    position: relative;
    overflow: hidden;
    background: #111827;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  /* Motivo de rombo, con moderación: un contorno grande que se sale por la esquina. */
  .rombo {
    position: absolute;
    width: 560px;
    height: 560px;
    right: -230px;
    bottom: -300px;
    transform: rotate(45deg);
    border: 1.5px solid #2b3446;
  }
  .rombo.small {
    width: 300px;
    height: 300px;
    left: -170px;
    top: -170px;
    right: auto;
    bottom: auto;
  }
  .logo { width: 600px; height: auto; display: block; }
  .tagline {
    margin-top: 44px;
    color: #aab1be;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    padding-left: 0.32em; /* compensa el espaciado de la última letra */
  }
  .url {
    position: absolute;
    bottom: 48px;
    color: #818cf8;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
</head>
<body>
  <div class="rombo" aria-hidden="true"></div>
  <div class="rombo small" aria-hidden="true"></div>
  <img class="logo" alt="XASKA" src="data:image/svg+xml;base64,${logo}" />
  <p class="tagline">Soluciones tecnológicas</p>
  <p class="url">xaska.co</p>
</body>
</html>`;

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUTPUT, type: 'png' });
  console.log(`Imagen generada: ${OUTPUT} (${WIDTH}×${HEIGHT})`);
} finally {
  await browser.close();
}
