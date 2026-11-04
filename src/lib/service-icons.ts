import type { IconName } from '@/components/Icon.astro';

/** Ícono de cada servicio (por el nombre del archivo en src/content/services/). */
const icons: Record<string, IconName> = {
  'desarrollo-a-medida': 'code',
  automatizacion: 'zap',
  'paginas-web': 'globe',
  consultoria: 'compass',
  'equipos-y-computadores': 'monitor',
};

export function serviceIcon(id: string): IconName {
  return icons[id] ?? 'sparkle';
}
