/**
 * Datos estructurados (JSON-LD, schema.org). Todo sale de src/config/site.ts.
 *
 * Reglas del proyecto:
 *  - Organization sin legalName (la empresa está en proceso de formalización).
 *  - SoftwareApplication sin offers con precio y sin aggregateRating (no hay datos reales).
 */
import {
  contact,
  founder,
  products,
  site,
  socialProfiles,
  structuredDataLogo,
} from '@/config/site';

export type JsonLd = Record<string, unknown>;

const ORGANIZATION_ID = `${site.url}/#organization`;

export function organization(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: site.name,
    // "Xaska" se confunde con otras cosas en los buscadores (una matrícula de avión, Chaska,
    // Laska): el nombre alterno y la descripción les dicen qué es.
    alternateName: ['XASKA POS', 'Xaska'],
    description: 'Empresa de software de Ibagué, Colombia, que crea XASKA POS para pymes.',
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
    founder: { '@type': 'Person', name: founder.name },
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles.map((profile) => profile.url) } : {}),
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

/**
 * Negocio local (ProfessionalService) en Ibagué, para búsquedas como "software POS Ibagué".
 * Sin dirección de calle: XASKA atiende en el negocio del cliente o en línea.
 */
export function localBusiness(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${site.url}/#negocio`,
    name: site.name,
    description:
      'Software para pymes en Ibagué: XASKA POS, desarrollo a medida, automatización, páginas web y consultoría.',
    url: site.url,
    image: new URL(structuredDataLogo.path, site.url).href,
    email: contact.email,
    telephone: `+${contact.whatsapp.number}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ibagué',
      addressRegion: 'Tolima',
      addressCountry: site.country,
    },
    areaServed: [
      { '@type': 'City', name: 'Ibagué' },
      { '@type': 'State', name: 'Tolima' },
      { '@type': 'Country', name: 'Colombia' },
    ],
    ...(contact.hours
      ? {
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              opens: '08:00',
              closes: '18:00',
            },
          ],
        }
      : {}),
    parentOrganization: { '@id': ORGANIZATION_ID },
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles.map((profile) => profile.url) } : {}),
  };
}

/** Preguntas frecuentes de una página (FAQPage). */
export function faqPage(items: readonly { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
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
