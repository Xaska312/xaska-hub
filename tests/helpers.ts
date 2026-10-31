import type { Page } from '@playwright/test';

export const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

/** Sustituye el script de Turnstile por uno que entrega el token de prueba de Cloudflare. */
export async function stubTurnstile(page: Page): Promise<void> {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `(() => {
        document.querySelectorAll('.cf-turnstile').forEach((el) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'cf-turnstile-response';
          input.value = '${DUMMY_TOKEN}';
          el.appendChild(input);
        });
        window.turnstile = { reset() {} };
      })();`,
    }),
  );
}
