/**
 * Cloudflare Web Analytics (sin cookies), detrás de la bandera ANALYTICS de site.ts.
 * Se carga solo si la bandera está en true y existe el token del sitio en PUBLIC_CF_ANALYTICS_TOKEN
 * (el token es público: va dentro del HTML). Si la bandera está activa y falta el token en el
 * build de producción, el build falla para no publicar sin medir por accidente.
 */
import { flags } from '@/config/site';
import { isProductionBuild } from './pendientes';

export const ANALYTICS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
export const ANALYTICS_SCRIPT_URL = `${ANALYTICS_SCRIPT_ORIGIN}/beacon.min.js`;
export const ANALYTICS_CONNECT_ORIGIN = 'https://cloudflareinsights.com';

/** Token del sitio en Cloudflare Web Analytics, o null si la analítica no se carga. */
export function analyticsToken(): string | null {
  if (!flags.ANALYTICS) return null;
  const token = (import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN as string | undefined)?.trim();
  if (token) return token;
  if (isProductionBuild()) {
    throw new Error('ANALYTICS está en true pero falta PUBLIC_CF_ANALYTICS_TOKEN.');
  }
  return null;
}
