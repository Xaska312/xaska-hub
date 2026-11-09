/**
 * Colecciones de contenido. Los textos del sitio viven en src/content/ y se validan aquí:
 * si falta un campo o tiene el tipo equivocado, el build falla con un mensaje claro.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.string().min(1);

const home = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/home' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    hero: z.object({ title: text, lead: text }),
    pillars: z.object({
      title: text,
      items: z
        .array(
          z.object({
            title: text,
            text: text,
            link: z.object({ label: text, href: text }).optional(),
          }),
        )
        .length(3),
    }),
    pos: z.object({ title: text, lead: text, highlights: z.array(text).min(3).max(8) }),
    services: z.object({ title: text, lead: text }),
    why: z.object({
      title: text,
      items: z
        .array(z.object({ title: text, text: text }))
        .min(2)
        .max(4),
    }),
    process: z.object({
      title: text,
      steps: z
        .array(z.object({ title: text, text: text }))
        .min(3)
        .max(5),
    }),
    closing: z.object({ title: text, text: text }),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: 'index.md', base: './src/content/about' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    title: text,
    lead: text,
    mission: z.object({
      /** Índice de la opción elegida (0, 1 o 2). Mientras sea null se muestran las tres. */
      selected: z.number().int().min(0).max(2).nullable(),
      options: z.array(z.object({ label: text, text: text })).length(3),
    }),
    vision: z.object({
      selected: z.number().int().min(0).max(2).nullable(),
      options: z.array(z.object({ label: text, text: text })).length(3),
    }),
    values: z
      .array(z.object({ title: text, text: text }))
      .min(4)
      .max(5),
    founder: z.object({ bio: text }),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    title: text,
    order: z.number().int(),
    summary: text,
    forWho: text,
    examples: z.array(text).min(2).max(6),
    deliverables: z.array(text).min(2).max(6),
  }),
});

const servicesPage = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/services-page' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    title: text,
    lead: text,
    process: z.object({
      title: text,
      steps: z
        .array(z.object({ title: text, text: text }))
        .min(3)
        .max(5),
    }),
  }),
});

const products = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/products' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    title: text,
    lead: text,
  }),
});

const pos = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/pos' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    /** Lema corto, igual al de las tarjetas. La última palabra se resalta con el color de acento. */
    slogan: z.array(text).min(2).max(6),
    lead: text,
    problems: z.object({
      title: text,
      items: z
        .array(z.object({ title: text, text: text }))
        .min(2)
        .max(6),
    }),
    audience: z.object({ title: text, text: text }),
    /**
     * Capturas reales de XASKA POS (negocio de prueba, sin datos de clientes).
     * `image` = nombre del archivo en src/assets/pos/ sin extensión. La primera sale grande.
     */
    screens: z.object({
      title: text,
      lead: text,
      items: z
        .array(z.object({ image: text, alt: text, caption: text }))
        .min(1)
        .max(9),
    }),
    capabilities: z.object({
      title: text,
      groups: z
        .array(z.object({ title: text, items: z.array(text).min(1) }))
        .min(2)
        .max(8),
    }),
    /**
     * Factura electrónica: solo se muestra con flags.E_INVOICING en true (site.ts).
     * Agrega un grupo de funciones y cambia la respuesta de la pregunta con id "factura-electronica".
     */
    eInvoicing: z.object({
      group: z.object({ title: text, items: z.array(text).min(1) }),
      faqAnswer: text,
    }),
    plans: z.object({
      title: text,
      lead: text,
      items: z
        .array(
          z.object({
            name: text,
            /** Precio mensual sin "al mes" (la página lo agrega), p. ej. "$34.900". */
            price: text,
            annual: text,
            limits: text,
            features: z.array(text).min(1),
          }),
        )
        .length(3),
      /** Tabla para comparar: en `values`, "sí" y "no" se muestran como íconos. */
      comparison: z.object({
        title: text,
        rows: z.array(z.object({ label: text, values: z.array(text).length(3) })).min(1),
      }),
      note: text,
      /** Invitación a comprar los equipos con XASKA (servicio "Equipos y computadores"). */
      equipment: z.object({ text: text, linkLabel: text }),
    }),
    start: z.object({
      title: text,
      steps: z
        .array(z.object({ title: text, text: text }))
        .min(2)
        .max(4),
    }),
  }),
});

const aska = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/aska' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    /** Título en tres partes: la del medio ("ASKA") va resaltada. */
    hero: z.object({
      eyebrow: text,
      title: z.object({ before: text, accent: text, after: text }),
      lead: text,
    }),
    /** Conversación de ejemplo, sin cifras inventadas. */
    chat: z.object({
      label: text,
      question: text,
      answer: text,
      source: text,
      followUps: z.array(text).min(1).max(3),
    }),
    features: z.object({
      title: text,
      lead: text,
      /** La primera sale a lo ancho, destacada. `icon`: un ícono de src/components/Icon.astro. */
      items: z
        .array(
          z.object({
            icon: z.enum(['chat', 'camera', 'book', 'cart', 'mail', 'box']),
            kicker: text,
            title: text,
            text: text,
          }),
        )
        .min(4)
        .max(8),
    }),
    trust: z.object({
      title: text,
      items: z
        .array(z.object({ title: text, text: text }))
        .min(2)
        .max(5),
    }),
    pricing: z.object({ title: text, text: text, cta: text }),
    soon: z.object({ badge: text, text: text, linkLabel: text }),
    /** Bloque corto que invita a conocer ASKA desde la portada, Productos y XASKA POS. */
    band: z.object({ title: text, text: text, linkLabel: text }),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/faq' }),
  schema: z.object({
    title: text,
    items: z
      .array(
        z.object({
          /** Opcional: para que una página pueda reemplazar la respuesta (p. ej. con una bandera). */
          id: z.string().optional(),
          question: text,
          answer: text,
        }),
      )
      .min(1)
      .max(12),
  }),
});

const hardwareLine = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/hardware' }),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
    lead: text,
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: text,
    description: text,
    /** false mientras no la revise un abogado: la página muestra el aviso de borrador. */
    reviewed: z.boolean(),
    updated: text,
  }),
});

export const collections = {
  legal,
  home,
  about,
  services,
  servicesPage,
  products,
  pos,
  aska,
  faq,
  hardwareLine,
};
