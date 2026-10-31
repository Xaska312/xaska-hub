/**
 * Datos estructurados (JSON-LD, schema.org). Todo sale de src/config/site.ts.
 *
 * Reglas del proyecto:
 *  - Organization sin legalName (la empresa está en proceso de formalización).
 *  - SoftwareApplication sin offers con precio y sin aggregateRating (no hay datos reales).
 */
import { contact, products, site, structuredDataLogo } from '@/config/site';

export type JsonLd = Record<string, unknown>;

const ORGANIZATION_ID = `${site.url}/#organization`;

export function organization(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    logo: {
      '@type': 'ImageObject',
      url: new URL(structuredDataLogo.path, site.url).href,
      width: structuredDataLogo.width,
      height: structuredDataLogo.height,
    },
    email: contact.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ibagué',
      addressRegion: 'Tolima',
      addressCountry: site.country,
    },
    areaServed: site.country,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: contact.email,
        telephone: `+${contact.whatsapp.number}`,
        areaServed: site.country,
        availableLanguage: 'es',
      },
    ],
  };
}

export function posApplication(description: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: products.pos.name,
    description,
    url: new URL(products.pos.path, site.url).href,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: site.locale,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** Serializa para un <script type="application/ld+json"> sin permitir cerrar la etiqueta. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
