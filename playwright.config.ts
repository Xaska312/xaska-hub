import { defineConfig, devices } from '@playwright/test';

const PORT = 8788;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } } },
  ],
  // Sirve el build con Wrangler para probar igual que en Cloudflare (cabeceras, 404, rutas).
  webServer: {
    // Turnstile con la clave secreta de prueba de Cloudflare y correo simulado (no se envía nada).
    command: [
      `pnpm exec wrangler dev --port ${PORT} --ip 127.0.0.1`,
      '--var TURNSTILE_SECRET_KEY:1x0000000000000000000000000000000AA',
      '--var MAIL_TRANSPORT:log',
    ].join(' '),
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
