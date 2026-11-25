import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers';
import { publishedPages } from './pages';
import { flags } from '../src/config/site';

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
      // Nada más ancho que la pantalla: si no, en el celular la página se puede alejar con zoom.
      const width = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        screen: document.documentElement.clientWidth,
      }));
      expect(width.page).toBeLessThanOrEqual(width.screen);
    });
  }

  test('la 404 responde 404 y ofrece WhatsApp', async ({ page }) => {
    const response = await page.goto('/esta-pagina-no-existe');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('No encontramos esta página');
    await expect(page.locator('main a[href^="https://wa.me/573245560729"]')).toBeVisible();
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
    expect(wa).toMatch(/^https:\/\/wa\.me\/573245560729\?text=.+/);
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
      /Versión de prueba — (hay \d+ pendientes?|sin pendientes)/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});

test.describe('contenido de la fase 1', () => {
  test('la portada lleva al registro del POS en un clic (POS_LAUNCHED)', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('main a', { hasText: 'Probar gratis 14 días' }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', 'https://app.xaska.co/registro');
    await expect(cta).toHaveAttribute('rel', 'noopener');
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

  test('XASKA POS muestra sus pantallas con descripción', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    const screens = page.locator('#asi-se-ve ~ ul [role="img"]');
    await expect(screens).toHaveCount(7);
    for (const label of await screens.evaluateAll((els) =>
      els.map((e) => e.getAttribute('aria-label') ?? ''),
    )) {
      expect(label.length).toBeGreaterThan(40);
    }
  });

  test('la ventana de cobro muestra el cambio según el billete, sin JavaScript', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/productos/xaska-pos');
    const checkout = page.locator('.checkout');
    await expect(checkout.locator('.ck-amount:visible')).toHaveText('$0');
    await checkout.locator('label', { hasText: '$50.000' }).click();
    await expect(checkout.locator('.ck-amount:visible')).toHaveText('$22.400');
    await checkout.locator('label', { hasText: 'Mixto' }).click();
    await expect(
      checkout.getByText('Parte en efectivo y parte por transferencia', { exact: false }),
    ).toBeVisible();
    await context.close();
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

  test('Aska tiene su página con precio, prueba y lo que viene', async ({ page }) => {
    await page.goto('/aska');
    await expect(page.locator('h1')).toContainText('Aska');
    await expect(page.locator('main')).toContainText('$39.900');
    await expect(page.locator('main a', { hasText: 'Probar Aska gratis 14 días' })).toHaveAttribute(
      'href',
      'https://app.xaska.co/registro',
    );
    const soon = page.locator('#proximamente');
    await expect(soon).toHaveText('Aska Te Atiende');
    const notify = page.locator('main a', { hasText: 'Avísame cuando salga' });
    expect(decodeURIComponent((await notify.getAttribute('href')) ?? '')).toContain(
      'Aska Te Atiende',
    );
    const logo = page.locator('main img[src="/brand/xaska-ia/xaska-ia.svg"]').first();
    await expect(logo).toHaveAttribute('width', '56');
    expect(await page.locator('details.faq').count()).toBeGreaterThanOrEqual(4);
  });

  test('el menú marca Aska y las demás páginas invitan a conocerla', async ({ page }) => {
    await page.goto('/aska');
    const current = page.locator('header a[aria-current="page"]');
    await expect(current.first()).toHaveText('Aska');
    for (const path of ['/', '/productos', '/productos/xaska-pos']) {
      await page.goto(path);
      await expect(page.locator('main a[href="/aska"]', { hasText: 'Conocer Aska' })).toBeVisible();
    }
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

test.describe('portada viva', () => {
  test('la caja de prueba suma productos, cobra y empieza otra venta', async ({ page }) => {
    await page.goto('/');
    const register = page.locator('[data-register]');
    await expect(register.getByText('Toca un producto para empezar la venta.')).toBeVisible();
    await register.getByRole('button', { name: /Arroz 1 kg/ }).click();
    await register.getByRole('button', { name: /Arroz 1 kg/ }).click();
    await register.getByRole('button', { name: /Leche 1 L/ }).click();
    await expect(register.getByText('2 × Arroz 1 kg')).toBeVisible();
    await expect(register.locator('[data-total]')).toHaveText('$13.000');
    await expect(register.locator('[data-announce]')).toHaveText(
      'Leche 1 L agregado. Total $13.000.',
    );
    await register.getByRole('button', { name: 'Cobrar' }).click();
    await expect(register.getByText('Venta registrada', { exact: true })).toBeVisible();
    await expect(register.locator('[data-paid]')).toHaveText('$13.000');
    const again = register.getByRole('button', { name: 'Nueva venta' });
    await expect(again).toBeFocused();
    await again.click();
    await expect(register.getByText('Toca un producto para empezar la venta.')).toBeVisible();
  });

  test('las pestañas Vende, Fía, Cobra y Controla se manejan con teclado', async ({ page }) => {
    await page.goto('/');
    const tablist = page.getByRole('tablist', { name: 'Lo que hace XASKA POS' });
    const vende = tablist.getByRole('tab', { name: 'Vende' });
    await expect(vende).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Vende' })).toBeVisible();
    await vende.focus();
    await page.keyboard.press('ArrowRight');
    const fia = tablist.getByRole('tab', { name: 'Fía' });
    await expect(fia).toBeFocused();
    await expect(fia).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Fía' })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Vende' })).toBeHidden();
    await page.keyboard.press('End');
    await expect(page.getByRole('tabpanel', { name: 'Controla' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(vende).toBeFocused();
  });

  test('sin JavaScript se ven los cuatro paneles y no las pestañas', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[role="tablist"]')).toBeHidden();
    for (const name of ['Vende', 'Fía', 'Cobra', 'Controla']) {
      await expect(
        page.locator(`#panel-${name === 'Fía' ? 'fia' : name.toLowerCase()}`),
      ).toBeVisible();
    }
    await context.close();
  });

  test('la pregunta del internet dice que se puede vender sin conexión', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    await expect(page.getByText('sigues vendiendo en ese equipo', { exact: false })).toBeAttached();
  });
});

test.describe('Aska viva', () => {
  test('las preguntas de ejemplo responden en la conversación', async ({ page }) => {
    await page.goto('/aska');
    const log = page.getByRole('log');
    await page.getByRole('button', { name: '¿Quién me debe?' }).click();
    await expect(
      log.getByText('Doña Rosa y don Pedro tienen fiado pendiente', { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '¿Quién me debe?' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '¿Cómo me fue hoy?' })).toBeFocused();
  });
});

test.describe('secciones por tipo de negocio', () => {
  const landings = [
    { path: '/para/restaurantes', from: 'restaurantes y bares', plan: 'Negocio' },
    { path: '/para/tiendas', from: 'tiendas', plan: 'Emprende' },
    { path: '/para/servicios', from: 'negocios de servicios', plan: 'Negocio' },
    { path: '/para/droguerias', from: 'droguerías', plan: 'Negocio' },
    { path: '/para/distribuidores', from: 'distribuidores', plan: 'Negocio' },
  ];
  for (const landing of landings) {
    test(`${landing.path} lleva a WhatsApp con su propio mensaje y su plan`, async ({ page }) => {
      await page.goto(landing.path);
      const whatsapp = page.locator('main a[href*="wa.me"]').first();
      const href = decodeURIComponent((await whatsapp.getAttribute('href')) ?? '');
      expect(href).toContain(`vengo de la página para ${landing.from}`);
      await expect(page.getByText(`Plan ${landing.plan}`, { exact: true })).toBeVisible();
      await expect(page.locator('#preguntas-landing ~ div details').first()).toBeAttached();
    });
  }

  test('restaurante: la mesa cambia de estado y la cuenta se divide', async ({ page }) => {
    await page.goto('/para/restaurantes');
    const mesa1 = page.getByRole('button', { name: /Mesa 1/ });
    await expect(mesa1).toContainText('Libre');
    await mesa1.click();
    await expect(mesa1).toContainText('En cocina');
    await expect(mesa1).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Mesa 4/ }).click();
    await page.getByRole('button', { name: '÷ 2' }).click();
    await expect(page.locator('[data-bill-per]')).toContainText('Cada uno');
  });

  test('tienda: el producto pasa a la caja y se puede fiar', async ({ page }) => {
    await page.goto('/para/tiendas');
    await page.getByRole('button', { name: /Agregar Huevos x 12/ }).click();
    await page.getByRole('button', { name: /Agregar Huevos x 12/ }).click();
    await expect(page.locator('[data-lines]')).toContainText('2 × Huevos x 12');
    await expect(page.locator('[data-total]')).toHaveText('$27.600');
    await page.getByRole('button', { name: 'Fiar a Doña Rosa' }).click();
    await expect(page.locator('[data-note]')).toContainText('$80.100');
  });

  test('servicios: el pedido pasa a la siguiente columna', async ({ page }) => {
    await page.goto('/para/servicios');
    const card = page.getByRole('button', { name: /Mantenimiento portátil.*En Listo/ });
    await card.click();
    const delivered = page.locator('[data-col="3"]');
    await expect(delivered.getByText('Mantenimiento portátil')).toBeVisible();
    await expect(delivered.getByText('Pagado $90.000')).toBeVisible();
  });

  test('droguería: vende del lote que vence primero', async ({ page }) => {
    await page.goto('/para/droguerias');
    await page.getByRole('button', { name: 'Vender 1 caja' }).click();
    await expect(page.locator('[data-msg]').first()).toContainText('lote B11');
    await expect(page.locator('[data-lot="0"] [data-qty]')).toHaveText('2');
    // Las cajas que quedan se siguen viendo (se vuelven a dibujar con JavaScript).
    const box = page.locator('[data-lot="1"] .ph-box').first();
    expect((await box.boundingBox())?.width ?? 0).toBeGreaterThan(10);
  });

  test('distribuidora: el abono baja la cuenta de la tienda', async ({ page }) => {
    await page.goto('/para/distribuidores');
    await page.getByRole('button', { name: /Tienda Doña Rosa/ }).click();
    await expect(page.locator('[data-debt]').first()).toHaveText('$86.500');
    await page.getByRole('button', { name: 'Recibir abono de $20.000' }).click();
    await expect(page.locator('[data-debt]').first()).toHaveText('$66.500');
  });

  test('XASKA POS enlaza las cinco secciones', async ({ page }) => {
    await page.goto('/productos/xaska-pos');
    const list = page.getByRole('list', { name: 'XASKA POS para tu tipo de negocio' });
    await expect(list.getByRole('link')).toHaveCount(5);
  });
});

test.describe('páginas de servicios', () => {
  test('desarrollo a medida: las piezas arman el mensaje de WhatsApp', async ({ page }) => {
    await page.goto('/servicios/desarrollo-a-medida');
    await page.getByRole('button', { name: 'Agenda' }).click();
    await page.getByRole('button', { name: 'Portal para clientes' }).click();
    await expect(page.locator('[data-message]')).toHaveText(
      'Hola, quiero un programa a la medida con pedidos, inventario y agenda.',
    );
    const href = decodeURIComponent((await page.locator('[data-send]').getAttribute('href')) ?? '');
    expect(href).toContain('pedidos, inventario y agenda');
  });

  test('automatización: cambia de a mano a automático', async ({ page }) => {
    await page.goto('/servicios/automatizacion');
    await expect(page.locator('[data-steps]')).toContainText('Una persona');
    await page.getByRole('button', { name: 'Automático' }).click();
    await expect(page.locator('[data-steps]')).toContainText('El flujo arranca solo');
    await page.getByRole('button', { name: 'Avisos' }).click();
    await expect(page.locator('[data-steps]')).toContainText('Revisa todo');
  });

  test('páginas web: cambia el negocio y la pantalla', async ({ page }) => {
    await page.goto('/servicios/paginas-web');
    await page.getByRole('button', { name: 'Taller' }).click();
    await expect(page.locator('[data-out="name"]')).toHaveText('Taller Motos Ya');
    await page.getByRole('button', { name: 'Celular' }).click();
    await expect(page.locator('[data-web]')).toHaveAttribute('data-device', 'celular');
    await page.getByRole('button', { name: 'Color Verde' }).click();
    await expect(page.locator('[data-web]')).toHaveAttribute('data-color', 'verde');
  });

  test('consultoría: cuatro respuestas dan una orientación', async ({ page }) => {
    await page.goto('/servicios/consultoria');
    for (const answer of [
      'Copiar datos y armar reportes',
      'En Excel',
      'De 2 a 5',
      'Ahorrar tiempo',
    ]) {
      await page.getByRole('button', { name: answer }).click();
    }
    await expect(page.locator('[data-result-title]')).toHaveText('Automatizar lo repetitivo');
    await expect(page.locator('[data-result-title]')).toBeFocused();
    await page.getByRole('button', { name: 'Empezar de nuevo' }).click();
    await expect(page.locator('[data-step]')).toHaveText('Pregunta 1 de 4');
  });

  test('equipos: cada opción muestra lo que llega', async ({ page }) => {
    await page.goto('/servicios/equipos-y-computadores');
    await expect(page.locator('[data-grid] li')).toHaveCount(6);
    await page.getByRole('button', { name: 'Alto rendimiento' }).click();
    await expect(page.locator('[data-grid] li')).toHaveCount(3);
    await expect(page.locator('[data-grid]')).toContainText('Equipo de alto rendimiento');
  });

  test('Servicios enlaza la página de cada servicio', async ({ page }) => {
    await page.goto('/servicios');
    const nav = page.getByRole('navigation', { name: 'Servicios' }).first();
    await expect(nav.locator('a[href^="/servicios/"]')).toHaveCount(5);
  });
});

test.describe('menú Para tu negocio', () => {
  test('en un celular bajo el menú se desplaza hasta el final', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'movil', 'Solo en móvil');
    await page.setViewportSize({ width: 375, height: 600 });
    await page.goto('/para/droguerias');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const last = page
      .getByRole('navigation', { name: 'Principal (móvil)' })
      .getByRole('link', { name: 'Distribuidores' });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
  });

  test('en escritorio abre las cinco secciones', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'Solo en escritorio');
    await page.goto('/');
    const menu = page.getByRole('navigation', { name: 'Principal', exact: true });
    await menu.getByText('Para tu negocio').click();
    await expect(menu.locator('a[href^="/para/"]')).toHaveCount(5);
    await expect(menu.getByRole('link', { name: 'Droguerías' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu.getByRole('link', { name: 'Droguerías' })).toBeHidden();
  });
});

test.describe('celular pequeño (320 px)', () => {
  test.use({ viewport: { width: 320, height: 700 } });
  for (const path of pages) {
    test(`${path} cabe en 320 px sin desplazarse de lado`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'movil', 'Solo en el proyecto móvil');
      await page.goto(path);
      const width = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        screen: document.documentElement.clientWidth,
      }));
      expect(width.page).toBeLessThanOrEqual(width.screen);
    });
  }
});

test.describe('chat de Aska', () => {
  // Solo cuando el chat está encendido (flags.ASKA_CHAT en src/config/site.ts).
  test.skip(!flags.ASKA_CHAT, 'Chat de Aska apagado hasta desplegar la rama aska-web del POS');

  const API = 'https://app.xaska.co/api/v1/public/aska/chat';

  test('responde, pinta los enlaces sin HTML y recuerda la sesión', async ({ page }) => {
    const sent: { session: string; text: string }[] = [];
    await page.route(`${API}/*`, (route) =>
      route.fulfill({
        json: { status: 'BOT', messages: [] },
        headers: { 'Access-Control-Allow-Origin': '*' },
      }),
    );
    await page.route(API, async (route) => {
      sent.push(route.request().postDataJSON() as { session: string; text: string });
      await route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: {
          status: 'BOT',
          messages: [
            {
              id: 'm1',
              author: 'BOT',
              body: 'Para un bar te sirve el *Negocio*. Prueba gratis: https://app.xaska.co/registro. <b>no</b>',
              createdAt: '2026-11-18T20:00:00Z',
            },
          ],
        },
      });
    });
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Pregúntale a Aska' });
    await launcher.click();
    const panel = page.getByRole('dialog', { name: 'Aska' });
    await expect(panel).toBeVisible();
    await panel.getByLabel('Escríbele a Aska').fill('Tengo un bar');
    await panel.getByRole('button', { name: 'Enviar' }).click();
    const log = panel.getByRole('log');
    await expect(log).toContainText('Tengo un bar');
    await expect(log.locator('strong', { hasText: 'Negocio' })).toBeVisible();
    await expect(log.getByRole('link', { name: 'https://app.xaska.co/registro' })).toHaveAttribute(
      'href',
      'https://app.xaska.co/registro',
    );
    // Lo que llega del servidor nunca se pinta como HTML.
    await expect(log.locator('b')).toHaveCount(0);
    expect(sent[0]?.text).toBe('Tengo un bar');
    expect(sent[0]?.session).toMatch(/^[0-9a-f-]{36}$/);
    const stored = await page.evaluate(() => localStorage.getItem('xaska.aska-chat'));
    expect(stored).toBe(sent[0]?.session);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(launcher).toBeFocused();
  });

  test('pregunta el nombre y, al despedirse, pide calificar con estrellas', async ({ page }) => {
    let rated: { score: number; comment: string | null } | undefined;
    await page.route(API, (route) =>
      route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: {
          status: 'CLOSED',
          ratingPending: true,
          messages: [
            {
              id: 'b1',
              author: 'BOT',
              body: '¡Que te vaya bien!',
              createdAt: '2026-11-20T20:00:00Z',
            },
            {
              id: 'b2',
              author: 'BOT',
              body: '¿Cómo te atendimos? Califica de 1 a 5 ⭐',
              createdAt: '2026-11-20T20:00:01Z',
            },
          ],
        },
      }),
    );
    await page.route(`${API}/*/rating`, async (route) => {
      rated = route.request().postDataJSON() as { score: number; comment: string | null };
      await route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: {
          status: 'CLOSED',
          ratingPending: false,
          messages: [
            {
              id: 'b3',
              author: 'BOT',
              body: 'Gracias, ya se lo pasamos al equipo de XASKA.',
              createdAt: '2026-11-20T20:01:00Z',
            },
          ],
        },
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Pregúntale a Aska' }).click();
    const panel = page.getByRole('dialog', { name: 'Aska' });
    await expect(panel.getByRole('log')).toContainText('¿Con quién tengo el gusto?');
    await expect(panel.getByRole('group', { name: '¿Cómo te atendimos?' })).toBeHidden();
    await panel.getByLabel('Escríbele a Aska').fill('Eso es todo, gracias');
    await panel.getByRole('button', { name: 'Enviar', exact: true }).click();
    const stars = panel.getByRole('group', { name: '¿Cómo te atendimos?' });
    await expect(stars).toBeVisible();
    await stars.locator('label', { hasText: '4 de 5' }).click();
    await panel.getByLabel('¿Algo que podamos mejorar? (opcional)').fill('Muy clara');
    await panel.getByRole('button', { name: 'Enviar calificación' }).click();
    await expect(panel.getByRole('log')).toContainText('se lo pasamos al equipo');
    await expect(stars).toBeHidden();
    expect(rated).toEqual({ score: 4, comment: 'Muy clara' });
  });
});
