import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers';
import { publishedPages } from './pages';

// Sin red hacia Cloudflare en las pruebas: Turnstile se reemplaza por su versión de prueba.
test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

const pages = publishedPages;

test.describe('páginas publicadas', () => {
  for (const path of pages) {
    test(`carga ${path} con un solo h1 y sin errores`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main#contenido')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('la 404 responde 404 y ofrece WhatsApp', async ({ page }) => {
    const response = await page.goto('/esta-pagina-no-existe');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('No encontramos esta página');
    await expect(page.locator('main a[href^="https://wa.me/573167784193"]')).toBeVisible();
  });
});

test.describe('cabeceras de seguridad', () => {
  test('el hub envía las cabeceras esperadas', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['strict-transport-security']).toBe('max-age=31536000');
  });

  test('la página trae CSP con hashes y sin unsafe-inline en scripts', async ({ page }) => {
    await page.goto('/');
    const csp = await page
      .locator('meta[http-equiv="content-security-policy"]')
      .getAttribute('content');
    expect(csp).toMatch(/script-src 'self' 'sha256-/);
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });
});

test.describe('navegación', () => {
  test('el menú lleva a cada página (sin enlaces internos rotos)', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('href') ?? ''))]);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test('enlaces externos con formato correcto', async ({ page }) => {
    await page.goto('/');
    const wa = await page.locator('a[href^="https://wa.me/"]').first().getAttribute('href');
    expect(wa).toMatch(/^https:\/\/wa\.me\/573167784193\?text=.+/);
    const trial = page.locator('a[href^="https://app.xaska.co"]').first();
    await expect(trial).toHaveAttribute('rel', 'noopener');
  });

  test('menú móvil abre, navega y se cierra con Escape', async ({ page }, info) => {
    test.skip(info.project.name !== 'movil', 'solo móvil');
    await page.goto('/');
    const toggle = page.locator('[data-menu-toggle]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await toggle.click();
    await page.locator('#mobile-menu a[href="/servicios"]').click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.locator('#mobile-menu a[href="/servicios"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('menú de escritorio visible y marca la página actual', async ({ page }, info) => {
    test.skip(info.project.name !== 'escritorio', 'solo escritorio');
    await page.goto('/nosotros');
    const nav = page.getByRole('navigation', { name: 'Principal', exact: true });
    await expect(nav).toBeVisible();
    await expect(nav.locator('a[href="/nosotros"]')).toHaveAttribute('aria-current', 'page');
  });

  test('"Saltar al contenido" es lo primero al tabular', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveText('Saltar al contenido');
    await expect(focused).toBeVisible();
  });
});

test.describe('tema', () => {
  test('respeta el tema oscuro del sistema desde el primer pintado', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    // Se lee data-theme apenas existe el DOM, antes de cargar el resto: así se detecta parpadeo.
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForSelector('html[data-theme]', { state: 'attached' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('header .logo-dark')).toBeVisible();
    await expect(page.locator('header .logo-light')).toBeHidden();
    await ctx.close();
  });

  test('el selector cambia el tema y lo recuerda', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    const toggle = page.locator('header [data-theme-toggle]');
    await expect(toggle).toHaveAttribute('aria-label', 'Cambiar a tema oscuro');
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-label', 'Cambiar a tema claro');
    await page.goto('/servicios');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('header .logo-dark')).toBeVisible();
  });
});

test.describe('banderas', () => {
  test('con SHOW_HARDWARE=false no existe /hardware ni aparece en el menú', async ({ page }) => {
    const res = await page.goto('/hardware');
    expect(res?.status()).toBe(404);
    await page.goto('/');
    await expect(page.locator('a[href="/hardware"]')).toHaveCount(0);
  });
});

test.describe('versión de prueba', () => {
  test('muestra la franja con pendientes y no se indexa', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.preview-banner')).toContainText(
      /Versión de prueba — hay \d+ pendientes/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});

test.describe('contenido de la fase 1', () => {
  test('la portada lleva al botón principal en un clic (demo por WhatsApp)', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('main a', { hasText: 'Pedir una demo' }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/573167784193\?text=/);
    expect(decodeURIComponent(href ?? '')).toContain('demo de XASKA POS');
  });

  test('nosotros muestra la misión y la visión elegidas', async ({ page }) => {
    await page.goto('/nosotros');
    await expect(page.locator('#mision ~ p')).toContainText('herramientas digitales tan buenas');
    await expect(page.locator('#vision ~ p')).toContainText('aliado tecnológico de confianza');
    await expect(page.locator('#mision ~ ol')).toHaveCount(0);
  });

  test('XASKA POS muestra el lema de las tarjetas', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    const slogan = page.locator('[data-slogan]');
    await expect(slogan).toHaveText('Vende. Fía. Cobra. Controla.');
    await expect(slogan.locator('.text-accent')).toHaveText('Controla.');
  });

  test('con E_INVOICING=false no se ofrece factura electrónica', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    await expect(
      page.locator('#funciones ~ div h3', { hasText: 'Factura electrónica' }),
    ).toHaveCount(0);
    const faq = page.locator('details.faq', { hasText: '¿XASKA POS emite factura electrónica?' });
    await expect(faq).toContainText('Todavía no.');
  });

  test('XASKA POS muestra las capturas con texto alternativo', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    const imgs = page.locator('#asi-se-ve ~ figure img, #asi-se-ve ~ ul img');
    await expect(imgs).toHaveCount(6);
    for (const alt of await imgs.evaluateAll((els) =>
      els.map((e) => e.getAttribute('alt') ?? ''),
    )) {
      expect(alt.length).toBeGreaterThan(20);
    }
  });

  test('servicios tiene los cinco servicios con ancla', async ({ page }) => {
    await page.goto('/servicios');
    for (const id of [
      'desarrollo-a-medida',
      'automatizacion',
      'paginas-web',
      'consultoria',
      'equipos-y-computadores',
    ]) {
      await expect(page.locator(`section#${id} h2`)).toBeVisible();
    }
  });

  test('las preguntas frecuentes se abren con teclado', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    const items = page.locator('details.faq');
    expect(await items.count()).toBeGreaterThanOrEqual(6);
    const first = items.first();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
  });

  test('ningún texto público describe el producto como facturación', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const text = (await page.locator('body').innerText()).toLowerCase();
      expect(text, path).not.toContain('facturación');
      expect(text, path).not.toMatch(/s\.a\.s|\bnit\b/);
    }
  });
});
