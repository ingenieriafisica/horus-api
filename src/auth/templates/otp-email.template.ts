export const HORUS_BRAND_ICON_CID = 'horus-brand-icon@horus';

/**
 * 96×96 (2x Retina para 48×48 px) PNG del ícono de marca de Horus Analytics:
 * contenedor redondeado #18181b con borde 1px #27272a y el ícono del ojo en #fafafa,
 * replicando exactamente `.brand-icon` de la UI Angular (shadcn/ui Zinc Dark Theme).
 */
export const HORUS_BRAND_ICON_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAD8ElEQVR42u1dQWrbQBTVEbwMcezKuMm0WnkR6D7QvUMPEHqA0AOEgLehCy/TnVfpNot0b/AF7BPYFzBk782Up2rMZCJpRrI1EtUTPDCWNELvSe//+RL6QVByESIaCRFNhIiehYiWQkSyZVgm5w4ORoGPRYgoFCKaChFtWki4DZuEm7AK4jtCRDP9gOfnn2QYDmWvF8qzsw/y5KTbKuCcce7gAFwYYoCrzrHIHwsRvarBB4OPstvtt45wG8AJuNFEAGfjQ8nfX/XD4YU8Pe2RbAvAEbjS74ayljPHABcXn2W/PyC5BQHOwF0iwryQJenk024OsyVdhEK2Q/IrEWHmEnBJfrUijPN8P8526PnVxAQtO+pkWg8iOAmrBlp2NEub4cYrmWpWm6Jq6WmoCzBVkywSVS20ydpUFyCu7TDw+gnIqnakVzXjegYJ8gOtdjQKknJqXFQiOX4ArhMBJkFS044reyTHD8B1IsBzoB6mtLGkXGcpWz3UCVRaRGL8QvFOASgABaAAFIACkBQKQAEICkABCApAAQgKQAEICkABGomrq6/y+vqbfHj4+Qb4D+sowJGBN8pub3/Il5c/crfbOQHbYh/sSwFK4vLyi3x6+i23260z8SawL8bAWBSgAGApNnLX67VcLBYx8Nu2PcakAA7+vlqtUgkE0Xd397k+j3XYBtumjYGxmxInGicAiEmzm7IWoiwszZaaIEKjBLi5+Z56xR/DuzFG2h2BY1KAjCv/8fGXM7muImHMJt0JjRAAaaJJPtLHvH2Q76elpPgP6/L2xdimCHWlqo0QwCQSAbTIVZwG292DY5jCtVIA0/cRMA8l31UEMzjXEQ9qF0DP3fE7zwpgLaZ1qPKDKkuYVpZnRziWefxWCWBe/Tbf160qK3iawdxmLWY88H0X1CqATqjL1ec6ozVn0EXuQt+xoDYBcPsXCbxIM12txbQqW4pqBmSfGREFaKsAtCAGYQZhpqGciHEixlIEi3EsxrEczQcyFICPJPlQngLwtRS+mEUB+GoiX86lAHw9naAAFICgABSAoAAUgKAAFICgABSAoAAUgKAA/7MA/Hi3Z5gf7+bn6z3D/Hw9Gzh4htnAgS1MPONNCxM28fGLd0182MbKL7LaWLGRmwdkNnJjK0M/yGxlyGae1cPazJPtbKsNvNZ2tmzo7IX8GVua10f+vEhP+Y4uAmNCOc/Xyc/0fRc7UtkRU1S3VFPLdtxtx9Jn/lUNiIkEbSndbrRJlsp2xsExlsSSZtrgcT0DRSVU9tpYysY549zBgVbb2V/1pSzHQYgwKVtsjAMS/ziZvpvhVrUkVdRJ8jxh2ULCl8m5T/ZVzRLLX95tl+jGVeSdAAAAAElFTkSuQmCC';

export function getHorusBrandIconBuffer(): Buffer {
  return Buffer.from(HORUS_BRAND_ICON_PNG_BASE64, 'base64');
}

export interface OtpEmailTemplateParams {
  to: string;
  code: string;
  expiresInMinutes: number;
  year?: number;
  iconSrc?: string;
}

export interface OtpEmailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Construye el correo transaccional de verificación OTP alineado con la UI de Horus Analytics
 * (shadcn/ui Zinc Dark Theme: #09090b shell, #111113 card, #18181b elevated, #27272a borders, #fafafa text).
 */
export function buildOtpEmailTemplate({
  to,
  code,
  expiresInMinutes,
  year = new Date().getFullYear(),
  iconSrc = `cid:${HORUS_BRAND_ICON_CID}`,
}: OtpEmailTemplateParams): OtpEmailContent {
  const safeTo = escapeHtml(to);
  const safeCode = escapeHtml(code);
  const safeIconSrc = escapeHtml(iconSrc);
  const minuteLabel = expiresInMinutes === 1 ? 'minuto' : 'minutos';

  const subject = `${code} es tu código de verificación — Horus Analytics`;

  const text = [
    'Horus Analytics — Verificación de acceso',
    '',
    `Tu código de verificación es: ${code}`,
    '',
    `Usa este código de 6 dígitos para iniciar sesión con ${to}.`,
    `El código expira en ${expiresInMinutes} ${minuteLabel}.`,
    '',
    'Aviso de seguridad: Nunca compartas este código con nadie. Horus Analytics jamás te lo pedirá por teléfono, correo ni chat.',
    'Si no solicitaste este código, puedes ignorar este correo de forma segura.',
    '',
    `© ${year} Horus Analytics · Correo automático, no respondas a este mensaje.`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Código de verificación — Horus Analytics</title>
  <!--[if !mso]><!-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
  <style>
    :root {
      color-scheme: dark;
      supported-color-schemes: dark;
    }
    body, table, td, p, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    a[x-apple-data-detectors],
    .email-highlight a,
    u + #body a {
      color: #fafafa !important;
      text-decoration: none !important;
      font-weight: 500 !important;
    }
    @media only screen and (max-width: 480px) {
      .shell-pad {
        padding: 28px 12px !important;
      }
      .card-pad {
        padding: 24px 20px !important;
      }
      .otp-code {
        font-size: 26px !important;
        letter-spacing: 0.28em !important;
        padding-left: 0.28em !important;
      }
    }
  </style>
</head>
<body id="body" bgcolor="#09090b" style="margin:0;padding:0;width:100%;background-color:#09090b;color:#fafafa;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader invisible para la vista previa de la bandeja de entrada -->
  <div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;font-size:1px;line-height:1px;color:#09090b;mso-hide:all;">
    Tu código de verificación de Horus Analytics es ${safeCode}. Expira en ${expiresInMinutes} ${minuteLabel}.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- Shell principal (#09090b — bg-shell) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#09090b" style="width:100%;background-color:#09090b;">
    <tr>
      <td align="center" class="shell-pad" style="padding:44px 16px;">
        <!--[if mso]>
        <table role="presentation" width="448" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:448px;width:100%;margin:0 auto;">

          <!-- Encabezado de marca (replica .brand-header de login y otp-verify) -->
          <tr>
            <td align="center" style="padding:0 0 26px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="padding:0 0 12px 0;">
                    <img
                      src="${safeIconSrc}"
                      width="48"
                      height="48"
                      alt="Horus Analytics"
                      style="display:block;width:48px;height:48px;border-radius:10px;background-color:#18181b;color:#fafafa;font-size:12px;font-weight:600;text-align:center;line-height:48px;"
                    />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 6px 0;">
                    <h1 style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;line-height:1.2;letter-spacing:-0.03em;color:#fafafa;">
                      Horus Analytics
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:400;line-height:1.45;color:#a1a1aa;">
                      Plataforma avanzada de inteligencia de visitantes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tarjeta principal (#111113 — .otp-card) -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111113" style="width:100%;background-color:#111113;border:1px solid #27272a;border-radius:12px;border-collapse:separate;">
                <tr>
                  <td class="card-pad" style="padding:28px 26px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">

                      <!-- Título y descripción (replica .card-heading) -->
                      <tr>
                        <td style="padding:0 0 22px 0;">
                          <h2 style="margin:0 0 6px 0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-0.025em;color:#fafafa;">
                            Tu código de verificación
                          </h2>
                          <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:400;line-height:1.55;color:#a1a1aa;">
                            Ingresa este código de 6 dígitos para iniciar sesión con<br>
                            <span class="email-highlight" style="color:#fafafa;font-weight:500;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">${safeTo}</span>
                          </p>
                        </td>
                      </tr>

                      <!-- Label del campo OTP (replica .field-label) -->
                      <tr>
                        <td style="padding:0 0 8px 0;">
                          <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:500;line-height:1.4;color:#a1a1aa;">
                            Código de verificación
                          </p>
                        </td>
                      </tr>

                      <!-- Caja del código OTP (#18181b — replica .otp-input-wrapper) -->
                      <tr>
                        <td style="padding:0 0 14px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="width:100%;background-color:#18181b;border:1px solid #27272a;border-radius:8px;border-collapse:separate;">
                            <tr>
                              <td align="center" style="padding:18px 16px;">
                                <p class="otp-code" style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:32px;font-weight:600;line-height:1.2;letter-spacing:0.35em;padding-left:0.35em;color:#fafafa;font-variant-numeric:tabular-nums;user-select:all;-webkit-user-select:all;">
                                  ${safeCode}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Fila de expiración (replica .timer-row + indicador .horus-badge--ok) -->
                      <tr>
                        <td style="padding:0 0 20px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="width:100%;background-color:#18181b;border:1px solid #27272a;border-radius:8px;border-collapse:separate;">
                            <tr>
                              <td style="padding:10px 12px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td valign="middle" style="padding:0 9px 0 0;font-size:0;line-height:0;">
                                      <div style="width:7px;height:7px;border-radius:9999px;background-color:#22c55e;font-size:0;line-height:0;"></div>
                                    </td>
                                    <td valign="middle">
                                      <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:400;line-height:1.4;color:#a1a1aa;font-variant-numeric:tabular-nums;">
                                        El código expira en <strong style="color:#fafafa;font-weight:600;">${expiresInMinutes} ${minuteLabel}</strong>
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Divisor sutil (#27272a) -->
                      <tr>
                        <td style="padding:0 0 20px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                            <tr>
                              <td style="border-top:1px solid #27272a;font-size:0;line-height:0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Aviso de seguridad (replica .horus-badge--warn: borde sutil ámbar y punto #f59e0b) -->
                      <tr>
                        <td style="padding:0 0 16px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="width:100%;background-color:#18181b;border:1px solid #3f3116;border-radius:8px;border-collapse:separate;">
                            <tr>
                              <td style="padding:12px 12px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td valign="top" width="1" style="padding:6px 9px 0 0;font-size:0;line-height:0;">
                                      <div style="width:7px;height:7px;border-radius:9999px;background-color:#f59e0b;font-size:0;line-height:0;"></div>
                                    </td>
                                    <td valign="top">
                                      <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.55;color:#a1a1aa;">
                                        <strong style="color:#fde68a;font-weight:600;">Aviso de seguridad:</strong> Nunca compartas este código con nadie. Horus Analytics jamás te lo pedirá por teléfono, correo ni chat.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Nota secundaria -->
                      <tr>
                        <td>
                          <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.5;color:#71717a;">
                            Si no solicitaste este acceso, puedes ignorar este correo de forma segura.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie legal (replica .legal-footer) -->
          <tr>
            <td align="center" style="padding:24px 8px 0 8px;">
              <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.5;color:#71717a;text-align:center;">
                &copy; ${year} Horus Analytics &middot; Este es un correo automático, no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
