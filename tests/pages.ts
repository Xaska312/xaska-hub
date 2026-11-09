/** Páginas publicadas (las que van en el sitemap). Compartido por las pruebas. */
export const publishedPages = [
  '/',
  '/productos',
  '/productos/xaska-pos',
  '/aska',
  '/servicios',
  '/nosotros',
  '/contacto',
  '/legal/privacidad',
  '/legal/terminos',
] as const;

/** Páginas que existen pero no se indexan ni van en el sitemap. */
export const unlistedPages = ['/contacto/enviado', '/contacto/no-enviado'] as const;
