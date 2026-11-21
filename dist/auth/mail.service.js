"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }
    async sendOtp(to, code, expiresInMinutes = 10) {
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
                text: `Tu código de acceso Horus es: ${code}\nExpira en ${expiresInMinutes} minutos.\nNunca compartas este código.`,
            });
            this.logger.log(`OTP enviado a ${to}`);
        }
        catch (error) {
            this.logger.error(`Error enviando OTP a ${to}:`, error);
            throw new common_1.InternalServerErrorException('No se pudo enviar el correo. Inténtalo de nuevo.');
        }
    }
    async sendAlertEmail(to, subject, title, message) {
        if (!to.length || !process.env.MAIL_USER)
            return;
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
        }
        catch (error) {
            this.logger.warn(`No se pudo enviar email de alerta: ${error.message}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map