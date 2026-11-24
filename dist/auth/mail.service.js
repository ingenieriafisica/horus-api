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
const otp_email_template_1 = require("./templates/otp-email.template");
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
        const { subject, html, text } = (0, otp_email_template_1.buildOtpEmailTemplate)({
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
                        content: (0, otp_email_template_1.getHorusBrandIconBuffer)(),
                        cid: otp_email_template_1.HORUS_BRAND_ICON_CID,
                        contentDisposition: 'inline',
                    },
                ],
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