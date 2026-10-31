/**
 * Lista cada marcador PENDIENTE y BORRADOR del código fuente (con archivo y línea)
 * y de las páginas generadas en dist/.
 *
 *   node scripts/check-pendientes.ts           informe (falla solo en producción)
 *   node scripts/check-pendientes.ts --write   además actualiza docs/PENDIENTES.md
 *
 * En producción (ver isProductionBuild) termina con código 1 si encuentra alguno.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { findHtmlMarkers, findSourceMarkers, isProductionBuild } from '../src/lib/pendientes.ts';

const root = process.cwd();
const production = isProductionBuild();
const source = findSourceMarkers(root);
const html = existsSync('dist') ? findHtmlMarkers('dist') : [];

const pendientes = source.filter((m) => m.kind === 'PENDIENTE');
const borradores = source.filter((m) => m.kind === 'BORRADOR');

const lines: string[] = [];
lines.push(`Modo: ${production ? 'producción' : 'prueba'}`);
lines.push(
  `Pendientes de datos: ${pendientes.length} · Borradores por aprobar: ${borradores.length}`,
);
for (const m of source) {
  lines.push(
    `  ${m.kind === 'PENDIENTE' ? 'DATO    ' : 'BORRADOR'} ${m.file}:${m.line}  ${m.text}`,
  );
}
if (html.length > 0) {
  lines.push('Páginas generadas con marcadores:');
  for (const h of html) lines.push(`  dist/${h.file} (${h.count})`);
}
console.log(lines.join('\n'));

if (process.argv.includes('--write')) {
  const docPath = 'docs/PENDIENTES.md';
  const start = '<!-- inicio:automatico -->';
  const end = '<!-- fin:automatico -->';
  const table = [
    start,
    '',
    `_Generado con \`pnpm pendientes\`. ${pendientes.length} datos pendientes y ${borradores.length} borradores por aprobar._`,
    '',
    '| Tipo | Archivo | Línea | Texto |',
    '| --- | --- | --- | --- |',
    ...source.map(
      (m) =>
        `| ${m.kind === 'PENDIENTE' ? 'Dato' : 'Borrador'} | \`${m.file}\` | ${m.line} | ${m.text
          .replace(/\|/g, '\\|')
          .replace(/PENDIENTE:/g, 'PENDIENTE')
          .replace(/\[BORRADOR\]/g, 'BORRADOR')} |`,
    ),
    '',
    end,
  ].join('\n');
  const current = existsSync(docPath) ? readFileSync(docPath, 'utf8') : '# Pendientes\n';
  const next = current.includes(start)
    ? current.replace(new RegExp(`${start}[\\s\\S]*?${end}`), table)
    : `${current.trimEnd()}\n\n## Marcadores en el código\n\n${table}\n`;
  // Se formatea con Prettier para que `pnpm format:check` (y la CI) no falle después de generarlo.
  const prettierOptions = (await resolveConfig(docPath)) ?? {};
  writeFileSync(docPath, await format(next, { ...prettierOptions, filepath: docPath }));
  console.log(`\nActualizado ${docPath}`);
}

if (production && (source.length > 0 || html.length > 0)) {
  console.error(
    '\nBuild de producción detenido: hay textos en borrador o datos pendientes. Resuélvelos o publica como versión de prueba.',
  );
  process.exit(1);
}
