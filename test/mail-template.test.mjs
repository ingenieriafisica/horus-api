import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  HORUS_BRAND_ICON_CID,
  buildOtpEmailTemplate,
  getHorusBrandIconBuffer,
} = require('../dist/auth/templates/otp-email.template.js');
const { MailService } = require('../dist/auth/mail.service.js');

describe('OTP Email Template (Horus Analytics Zinc Dark UI)', () => {
  it('builds HTML and text aligned with the Horus Analytics Zinc Dark design tokens', () => {
    const { subject, html, text } = buildOtpEmailTemplate({
      to: 'usuario@empresa.com',
      code: '482916',
      expiresInMinutes: 10,
      year: 2026,
    });

    assert.equal(subject, '482916 es tu código de verificación — Horus Analytics');

    // Design tokens matching horus_angular/src/styles.css & otp-verify.css
    for (const token of ['#09090b', '#111113', '#18181b', '#27272a', '#fafafa', '#a1a1aa', '#71717a', '#22c55e', '#f59e0b']) {
      assert.ok(html.includes(token), `Expected HTML to include UI color token ${token}`);
    }

    assert.ok(html.includes('Horus Analytics'));
    assert.ok(html.includes('Plataforma avanzada de inteligencia de visitantes'));
    assert.ok(html.includes('482916'));
    assert.ok(html.includes('usuario@empresa.com'));
    assert.ok(html.includes('10 minutos'));
    assert.ok(html.includes(`cid:${HORUS_BRAND_ICON_CID}`));
    assert.ok(html.includes('2026 Horus Analytics'));

    assert.ok(text.includes('482916'));
    assert.ok(text.includes('usuario@empresa.com'));
    assert.ok(text.includes('10 minutos'));
  });

  it('uses singular minute label and escapes HTML special characters', () => {
    const { html } = buildOtpEmailTemplate({
      to: '<script>@test.com',
      code: '012345',
      expiresInMinutes: 1,
    });

    assert.ok(html.includes('1 minuto'));
    assert.ok(!html.includes('1 minutos'));
    assert.ok(html.includes('&lt;script&gt;@test.com'));
    assert.ok(!html.includes('<script>@test.com'));
  });

  it('provides a valid PNG buffer for the inline Horus brand icon', () => {
    const buf = getHorusBrandIconBuffer();
    assert.ok(Buffer.isBuffer(buf));
    assert.deepEqual([...buf.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it('MailService.sendOtp sends HTML, text, and inline CID brand icon attachment', async () => {
    const mailService = new MailService();
    let capturedOptions = null;
    mailService.transporter = {
      sendMail: async (opts) => {
        capturedOptions = opts;
      },
    };

    await mailService.sendOtp('admin@horus.co', '903412', 10);

    assert.ok(capturedOptions);
    assert.equal(capturedOptions.to, 'admin@horus.co');
    assert.equal(capturedOptions.subject, '903412 es tu código de verificación — Horus Analytics');
    assert.ok(capturedOptions.html.includes('903412'));
    assert.ok(capturedOptions.html.includes(`cid:${HORUS_BRAND_ICON_CID}`));
    assert.ok(capturedOptions.text.includes('903412'));
    assert.equal(capturedOptions.attachments.length, 1);
    assert.equal(capturedOptions.attachments[0].cid, HORUS_BRAND_ICON_CID);
    assert.equal(capturedOptions.attachments[0].contentDisposition, 'inline');
    assert.ok(Buffer.isBuffer(capturedOptions.attachments[0].content));
  });
});
