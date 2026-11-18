/** Páginas publicadas (las que van en el sitemap). Compartido por las pruebas. */
export const publishedPages = [
  '/',
  '/productos',
  '/productos/xaska-pos',
  '/aska',
  '/para/restaurantes',
  '/para/tiendas',
  '/para/servicios',
  '/para/droguerias',
  '/para/distribuidores',
  '/servicios',
  '/servicios/desarrollo-a-medida',
  '/servicios/automatizacion',
  '/servicios/paginas-web',
  '/servicios/consultoria',
  '/servicios/equipos-y-computadores',
  '/nosotros',
  '/contacto',
  '/legal/privacidad',
  '/legal/terminos',
] as const;

/** Páginas que existen pero no se indexan ni van en el sitemap. */
export const unlistedPages = ['/contacto/enviado', '/contacto/no-enviado'] as const;
