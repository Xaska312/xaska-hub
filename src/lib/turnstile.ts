/**
 * Clave pública (site key) de Turnstile para el build.
 * - Producción: debe venir en PUBLIC_TURNSTILE_SITE_KEY; si falta, el build falla.
 * - Pruebas: si falta, se usa la clave de prueba de Cloudflare que siempre pasa.
 */
import { isProductionBuild } from './pendientes';

export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

export function turnstileSiteKey(): string {
  const key = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
  if (key && key.trim() !== '') return key.trim();
  if (isProductionBuild()) {
    throw new Error('Falta PUBLIC_TURNSTILE_SITE_KEY para el build de producción.');
  }
  return TURNSTILE_TEST_SITE_KEY;
}
