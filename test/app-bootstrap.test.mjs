import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { CountsController } = require('../dist/counts/counts.controller.js');
const { AuthController } = require('../dist/auth/auth.controller.js');
const { CompaniesController } = require('../dist/companies/companies.controller.js');
const { RadarsController } = require('../dist/radars/radars.controller.js');
const { AlertsController } = require('../dist/alerts/alerts.controller.js');
const { CountsService } = require('../dist/counts/counts.service.js');
const { AuthService } = require('../dist/auth/auth.service.js');
const { CompaniesService } = require('../dist/companies/companies.service.js');
const { AuditService } = require('../dist/audit/audit.service.js');
const { RadarsService } = require('../dist/radars/radars.service.js');
const { AlertsService } = require('../dist/alerts/alerts.service.js');

describe('Horus API NestJS 12 Bootstrap', () => {
  it('mounts all controllers, Swagger docs, and ValidationPipe cleanly', async () => {
    const stub = {};
    const moduleRef = await Test.createTestingModule({
      controllers: [
        CountsController,
        AuthController,
        CompaniesController,
        RadarsController,
        AlertsController,
      ],
      providers: [
        { provide: CountsService, useValue: stub },
        { provide: AuthService, useValue: stub },
        { provide: CompaniesService, useValue: stub },
        { provide: AuditService, useValue: stub },
        { provide: RadarsService, useValue: stub },
        { provide: AlertsService, useValue: stub },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: ['http://localhost:4200'], credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Horus API')
      .setDescription('API para plataforma Horus de conteo de personas. Multitenant.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(0);
    try {
      const { port } = app.getHttpServer().address();
      const base = `http://127.0.0.1:${port}`;

      const docsRes = await fetch(`${base}/api/docs-json`);
      assert.equal(docsRes.status, 200);
      const docsJson = await docsRes.json();
      assert.equal(docsJson.info.title, 'Horus API');
      assert.equal(Object.keys(docsJson.paths).length, 33);

      const validationRes = await fetch(`${base}/api/v1/auth/otp/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });
      assert.equal(validationRes.status, 400);
      const body = await validationRes.json();
      assert.ok(Array.isArray(body.message));
    } finally {
      await app.close();
    }
  });
});
