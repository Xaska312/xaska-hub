/**
 * Worker del hub de XASKA.
 *
 * Solo atiende POST /api/contacto (wrangler.jsonc → assets.run_worker_first: ["/api/*"]).
 * Todo lo demás son archivos estáticos que sirve Cloudflare sin pasar por aquí.
 *
 * Flujo del formulario: tamaño máximo → campo trampa → límite por IP → validación →
 * Turnstile (servidor) → correo con Resend → respuesta genérica.
 * Los datos del formulario no se guardan: solo viajan en el correo a soporte@xaska.co.
 */
import { contact, interestOptions } from '../src/config/site.ts';
import {
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
  escapeHtml,
  validateContact,
  type ContactData,
  type ContactErrors,
} from '../src/lib/contact.ts';

const MAX_BODY_BYTES = 20_000;
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Claves secretas de prueba publicadas por Cloudflare. Con ellas no se llama a la red:
 * se responde igual que Cloudflare (1x pasa, 2x falla, 3x "ya usado"). Una clave real nunca coincide.
 */
const TURNSTILE_DUMMY_SECRETS: Record<string, string | null> = {
  '1x0000000000000000000000000000000AA': null,
  '2x0000000000000000000000000000000AA': 'invalid-input-response',
  '3x0000000000000000000000000000000AA': 'timeout-or-duplicate',
};

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Secreto: clave secreta del widget de Turnstile. */
  TURNSTILE_SECRET_KEY?: string;
  /** Secreto: API key de Resend (solo permiso de envío). */
  RESEND_API_KEY?: string;
  /** Remitente verificado en Resend, p. ej. "XASKA <formulario@envios.xaska.co>". */
  MAIL_FROM?: string;
  /** Destinatario. Por defecto, el correo de contacto de site.ts. */
  MAIL_TO?: string;
  /** "resend" (por defecto) o "log" (pruebas: no envía, solo registra que hubo un envío). */
  MAIL_TRANSPORT?: string;
  /** Límite de envíos por IP (binding de Rate Limiting). Opcional. */
  CONTACT_LIMITER?: RateLimiter;
}

type Outcome =
  | { status: 'sent' }
  | { status: 'invalid'; errors: ContactErrors }
  | { status: 'verification' }
  | { status: 'rate-limited' }
  | { status: 'too-large' }
  | { status: 'failed' };

const MESSAGES: Record<Outcome['status'], string> = {
  sent: 'Recibimos tu mensaje. Te responderemos pronto a tu correo.',
  invalid: 'Revisa los campos marcados.',
  verification: 'No pudimos confirmar que eres una persona. Vuelve a intentarlo.',
  'rate-limited': 'Recibimos varios envíos seguidos. Espera un minuto y vuelve a intentarlo.',
  'too-large': 'El mensaje es demasiado largo.',
  failed: 'No pudimos enviar tu mensaje. Escríbenos por WhatsApp o al correo.',
};

const HTTP_STATUS: Record<Outcome['status'], number> = {
  sent: 200,
  invalid: 400,
  verification: 400,
  'rate-limited': 429,
  'too-large': 413,
  failed: 500,
};

const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contacto') {
      if (request.method !== 'POST') {
        return new Response('Método no permitido', {
          status: 405,
          headers: { ...SECURITY_HEADERS, Allow: 'POST' },
        });
      }
      const outcome = await handleContact(request, env);
      return respond(request, outcome);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('No encontrado', { status: 404, headers: SECURITY_HEADERS });
    }

    return env.ASSETS.fetch(request);
  },
};

function respond(request: Request, outcome: Outcome): Response {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  if (wantsJson) {
    const body = {
      ok: outcome.status === 'sent',
      message: MESSAGES[outcome.status],
      ...(outcome.status === 'invalid' ? { errors: outcome.errors } : {}),
    };
    return new Response(JSON.stringify(body), {
      status: HTTP_STATUS[outcome.status],
      headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  // Sin JavaScript: se redirige a una página de resultado.
  const target = outcome.status === 'sent' ? '/contacto/enviado' : '/contacto/no-enviado';
  return new Response(null, {
    status: 303,
    headers: { ...SECURITY_HEADERS, Location: new URL(target, request.url).toString() },
  });
}

async function handleContact(request: Request, env: Env): Promise<Outcome> {
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > MAX_BODY_BYTES) return { status: 'too-large' };

  let form: FormData;
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_BODY_BYTES) return { status: 'too-large' };
    form = await new Response(raw, {
      headers: { 'Content-Type': request.headers.get('Content-Type') ?? '' },
    }).formData();
  } catch {
    return { status: 'invalid', errors: {} };
  }

  const field = (name: string): string => {
    const value = form.get(name);
    return typeof value === 'string' ? value : '';
  };

  // Campo trampa lleno: se responde como si todo saliera bien y no se envía nada.
  if (field(HONEYPOT_FIELD).trim() !== '') return { status: 'sent' };

  const ip = request.headers.get('CF-Connecting-IP') ?? 'sin-ip';
  if (env.CONTACT_LIMITER) {
    const { success } = await env.CONTACT_LIMITER.limit({ key: `contacto:${ip}` });
    if (!success) return { status: 'rate-limited' };
  }

  const result = validateContact(
    {
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
      interest: field('interest'),
      message: field('message'),
      consent: field('consent'),
    },
    interestOptions,
  );
  if (!result.ok) return { status: 'invalid', errors: result.errors };

  const token = field(TURNSTILE_FIELD);
  if (!(await verifyTurnstile(token, ip, env))) return { status: 'verification' };

  try {
    await sendMail(result.data, env);
  } catch (error) {
    // Sin datos personales en el registro.
    console.error(
      'contacto: no se pudo enviar el correo',
      error instanceof Error ? error.message : '',
    );
    return { status: 'failed' };
  }
  return { status: 'sent' };
}

async function verifyTurnstile(token: string, ip: string, env: Env): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret || token.length === 0 || token.length > 2048) return false;

  if (secret in TURNSTILE_DUMMY_SECRETS) return TURNSTILE_DUMMY_SECRETS[secret] === null;

  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip !== 'sin-ip') body.append('remoteip', ip);
    body.append('idempotency_key', crypto.randomUUID());
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
    if (!res.ok) return false;
    const data: { success?: boolean } = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function sendMail(data: ContactData, env: Env): Promise<void> {
  const to = env.MAIL_TO ?? contact.email;
  const subject = `Nuevo mensaje desde xaska.co: ${data.interest} — ${data.name}`.slice(0, 200);
  const rows: [string, string][] = [
    ['Nombre', data.name],
    ['Correo', data.email],
    ['Teléfono', data.phone || 'No lo indicó'],
    ['Interés', data.interest],
  ];

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Mensaje:',
    data.message,
    '',
    'Autorizó el tratamiento de sus datos según la política de privacidad de xaska.co.',
    'Responde a este correo para contestarle directamente.',
  ].join('\n');

  const html = `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#111827">
<h2 style="font-size:18px">Nuevo mensaje desde xaska.co</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="color:#4b5563">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>
<h3 style="font-size:16px">Mensaje</h3>
<p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
<p style="color:#4b5563;font-size:13px">Autorizó el tratamiento de sus datos según la política de privacidad de xaska.co. Responde a este correo para contestarle directamente.</p>
</body></html>`;

  if ((env.MAIL_TRANSPORT ?? 'resend') === 'log') {
    console.log(`contacto: correo simulado para ${to} (${data.interest})`);
    return;
  }

  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    throw new Error('Falta RESEND_API_KEY o MAIL_FROM');
  }

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [to],
      reply_to: data.email,
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
}
