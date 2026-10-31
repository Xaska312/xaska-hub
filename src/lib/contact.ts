/**
 * Reglas del formulario de contacto. Las usan el navegador (para avisar antes de enviar)
 * y el Worker (que es quien decide). Sin dependencias, para que funcione en los dos lados.
 */

export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  interest: 60,
  message: 3000,
} as const;

/** Nombre del campo trampa: las personas no lo ven; si llega con algo, es un bot. */
export const HONEYPOT_FIELD = 'sitio_web';
export const TURNSTILE_FIELD = 'cf-turnstile-response';

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}

export type ContactField = keyof ContactData | 'consent';
export type ContactErrors = Partial<Record<ContactField, string>>;

export type ContactResult = { ok: true; data: ContactData } | { ok: false; errors: ContactErrors };

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,30}$/;

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Quita caracteres de control (salvo saltos de línea y tabulaciones) y espacios de los extremos.
  // eslint-disable-next-line no-control-regex -- se buscan justamente los caracteres de control
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, ' ');
}

/**
 * Valida y limpia los campos. `interests` es la lista de opciones válidas del campo "interés".
 */
export function validateContact(
  raw: Record<string, unknown>,
  interests: readonly string[],
): ContactResult {
  const errors: ContactErrors = {};

  const name = singleLine(clean(raw['name']));
  const email = clean(raw['email']).toLowerCase();
  const phone = singleLine(clean(raw['phone']));
  const interest = singleLine(clean(raw['interest']));
  const message = clean(raw['message']).replace(/\r\n?/g, '\n');
  const consent = raw['consent'] === 'si' || raw['consent'] === true;

  if (name.length < 2) errors.name = 'Escribe tu nombre.';
  else if (name.length > CONTACT_LIMITS.name)
    errors.name = `Usa máximo ${CONTACT_LIMITS.name} caracteres.`;

  if (email.length === 0) errors.email = 'Escribe tu correo.';
  else if (email.length > CONTACT_LIMITS.email || !EMAIL_PATTERN.test(email))
    errors.email = 'Revisa el correo; debe ser como nombre@dominio.com.';

  if (phone.length > 0 && !PHONE_PATTERN.test(phone))
    errors.phone = 'Revisa el teléfono; usa solo números, espacios o el signo +.';

  if (!interests.includes(interest)) errors.interest = 'Elige una opción.';

  if (message.length < 10) errors.message = 'Cuéntanos un poco más (mínimo 10 caracteres).';
  else if (message.length > CONTACT_LIMITS.message)
    errors.message = `Usa máximo ${CONTACT_LIMITS.message} caracteres.`;

  if (!consent) errors.consent = 'Necesitamos tu autorización para responderte.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name, email, phone, interest, message } };
}

/** Escapa texto para insertarlo en HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
