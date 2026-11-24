import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { resolveCorsOrigin } from './common/cors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ── Prefijo global de versión ─────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: resolveCorsOrigin(process.env.ALLOWED_ORIGINS),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  // ── Validación global ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Horus API')
    .setDescription('API para plataforma Horus de conteo de personas. Multitenant.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── Arranque ──────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Horus API corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();
