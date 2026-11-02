import { randomInt } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { DUMMY_TOKEN, stubTurnstile } from './helpers';

function validForm(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    name: 'Ana Pérez',
    email: 'ana@example.com',
    phone: '+57 300 123 4567',
    interest: 'XASKA POS',
    message: 'Hola, quiero conocer XASKA POS para mi tienda de ropa.',
    consent: 'si',
    'cf-turnstile-response': DUMMY_TOKEN,
    ...overrides,
  };
}

/**
 * Cada prueba usa su propia IP para no chocar con el límite de envíos de las demás.
 * Es aleatoria (no un contador) porque las pruebas corren en paralelo en varios procesos y un
 * contador por proceso repetiría las mismas IP.
 */
function freshIp(): string {
  return `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
}

test.describe('API del formulario', () => {
  // Playwright exige desestructurar el primer argumento aunque no se use ningún fixture.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'escritorio', 'la API se prueba una sola vez');
  });

  test('acepta un envío válido y responde sin caché', async ({ request }) => {
    const res = await request.post('/api/contacto', {
      form: validForm(),
      headers: { Accept: 'application/json', 'CF-Connecting-IP': freshIp() },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(res.headers()['cache-control']).toBe('no-store');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('rechaza campos inválidos con el detalle por campo', async ({ request }) => {
    const res = await request.post('/api/contacto', {
      form: validForm({ email: 'no-es-correo', consent: '', interest: 'Inventado' }),
      headers: { Accept: 'application/json', 'CF-Connecting-IP': freshIp() },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(Object.keys(body.errors).sort()).toEqual(['consent', 'email', 'interest']);
  });

  test('rechaza el envío sin verificación de Turnstile', async ({ request }) => {
    const res = await request.post('/api/contacto', {
      form: validForm({ 'cf-turnstile-response': '' }),
      headers: { Accept: 'application/json', 'CF-Connecting-IP': freshIp() },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain('persona');
  });

  test('el campo trampa lleno no envía nada pero no le avisa al bot', async ({ request }) => {
    const res = await request.post('/api/contacto', {
      form: validForm({ sitio_web: 'http://spam.example' }),
      headers: { Accept: 'application/json', 'CF-Connecting-IP': freshIp() },
    });
    expect(res.status()).toBe(200);
  });

  test('limita los envíos repetidos desde la misma IP', async ({ request }) => {
    const ip = freshIp();
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const res = await request.post('/api/contacto', {
        form: validForm(),
        headers: { Accept: 'application/json', 'CF-Connecting-IP': ip },
      });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses.at(-1)).toBe(429);
  });

  test('rechaza otros métodos y mensajes demasiado grandes', async ({ request }) => {
    expect((await request.get('/api/contacto')).status()).toBe(405);
    const res = await request.post('/api/contacto', {
      form: validForm({ message: 'x'.repeat(25_000) }),
      headers: { Accept: 'application/json', 'CF-Connecting-IP': freshIp() },
    });
    expect(res.status()).toBe(413);
  });

  test('sin JavaScript redirige a la página de resultado', async ({ request }) => {
    const res = await request.post('/api/contacto', {
      form: validForm(),
      headers: { 'CF-Connecting-IP': freshIp() },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(303);
    expect(res.headers()['location']).toMatch(/\/contacto\/enviado$/);
  });
});

test.describe('formulario en /contacto', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'CF-Connecting-IP': freshIp() });
    await stubTurnstile(page);
  });

  test('la casilla de autorización empieza sin marcar y enlaza a la política', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('#contact-consent')).not.toBeChecked();
    await expect(page.locator('label[for="contact-consent"] a')).toHaveAttribute(
      'href',
      '/legal/privacidad',
    );
  });

  test('marca los errores, los asocia al campo y lleva el foco al primero', async ({ page }) => {
    await page.goto('/contacto');
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();
    const name = page.locator('#contact-name');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toBeFocused();
    await expect(page.locator('#contact-name-error')).toHaveText('Escribe tu nombre.');
    await expect(name).toHaveAttribute('aria-describedby', /contact-name-error/);
    await expect(page.locator('#contact-consent-error')).not.toBeEmpty();
  });

  test('envía un mensaje válido con la CSP activa y anuncia el resultado', async ({ page }) => {
    const cspErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text()))
        cspErrors.push(msg.text());
    });
    await page.goto('/contacto');
    await page.locator('#contact-name').fill('Ana Pérez');
    await page.locator('#contact-email').fill('ana@example.com');
    await page.locator('#contact-interest').selectOption('Página web');
    await page.locator('#contact-message').fill('Quiero una página para mi negocio de mármoles.');
    await page.locator('#contact-consent').check();
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(page.locator('[data-summary]')).toHaveText(/Recibimos tu mensaje/);
    await expect(page.locator('[data-status]')).toHaveText(/Recibimos tu mensaje/);
    await expect(page.locator('#contact-name')).toHaveValue('');
    expect(cspErrors).toEqual([]);
  });
});

test.describe('páginas legales', () => {
  for (const path of ['/legal/privacidad', '/legal/terminos']) {
    test(`${path} carga revisada, sin el aviso de borrador`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByText('Borrador pendiente de revisión legal')).toHaveCount(0);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }

  test('el pie enlaza a las dos páginas legales', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a[href="/legal/privacidad"]')).toBeVisible();
    await expect(page.locator('footer a[href="/legal/terminos"]')).toBeVisible();
  });
});
