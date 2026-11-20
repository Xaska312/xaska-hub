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
   * En true desde el 2026-11-09: el registro del POS ya no exige código (decisión 303 del POS).
   */
  POS_LAUNCHED: true,
  /** Línea de hardware. En `false` no se genera `/hardware` ni aparece en ningún menú, formulario o sitemap. */
  SHOW_HARDWARE: false,
  /**
   * Cloudflare Web Analytics (sin cookies). Solo se carga si además existe la variable de build
   * PUBLIC_CF_ANALYTICS_TOKEN (configurada en Cloudflare). En local y en la CI no hay token, así
   * que no se carga. Activada el 2026-11-02 (fase 4).
   */
  ANALYTICS: true,
  /**
   * Factura electrónica en XASKA POS. En false el sitio dice que todavía no la tiene.
   * Se pone en true el mismo día que salga en el POS (textos en src/content/pos/index.yaml, eInvoicing).
   */
  E_INVOICING: false,
  /**
   * Chat "Pregúntale a Aska" en todas las páginas (AskaChat.astro). Habla con XASKA POS
   * (decisión 364 del POS, rama aska-web). Se pone en true cuando esa versión del POS ya esté
   * desplegada en app.xaska.co; antes, la burbuja no tendría con quién hablar.
   */
  ASKA_CHAT: true,
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

/**
 * Perfiles reales de XASKA en redes (dados por Daniel el 2026-11-15). Salen en el pie de
 * página y en los datos estructurados (sameAs). No poner perfiles que no se usen.
 * Facebook usa por ahora el enlace de "Compartir"; cambiarlo por la dirección de la página
 * (facebook.com/<usuario>) cuando se tenga.
 */
export const socialProfiles: readonly { name: string; url: string }[] = [
  { name: 'Instagram', url: 'https://www.instagram.com/xaskapos/' },
  { name: 'Facebook', url: 'https://www.facebook.com/share/1A7gp8Sy7H/' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/xaska/' },
];

export const contact = {
  email: 'soporte@xaska.co',
  whatsapp: {
    // Desde el 2026-11-18 lo responde primero un asistente de IA, las 24 horas, que pasa con
    // Daniel cuando hace falta (ver assistant).
    display: '+57 324 556 0729',
    number: '573245560729',
  },
  /** Horario de atención de personas (el asistente de WhatsApp responde siempre). */
  hours: 'Lunes a sábado, de 8:00 a. m. a 6:00 p. m.' as string | null,
  /** Cómo se dice en el sitio quién responde el WhatsApp. */
  assistant:
    'Te responde nuestro asistente al instante, a cualquier hora, y si hace falta te pasa con Daniel.',
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
    /** Precios públicos del POS (planes, XASKA IA y adicionales), sin iniciar sesión. */
    pricingUrl: 'https://app.xaska.co/precios',
  },
  /**
   * ASKA: la IA de XASKA POS. En el POS se vende como el adicional "XASKA IA".
   * Precio tomado de Planes y pagos del POS (2026-11-09). Sin mención de IVA.
   */
  aska: {
    name: 'ASKA',
    addonName: 'XASKA IA',
    path: '/aska',
    price: '$39.900',
    trialDays: 14,
    /** Monograma oficial de XASKA IA, copiado sin cambios de XASKA POS (frontend/public/xaska-ia.svg). */
    logo: '/brand/xaska-ia/xaska-ia.svg',
    /**
     * Chat de Aska en esta página (decisión 364 del POS): el mismo asistente del WhatsApp de XASKA, servido por
     * XASKA POS. Público, con topes por IP y por día; las conversaciones se ven en la consola de plataforma del POS.
     */
    chatApi: 'https://app.xaska.co/api/v1/public/aska/chat',
    chatOrigin: 'https://app.xaska.co',
    /** Vendedor por WhatsApp para cada negocio: todavía no existe; el sitio lo anuncia como "próximamente". */
    soonName: 'ASKA Te Atiende',
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
  aska: 'Hola, quiero saber más de ASKA, la IA de XASKA POS',
  askaSoon: 'Hola, quiero que me avisen cuando salga ASKA Te Atiende',
  askaChat: 'Hola, vengo del chat de xaska.co',
} as const;

export interface NavItem {
  label: string;
  href: string;
}

const baseNav: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'ASKA', href: '/aska' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
];

export const mainNav: NavItem[] = flags.SHOW_HARDWARE
  ? [...baseNav.slice(0, 4), { label: hardware.name, href: hardware.path }, ...baseNav.slice(4)]
  : baseNav;

/** Opciones del campo "interés" del formulario de contacto (fase 2). */
export const interestOptions: readonly string[] = [
  'XASKA POS',
  'ASKA (XASKA IA)',
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
