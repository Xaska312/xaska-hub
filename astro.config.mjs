// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { flags } from './src/config/site.ts';

/** Páginas que existen pero no deben ir en el sitemap (resultados del formulario). */
const NOT_IN_SITEMAP = ['/contacto/enviado', '/contacto/no-enviado', '/404'];

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://xaska.co',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        if (NOT_IN_SITEMAP.includes(path)) return false;
        if (!flags.SHOW_HARDWARE && path === '/hardware') return false;
        return true;
      },
    }),
  ],
  fonts: [
    {
      // Plus Jakarta Sans variable (pesos 400 a 800), el mismo archivo que usa XASKA POS.
      provider: fontProviders.local(),
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-jakarta',
      fallbacks: ['system-ui', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2'],
            weight: '400 800',
            style: 'normal',
          },
        ],
      },
    },
  ],
  markdown: {
    // Shiki usa estilos en línea incompatibles con la CSP. No se resalta código en este sitio.
    syntaxHighlight: false,
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
