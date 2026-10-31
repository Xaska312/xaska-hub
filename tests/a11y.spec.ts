import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers';
import { publishedPages, unlistedPages } from './pages';

/**
 * Accesibilidad automática con axe (WCAG 2.0, 2.1 y 2.2, niveles A y AA) en cada página,
 * en tema claro y oscuro: el contraste cambia con el tema.
 * No reemplaza la revisión manual con teclado (lista en docs/DECISIONES.md, fase 3).
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const paths = [...publishedPages, ...unlistedPages, '/esta-pagina-no-existe'];

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe, tema ${scheme === 'light' ? 'claro' : 'oscuro'}`, () => {
    for (const path of paths) {
      test(`${path} sin infracciones`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const summary = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target.join(' ')),
        }));
        expect(summary).toEqual([]);
      });
    }
  });
}
