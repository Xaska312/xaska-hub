/**
 * Texto de un mensaje de Aska en partes seguras para pintar sin HTML: enlaces https (los de WhatsApp y XASKA),
 * *negrita* como en WhatsApp y el resto como texto. Nunca se usa innerHTML con lo que llega del servidor.
 */
export type AskaPart =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'link'; text: string; href: string };

const TOKEN = /(https:\/\/[^\s<>"']+)|\*([^*\n]+)\*/g;

export function askaParts(text: string): AskaPart[] {
  const parts: AskaPart[] = [];
  let index = 0;
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > index) parts.push({ kind: 'text', text: text.slice(index, start) });
    if (match[1]) {
      // Un punto o una coma al final no son parte del enlace.
      const url = match[1].replace(/[.,;:!?)]+$/, '');
      parts.push({ kind: 'link', text: url, href: url });
      index = start + url.length;
      continue;
    }
    parts.push({ kind: 'bold', text: match[2] ?? '' });
    index = start + match[0].length;
  }
  if (index < text.length) parts.push({ kind: 'text', text: text.slice(index) });
  return parts;
}
