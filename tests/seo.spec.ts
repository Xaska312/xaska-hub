import { expect, test, type Page } from '@playwright/test';
import { stubTurnstile } from './helpers';
import { publishedPages, unlistedPages } from './pages';

const SITE = 'https://xaska.co';
const OG_IMAGE = `${SITE}/og/xaska-og.png`;

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

async function meta(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).first().getAttribute('content');
}

async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  // JSON.parse falla (y la prueba también) si algún bloque no es JSON válido.
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test.describe('metadatos por página', () => {
  for (const path of publishedPages) {
    test(`${path} tiene canonical, Open Graph, Twitter Card y JSON-LD válido`, async ({ page }) => {
      await page.goto(path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(path === '/' ? `${SITE}/` : `${SITE}${path}`);

      const title = await page.title();
      expect(await meta(page, 'meta[property="og:title"]')).toBe(title);
      expect(await meta(page, 'meta[property="og:description"]')).toBe(
        await meta(page, 'meta[name="description"]'),
      );
      expect(await meta(page, 'meta[property="og:url"]')).toBe(canonical);
      expect(await meta(page, 'meta[property="og:image"]')).toBe(OG_IMAGE);
      expect(await meta(page, 'meta[property="og:image:width"]')).toBe('1200');
      expect(await meta(page, 'meta[property="og:image:height"]')).toBe('630');
      expect(await meta(page, 'meta[property="og:locale"]')).toBe('es_CO');
      expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
      expect(await meta(page, 'meta[name="twitter:image"]')).toBe(OG_IMAGE);

      const data = await jsonLd(page);
      const org = data.find((d) => d['@type'] === 'Organization');
      expect(org, 'Organization').toBeDefined();
      expect(org?.['name']).toBe('XASKA');
      expect(org?.['url']).toBe(SITE);
      expect(org?.['areaServed']).toBe('CO');
      expect(org).not.toHaveProperty('legalName');
      expect(org?.['contactPoint']).toBeDefined();
      for (const d of data) expect(d['@context']).toBe('https://schema.org');
    });
  }

  test('títulos y descripciones no se repiten', async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const path of publishedPages) {
      await page.goto(path);
      titles.add(await page.title());
      descriptions.add((await meta(page, 'meta[name="description"]')) ?? '');
    }
    expect(titles.size).toBe(publishedPages.length);
    expect(descriptions.size).toBe(publishedPages.length);
  });

  test('XASKA POS declara SoftwareApplication sin precios ni calificaciones', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    const app = (await jsonLd(page)).find((d) => d['@type'] === 'SoftwareApplication');
    expect(app, 'SoftwareApplication').toBeDefined();
    expect(app?.['name']).toBe('XASKA POS');
    expect(app?.['applicationCategory']).toBe('BusinessApplication');
    expect(app?.['operatingSystem']).toBe('Web');
    expect(app).not.toHaveProperty('offers');
    expect(app).not.toHaveProperty('aggregateRating');
    expect(JSON.stringify(app).toLowerCase()).not.toContain('facturación');
  });

  test('la imagen Open Graph existe y es PNG', async ({ request }) => {
    const res = await request.get('/og/xaska-og.png');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });
});

test.describe('sitemap y robots.txt', () => {
  test('el sitemap tiene exactamente las páginas publicadas', async ({ request }) => {
    const index = await request.get('/sitemap-index.xml');
    expect(index.status()).toBe(200);
    expect(await index.text()).toContain(`${SITE}/sitemap-0.xml`);

    const res = await request.get('/sitemap-0.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = publishedPages.map((p) => (p === '/' ? `${SITE}/` : `${SITE}${p}`));
    expect(locs.sort()).toEqual([...expected].sort());
  });

  test('el sitemap no incluye /hardware, las páginas del formulario ni la 404', async ({
    request,
  }) => {
    const xml = await (await request.get('/sitemap-0.xml')).text();
    expect(xml).not.toContain('/hardware');
    expect(xml).not.toContain('404');
    for (const path of unlistedPages) expect(xml).not.toContain(`${SITE}${path}<`);
  });

  test('robots.txt apunta al sitemap', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text();
    expect(text).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });

  test('las páginas del formulario no se indexan', async ({ page }) => {
    for (const path of unlistedPages) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    }
  });
});

test.describe('analítica', () => {
  test('con ANALYTICS=false no se carga ni se abre la CSP', async ({ page }) => {
    for (const path of ['/', '/contacto']) {
      await page.goto(path);
      await expect(page.locator('script[src*="cloudflareinsights"]')).toHaveCount(0);
      const csp = await page
        .locator('meta[http-equiv="content-security-policy"]')
        .getAttribute('content');
      expect(csp).not.toContain('cloudflareinsights');
    }
  });
});
