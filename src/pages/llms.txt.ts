/**
 * /llms.txt: resumen del sitio en Markdown para los buscadores con IA (https://llmstxt.org).
 * Se arma con el mismo contenido de las páginas, así que no hay que mantenerlo aparte.
 */
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { contact, products, site, socialProfiles } from '@/config/site';

export const GET: APIRoute = async () => {
  const home = (await getEntry('home', 'index'))?.data;
  const pos = (await getEntry('pos', 'index'))?.data;
  const aska = (await getEntry('aska', 'index'))?.data;
  const faq = (await getEntry('faq', 'inicio'))?.data;
  if (!home || !pos || !aska || !faq) throw new Error('Falta contenido para /llms.txt');
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
  const landings = (await getCollection('landings')).sort((a, b) => a.data.order - b.data.order);
  const page = (path: string) => new URL(path, site.url).href;

  const lines = [
    `# ${site.name}`,
    '',
    `> ${home.seo.description}`,
    '',
    `${site.name} es una empresa de software de ${site.city}. ${home.pillars.lead}`,
    '',
    '## XASKA POS',
    '',
    pos.seo.description,
    '',
    ...pos.plans.items.map(
      (plan) => `- Plan ${plan.name}: ${plan.price} al mes (${plan.annual}). ${plan.limits}.`,
    ),
    `- ${pos.plans.lead}`,
    `- Precios completos: ${products.pos.pricingUrl}`,
    `- Probar gratis: ${products.pos.trialUrl}`,
    `- Manual de uso: ${products.pos.manualUrl}`,
    '',
    `## ${products.aska.name}`,
    '',
    `${aska.seo.description}`,
    '',
    '## Servicios',
    '',
    ...services.map(
      (service) =>
        `- [${service.data.title}](${page(`/servicios/${service.id}`)}): ${service.data.summary}`,
    ),
    '',
    '## Preguntas frecuentes',
    '',
    ...faq.items.flatMap((item) => [`### ${item.question}`, '', item.answer, '']),
    '## Páginas',
    '',
    `- [Inicio](${page('/')}): qué hace XASKA y la caja de XASKA POS para probar.`,
    `- [XASKA POS](${page(products.pos.path)}): funciones, pantallas, planes y preguntas.`,
    ...landings.map(
      (item) =>
        `- [XASKA POS para ${item.data.name.toLowerCase()}](${page(`/para/${item.id}`)}): ${item.data.seo.description}`,
    ),
    `- [Aska](${page(products.aska.path)}): la inteligencia artificial de XASKA POS.`,
    `- [Servicios](${page('/servicios')}): desarrollo a medida, automatización, páginas web, consultoría y equipos.`,
    `- [Nosotros](${page('/nosotros')}): quiénes somos, misión y visión.`,
    `- [Contacto](${page('/contacto')}): WhatsApp, correo y formulario.`,
    '',
    '## Contacto',
    '',
    `- WhatsApp: ${contact.whatsapp.display}`,
    `- Correo: ${contact.email}`,
    ...(contact.hours ? [`- Horario: ${contact.hours}`] : []),
    `- Ubicación: ${site.city}`,
    ...socialProfiles.map((profile) => `- ${profile.name}: ${profile.url}`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
