import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';

// Schemas
import { Company, CompanySchema, Camera, CameraSchema } from './companies/entities/company.schema';
import { Count, CountSchema } from './counts/entities/count.schema';

// Services
import { CompaniesService } from './companies/companies.service';
import { CamerasService } from './cameras/cameras.service';
import { CountsService } from './counts/counts.service';

// Controllers
import { CompaniesController } from './companies/companies.controller';
import { CamerasController } from './cameras/cameras.controller';
import { CountsController } from './counts/counts.controller';
import { AuthController } from './auth/auth.controller';

// Guards y módulo de auth
import { TenantGuard } from './common/guards';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ── Auth (incluye JwtAuthGuard + RolesGuard como APP_GUARD) ────────────
    AuthModule,

    // ── MongoDB Atlas ──────────────────────────────────────────────────────
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Camera.name,  schema: CameraSchema  },
      { name: Count.name,   schema: CountSchema   },
    ]),

    // ── Redis (OTP + sesiones) ─────────────────────────────────────────────
    RedisModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return {
          type: 'single',
          url: redisUrl,
          options: {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => Math.min(times * 50, 2000),
            reconnectOnError: (err: Error) =>
              ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED'].some(
                (c) => err.message.includes(c),
              ),
            connectTimeout: 10000,
            keepAlive: 10000,
          },
          onClientReady: (client) => {
            client.on('error', (err: Error) =>
              console.error('[Redis] error:', err.message),
            );
          },
        };
      },
    }),
  ],

  controllers: [
    AuthController,
    CompaniesController,
    CamerasController,
    CountsController,
  ],

  providers: [
    CompaniesService,
    CamerasService,
    CountsService,

    // TenantGuard: garantiza aislamiento multitenant.
    // JwtAuthGuard y RolesGuard ya se registran en AuthModule.
    { provide: APP_GUARD, useClass: TenantGuard },
  ],
})
export class AppModule {}
