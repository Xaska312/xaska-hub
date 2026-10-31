/**
 * Fuente única de los datos de la empresa, contacto y banderas del sitio.
 * Ninguna página debe repetir estos datos: siempre se importan desde aquí.
 *
 * Los marcadores de pendientes y borradores se explican en src/lib/pendientes.ts.
 * Cada marcador de este archivo aparece en `pnpm pendientes`.
 */

export const flags = {
  /**
   * true: el botón principal lleva al registro de XASKA POS ("Probar gratis 14 días").
   * false: el botón principal es "Pedir una demo" por WhatsApp.
   * Hoy en false: el registro exige un código de activación que se entrega en la demo.
   */
  POS_LAUNCHED: false,
  /** Línea de hardware. En `false` no se genera `/hardware` ni aparece en ningún menú, formulario o sitemap. */
  SHOW_HARDWARE: false,
  /**
   * Cloudflare Web Analytics (sin cookies). Solo se carga si además existe la variable de build
   * PUBLIC_CF_ANALYTICS_TOKEN. Hoy en false: se activa en la fase 4, cuando el sitio esté publicado.
   */
  ANALYTICS: false,
  /**
   * Factura electrónica en XASKA POS. En false el sitio dice que todavía no la tiene.
   * Se pone en true el mismo día que salga en el POS (textos en src/content/pos/index.yaml, eInvoicing).
   */
  E_INVOICING: false,
} as const;

export const site = {
  name: 'XASKA',
  tagline: 'Soluciones tecnológicas',
  url: 'https://xaska.co',
  locale: 'es-CO',
  /** En proceso de formalización: no publicar razón social, NIT ni tipo societario. */
  legal: {
    legalName: null,
    taxId: null,
  },
  city: 'Ibagué, Tolima, Colombia',
  country: 'CO',
} as const;

/** Imagen para redes sociales (Open Graph y Twitter Card). Se genera con `pnpm og:image`. */
export const ogImage = {
  path: '/og/xaska-og.png',
  width: 1200,
  height: 630,
  alt: 'XASKA, soluciones tecnológicas',
} as const;

/** Logo cuadrado para los datos estructurados (JSON-LD). Archivo oficial, sin modificar. */
export const structuredDataLogo = {
  path: '/brand/png/xaska-icono-1024.png',
  width: 1024,
  height: 1024,
} as const;

export const founder = {
  name: 'Daniel Felipe Mejía Martínez',
  role: 'Fundador y director de proyectos',
} as const;

export const contact = {
  email: 'soporte@xaska.co',
  whatsapp: {
    display: '+57 316 778 4193',
    number: '573167784193',
  },
  hours: 'Lunes a sábado, de 8:00 a. m. a 6:00 p. m.' as string | null,
} as const;

export const products = {
  pos: {
    name: 'XASKA POS',
    path: '/productos/xaska-pos',
    appUrl: 'https://app.xaska.co',
    /** Registro (se usa cuando POS_LAUNCHED es true). */
    trialUrl: 'https://app.xaska.co/registro',
    loginUrl: 'https://app.xaska.co/login',
    termsUrl: 'https://app.xaska.co/terminos',
    privacyUrl: 'https://app.xaska.co/privacidad',
    trialLabel: 'Probar gratis 14 días',
    demoLabel: 'Pedir una demo',
    manualUrl: 'https://app.xaska.co/manual',
  },
} as const;

export const hardware = {
  // Sin uso por ahora: los equipos van como el servicio "Equipos y computadores" (2026-10-31).
  // Esta línea aparte solo volvería si se abre una marca propia (p. ej. gaming).
  name: 'Xaska Tech',
  slug: 'hardware',
  path: '/hardware',
} as const;

/** Enlace de WhatsApp con mensaje prellenado opcional. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${contact.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const whatsappMessages = {
  general: 'Hola, quiero más información sobre XASKA',
  pos: 'Hola, quiero probar XASKA POS',
  demo: 'Hola, quiero pedir una demo de XASKA POS',
  services: 'Hola, quiero hablar sobre un proyecto',
  about: 'Hola, quiero conocer más sobre XASKA',
  hardware: 'Hola, quiero información sobre ensamble de computadores',
  notFound: 'Hola, estaba en xaska.co y no encontré lo que buscaba',
} as const;

export interface NavItem {
  label: string;
  href: string;
}

const baseNav: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
];

export const mainNav: NavItem[] = flags.SHOW_HARDWARE
  ? [...baseNav.slice(0, 3), { label: hardware.name, href: hardware.path }, ...baseNav.slice(3)]
  : baseNav;

/** Opciones del campo "interés" del formulario de contacto (fase 2). */
export const interestOptions: readonly string[] = [
  'XASKA POS',
  'Desarrollo a medida',
  'Automatización',
  'Página web',
  'Consultoría',
  'Equipos y computadores',
  ...(flags.SHOW_HARDWARE ? [hardware.name] : []),
  'Otro',
];

/** Botón principal según el estado del POS. */
export const primaryCta = flags.POS_LAUNCHED
  ? { label: 'Probar gratis', longLabel: products.pos.trialLabel, href: products.pos.trialUrl }
  : {
      label: products.pos.demoLabel,
      longLabel: products.pos.demoLabel,
      href: whatsappUrl(whatsappMessages.demo),
    };

/** El botón principal ya es WhatsApp: las páginas no deben poner otro botón de WhatsApp al lado. */
export const primaryCtaIsWhatsApp = !flags.POS_LAUNCHED;
