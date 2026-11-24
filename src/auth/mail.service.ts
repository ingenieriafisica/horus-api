import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  HORUS_BRAND_ICON_CID,
  buildOtpEmailTemplate,
  getHorusBrandIconBuffer,
} from './templates/otp-email.template';

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
   * Envía el código OTP al correo del usuario usando la plantilla visual de Horus Analytics
   * (Zinc Dark Theme alineado con la UI de login y verificación OTP).
   */
  async sendOtp(to: string, code: string, expiresInMinutes = 10): Promise<void> {
    const { subject, html, text } = buildOtpEmailTemplate({
      to,
      code,
      expiresInMinutes,
    });

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || `"Horus Analytics" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
        text,
        attachments: [
          {
            filename: 'horus-icon.png',
            content: getHorusBrandIconBuffer(),
            cid: HORUS_BRAND_ICON_CID,
            contentDisposition: 'inline',
          },
        ],
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
