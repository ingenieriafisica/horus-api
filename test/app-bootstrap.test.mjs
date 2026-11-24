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
const { resolveCorsOrigin } = require('../dist/common/cors.js');

describe('CORS Origin Resolution', () => {
  it('maps wildcard * and legacy 0.0.0.0 to true (origin reflection for credentials: true)', () => {
    assert.equal(resolveCorsOrigin('*'), true);
    assert.equal(resolveCorsOrigin('0.0.0.0'), true);
    assert.equal(resolveCorsOrigin('http://localhost:4200, *'), true);
  });

  it('trims whitespace and trailing slashes from comma-separated origins', () => {
    assert.deepEqual(
      resolveCorsOrigin(' http://localhost:4200/ , https://app.horus.co/// '),
      ['http://localhost:4200', 'https://app.horus.co'],
    );
  });

  it('falls back to localhost dev origins when unset', () => {
    assert.deepEqual(resolveCorsOrigin(undefined), ['http://localhost:3000', 'http://localhost:4200']);
  });
});

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
    app.enableCors({
      origin: resolveCorsOrigin('0.0.0.0'),
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    });
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

      const preflightRes = await fetch(`${base}/api/v1/auth/otp/request`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:4200',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      assert.equal(preflightRes.status, 204);
      assert.equal(preflightRes.headers.get('access-control-allow-origin'), 'http://localhost:4200');
      assert.equal(preflightRes.headers.get('access-control-allow-credentials'), 'true');

      const validationRes = await fetch(`${base}/api/v1/auth/otp/request`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Origin: 'http://localhost:4200',
        },
        body: JSON.stringify({ email: 'not-an-email' }),
      });
      assert.equal(validationRes.status, 400);
      assert.equal(validationRes.headers.get('access-control-allow-origin'), 'http://localhost:4200');
      const body = await validationRes.json();
      assert.ok(Array.isArray(body.message));
    } finally {
      await app.close();
    }
  });
});
