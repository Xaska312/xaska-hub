/**
 * Auditoría Lighthouse (perfil móvil) sobre el build, servido con Wrangler igual que en Cloudflare.
 *
 *   pnpm build && pnpm lighthouse
 *
 * Meta: ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO en cada página publicada.
 * Termina con código 1 si alguna página queda por debajo. Los informes HTML quedan en
 * lighthouse-report/ (no se versionan).
 *
 * Excepción registrada en docs/DECISIONES.md (fase 3): mientras haya pendientes, las versiones
 * de prueba llevan noindex, así que se omite la regla "is-crawlable" (página indexable).
 * Con LIGHTHOUSE_STRICT=1 se mide sin la excepción (para el build de producción, fase 4).
 *
 * Usa el Chromium de Playwright (`pnpm test:install`).
 */
import { spawn, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { publishedPages } from '../tests/pages.ts';

const PORT = 8790;
const DEBUG_PORT = 9223;
const BASE = `http://127.0.0.1:${PORT}`;
const MIN_SCORE = 0.95;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
const STRICT = process.env['LIGHTHOUSE_STRICT'] === '1';
const RUNS = Math.max(1, Number(process.env['LIGHTHOUSE_RUNS'] ?? '1'));
const OUT_DIR = 'lighthouse-report';

/**
 * Orígenes que el sitio sí carga. Cualquier otro que aparezca en la medición lo metió algo
 * de tu equipo (antivirus, extensiones, proxy) y ensucia las notas: se avisa al final.
 */
const EXPECTED_HOSTS = new Set(['127.0.0.1', 'challenges.cloudflare.com']);
const foreignHosts = new Set<string>();

function collectForeignHosts(lhr: { audits: Record<string, { details?: unknown }> }): void {
  const details = lhr.audits['network-requests']?.details as
    { items?: { url?: string }[] } | undefined;
  for (const item of details?.items ?? []) {
    try {
      const { hostname, protocol } = new URL(item.url ?? '');
      if (protocol.startsWith('http') && !EXPECTED_HOSTS.has(hostname)) foreignHosts.add(hostname);
    } catch {
      // URL de datos u otra que no es de red
    }
  }
}

const isWindows = process.platform === 'win32';

function stopServer(pid: number | undefined): void {
  if (pid === undefined) return;
  try {
    if (isWindows) execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    else process.kill(-pid, 'SIGTERM');
  } catch {
    // ya terminó
  }
}

async function waitForServer(timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // todavía no responde
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Wrangler no respondió en ${BASE}`);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

const SERVER_COMMAND = `pnpm exec wrangler dev --port ${PORT} --ip 127.0.0.1 --var MAIL_TRANSPORT:log`;

/**
 * Abre Chromium con el puerto de depuración que usa Lighthouse. Prefiere el Chromium completo
 * (modo headless nuevo, el que recomienda Lighthouse); si solo está instalado el "headless shell"
 * de Playwright, usa ese.
 */
async function launchBrowser() {
  const args = [`--remote-debugging-port=${DEBUG_PORT}`];
  try {
    return await chromium.launch({ channel: 'chromium', args });
  } catch {
    try {
      return await chromium.launch({ args });
    } catch {
      console.error(
        'No encontré el navegador de Playwright. Instálalo una vez con:\n\n    pnpm test:install\n',
      );
      process.exit(1);
    }
  }
}

let failed = false;
const browser = await launchBrowser();
// Wrangler se inicia después del navegador: si el navegador falla, no queda un servidor huérfano.
// Se pasa como un solo comando (sin lista de argumentos) para que Node no avise de DEP0190 en Windows.
// En Linux y macOS, grupo de procesos propio para poder cerrar Wrangler y sus hijos juntos.
const server = spawn(SERVER_COMMAND, { stdio: 'ignore', shell: true, detached: !isWindows });

try {
  await waitForServer();
  mkdirSync(OUT_DIR, { recursive: true });
  const rows: string[] = [];

  for (const path of publishedPages) {
    const scores: Record<string, number[]> = {};
    let lastHtml = '';
    for (let run = 0; run < RUNS; run++) {
      const result = await lighthouse(
        `${BASE}${path}`,
        {
          port: DEBUG_PORT,
          output: 'html',
          logLevel: 'error',
          onlyCategories: [...CATEGORIES],
          ...(STRICT ? {} : { skipAudits: ['is-crawlable'] }),
        },
        undefined,
      );
      if (!result) throw new Error(`Lighthouse no devolvió resultado para ${path}`);
      for (const cat of CATEGORIES) {
        (scores[cat] ??= []).push(result.lhr.categories[cat]?.score ?? 0);
      }
      collectForeignHosts(result.lhr);
      lastHtml = Array.isArray(result.report) ? (result.report[0] ?? '') : result.report;
    }

    const file = `${OUT_DIR}/${path === '/' ? 'inicio' : path.slice(1).replace(/\//g, '-')}.html`;
    writeFileSync(file, lastHtml);

    const cells = CATEGORIES.map((cat) => {
      const score = median(scores[cat] ?? [0]);
      if (score < MIN_SCORE) failed = true;
      return `${String(Math.round(score * 100)).padStart(3)}${score < MIN_SCORE ? ' ✗' : '  '}`;
    });
    rows.push(`${path.padEnd(22)} ${cells.join('   ')}`);
  }

  console.log(
    `\nLighthouse móvil (${RUNS} ${RUNS === 1 ? 'pasada' : 'pasadas'}, meta ≥ ${MIN_SCORE * 100}${STRICT ? ', estricto' : ', sin "is-crawlable"'})`,
  );
  console.log(`${'Página'.padEnd(22)} Rend.   Acces.  B.Práct. SEO`);
  for (const row of rows) console.log(row);
  console.log(`\nInformes en ${OUT_DIR}/`);
  if (foreignHosts.size > 0) {
    console.warn(
      `\nAtención: la medición incluyó recursos que el sitio no carga: ${[...foreignHosts].join(', ')}.\n` +
        'Los suele inyectar un antivirus o una extensión del navegador y bajan las notas ' +
        '(sobre todo "buenas prácticas"). Ver "Lighthouse en tu PC" en el README.',
    );
  }
} finally {
  await browser.close();
  stopServer(server.pid);
}

if (failed) {
  console.error('\nAlguna página quedó por debajo de la meta.');
  process.exit(1);
}
