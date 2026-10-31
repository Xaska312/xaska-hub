/**
 * Búsqueda de marcadores de contenido sin cerrar.
 *  - "PENDIENTE" seguido de dos puntos: dato que debe aportar Daniel.
 *  - "BORRADOR" entre corchetes: texto propuesto que debe aprobar Daniel.
 *
 * Lo usan el layout (franja "Versión de prueba" y noindex) y el script
 * `scripts/check-pendientes.ts` (lista y, en producción, hace fallar el build).
 * Solo usa sintaxis de TypeScript que Node ejecuta directamente (sin enums ni namespaces).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const MARKER_PATTERN = /PENDIENTE:|\[BORRADOR\]/g;

/** Carpetas de código fuente con contenido o datos de la empresa. */
export const SOURCE_DIRS = ['src/content', 'src/config', 'src/pages', 'src/components'];
const SOURCE_EXTENSIONS = ['.md', '.mdx', '.yaml', '.yml', '.ts', '.astro'];

export interface Marker {
  file: string;
  line: number;
  kind: 'PENDIENTE' | 'BORRADOR';
  text: string;
}

function listFiles(dir: string, extensions: string[]): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listFiles(full, extensions));
    } else if (extensions.some((ext) => name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out.sort();
}

function toPosix(path: string): string {
  return path.split(sep).join('/');
}

const cache = new Map<string, Marker[]>();

/** Marcadores en el código fuente, con archivo y línea. */
export function findSourceMarkers(root: string = process.cwd(), useCache = true): Marker[] {
  const cached = useCache ? cache.get(root) : undefined;
  if (cached) return cached;
  const markers: Marker[] = [];
  for (const dir of SOURCE_DIRS) {
    for (const file of listFiles(join(root, dir), SOURCE_EXTENSIONS)) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((text, index) => {
        for (const match of text.matchAll(MARKER_PATTERN)) {
          markers.push({
            file: toPosix(relative(root, file)),
            line: index + 1,
            kind: match[0] === 'PENDIENTE:' ? 'PENDIENTE' : 'BORRADOR',
            text: text.trim(),
          });
        }
      });
    }
  }
  cache.set(root, markers);
  return markers;
}

/** Cantidad de marcadores por página HTML generada (después del build). */
export function findHtmlMarkers(distDir: string): { file: string; count: number }[] {
  return listFiles(distDir, ['.html'])
    .map((file) => ({
      file: toPosix(relative(distDir, file)),
      count: [...readFileSync(file, 'utf8').matchAll(MARKER_PATTERN)].length,
    }))
    .filter((entry) => entry.count > 0);
}

/**
 * Build de producción: rama main en Cloudflare (WORKERS_CI_BRANCH) o en GitHub (GITHUB_REF),
 * o XASKA_ENV=production. XASKA_ENV=preview fuerza el modo de prueba.
 */
export function isProductionBuild(env: Record<string, string | undefined> = process.env): boolean {
  if (env['XASKA_ENV'] === 'production') return true;
  if (env['XASKA_ENV'] === 'preview') return false;
  return env['WORKERS_CI_BRANCH'] === 'main' || env['GITHUB_REF'] === 'refs/heads/main';
}
