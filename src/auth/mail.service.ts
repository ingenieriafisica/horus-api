import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true', // true → 465, false → 587 (STARTTLS)
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,  // App Password si usas Gmail con 2FA
      },
    });
  }

  /**
   * Envía el código OTP al correo del usuario.
   * El HTML incluye el código grande y legible, con expiración visible.
   */
  async sendOtp(to: string, code: string, expiresInMinutes = 10): Promise<void> {
    const subject = `${code} es tu código de acceso — Horus`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
                   style="background:#FFFFFF;border-radius:12px;overflow:hidden;
                          box-shadow:0 4px 20px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:#1A3A6B;padding:32px 40px;text-align:center;">
                  <p style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;
                             letter-spacing:-0.5px;">Horus</p>
                  <p style="margin:6px 0 0;color:#D5E8F0;font-size:13px;">
                    Plataforma de conteo de personas
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 8px;color:#1F2937;font-size:16px;font-weight:600;">
                    Hola 👋
                  </p>
                  <p style="margin:0 0 28px;color:#4B5563;font-size:15px;line-height:1.6;">
                    Recibimos una solicitud de acceso a tu cuenta. Usa el siguiente
                    código para continuar:
                  </p>

                  <!-- OTP Box -->
                  <div style="background:#F0F7FF;border:2px solid #2E75B6;border-radius:10px;
                              padding:28px;text-align:center;margin-bottom:28px;">
                    <p style="margin:0 0 4px;color:#6B7280;font-size:12px;
                               text-transform:uppercase;letter-spacing:1px;">
                      Código de verificación
                    </p>
                    <p style="margin:0;color:#1A3A6B;font-size:48px;font-weight:700;
                               letter-spacing:12px;font-family:'Courier New',monospace;">
                      ${code}
                    </p>
                  </div>

                  <p style="margin:0 0 24px;color:#4B5563;font-size:14px;line-height:1.6;">
                    ⏱ Este código expira en <strong>${expiresInMinutes} minutos</strong>.<br>
                    Si no solicitaste este código, puedes ignorar este correo con seguridad.
                  </p>

                  <div style="background:#FEF3C7;border-left:4px solid #F59E0B;
                              border-radius:4px;padding:12px 16px;">
                    <p style="margin:0;color:#92400E;font-size:13px;">
                      🔒 Nunca compartas este código con nadie. Horus jamás
                      te lo pedirá por teléfono o chat.
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;
                            text-align:center;">
                  <p style="margin:0;color:#9CA3AF;font-size:12px;">
                    © ${new Date().getFullYear()} Horus · Este es un correo automático,
                    no respondas a este mensaje.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || `"Horus" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
        // Texto plano para clientes sin soporte HTML
        text: `Tu código de acceso Horus es: ${code}\nExpira en ${expiresInMinutes} minutos.\nNunca compartas este código.`,
      });
      this.logger.log(`OTP enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando OTP a ${to}:`, error);
      throw new InternalServerErrorException('No se pudo enviar el correo. Inténtalo de nuevo.');
    }
  }

  /**
   * Envía una notificación de alerta (aforo máximo o radar sin conexión).
   * No lanza excepción para no interrumpir flujos de ingestión IoT.
   */
  async sendAlertEmail(
    to: string[],
    subject: string,
    title: string,
    message: string,
  ): Promise<void> {
    if (!to.length || !process.env.MAIL_USER) return;

    const html = `
      <div style="font-family:Arial,sans-serif;background:#F3F4F6;padding:32px;">
        <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
          <div style="background:#1A3A6B;padding:20px 28px;color:#FFFFFF;">
            <strong>Horus Alertas</strong>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:18px;">${title}</h2>
            <p style="margin:0;color:#4B5563;font-size:14px;line-height:1.6;">${message}</p>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || `"Horus Alertas" <${process.env.MAIL_USER}>`,
        to: to.join(','),
        subject,
        html,
        text: `${title}\n\n${message}`,
      });
      this.logger.log(`Alerta enviada por email a ${to.join(', ')}`);
    } catch (error) {
      this.logger.warn(`No se pudo enviar email de alerta: ${(error as Error).message}`);
    }
  }
}
