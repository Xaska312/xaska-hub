# Pendientes

Lo que falta aportar o decidir. La sección "Marcadores en el código" se regenera con `pnpm pendientes`.

## Pasos que te tocan

- [x] Node 24 en tu equipo (fase 0 probada en local).
- [ ] Conectar el repositorio a Cloudflare (cuando lo subas a GitHub). Los pasos están en el README.

## Datos de la empresa (sección 10 del prompt)

- [ ] Horario de atención.
- [x] Botón principal: "Pedir una demo" por WhatsApp. Condiciones de la prueba tomadas del repositorio del POS.
- [x] Planes Básico ($49.900) y Pro ($99.900) publicados.
- [ ] Respuesta oficial sobre DIAN / facturación electrónica para las preguntas frecuentes.
- [ ] Capturas de XASKA POS sin datos de clientes reales.
- [ ] Bio y foto de Daniel Mejía.
- [ ] Datos del responsable del tratamiento de datos (nombre, documento, dirección para notificaciones).
- [x] `app.xaska.co/privacidad` y `app.xaska.co/terminos` existen en el repositorio del POS.
- [x] Misión (opción 2) y visión (opción 1) elegidas.
- [ ] Aprobar valores y textos (fase 1).
- [ ] Nombre definitivo de la línea de hardware y si se incluye (hoy "Xaska Tech", oculta).
- [ ] Cuentas de Cloudflare (Turnstile), Resend y GitHub, y registros DNS de `envios.xaska.co`. Pasos en `docs/GUIA-CUENTAS.md`.
- [ ] Revisión del abogado de la política de datos y los términos del sitio.
- [ ] Probar el formulario en tu navegador con `pnpm preview` (Turnstile real + CSP).

## Marcadores en el código

<!-- inicio:automatico -->

_Generado con `pnpm pendientes`. 3 datos pendientes y 0 borradores por aprobar._

| Tipo | Archivo                           | Línea | Texto                                                                                                                                                                                        |
| ---- | --------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dato | `src/content/legal/privacidad.md` | 81    | Esta política rige desde PENDIENTE fecha de publicación. Si la cambiamos de forma importante, lo indicaremos en esta página con la nueva fecha.                                              |
| Dato | `src/content/pos/index.yaml`      | 102   | - 'PENDIENTE qué documentos emite (factura electrónica de venta, documento equivalente POS electrónico, notas crédito), si se hace con un proveedor tecnológico y si tiene costo adicional.' |
| Dato | `src/content/pos/index.yaml`      | 103   | faqAnswer: 'Sí. PENDIENTE respuesta completa cuando salga la factura electrónica en XASKA POS (documentos, cómo se activa y costo, si lo tiene).'                                            |

<!-- fin:automatico -->
