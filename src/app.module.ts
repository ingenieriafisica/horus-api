import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';

// Schemas
import {
  Company, CompanySchema,
  Camera, CameraSchema,
  Count, CountSchema,
} from './companies/entities/company.schema';

// Services
import { CompaniesService } from './companies/companies.service';
import { CamerasService } from './cameras/cameras.service';
import { CountsService } from './counts/counts.service';
import { AuthService } from './auth/auth.service';

// Controllers
import { CompaniesController } from './companies/companies.controller';
import { CamerasController } from './cameras/cameras.controller';
import { CountsController } from './counts/counts.controller';
import { AuthController } from './auth/auth.controller';

// Guards
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // --- JWT (para autenticación) ───────────────────────────────────────────────
    AuthModule, // importa el módulo de autenticación que configura JwtModule
    // ── MongoDB ──────────────────────────────────────────────────────────────
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://nadc1000:8LdYHRlhQqNE55mH@ac-3u1ryyc-shard-00-00.j7vokv6.mongodb.net:27017,ac-3u1ryyc-shard-00-01.j7vokv6.mongodb.net:27017,ac-3u1ryyc-shard-00-02.j7vokv6.mongodb.net:27017/peoplecount?ssl=true&replicaSet=atlas-ce31v3-shard-0&authSource=admin&appName=Cluster0',
        // Recomendado para producción:
        // retryWrites: true,
        // w: 'majority',
      }),
    }),
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Camera.name, schema: CameraSchema },
      { name: Count.name, schema: CountSchema },
    ]),

    // ── Redis (OTP + sesiones) ────────────────────────────────────────────────
    RedisModule.forRootAsync({
      useFactory: () => {
        const redisHost = process.env.REDIS_HOST ?? '172.22.4.134';
        const redisPort = Number(process.env.REDIS_PORT ?? '6379');
        const redisUrl = process.env.REDIS_URL ?? `redis://${redisHost}:${redisPort}`;

        return {
          type: 'single',
          url: redisUrl,
          options: {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => Math.min(times * 50, 2000),
            reconnectOnError: (err: Error) => {
              return ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED']
                .some((code) => err.message.includes(code));
            },
            connectTimeout: 10000,
            keepAlive: 10000,
          },
          onClientReady: (client) => {
            client.on('error', (err: Error) => {
              console.error('[Redis] connection error:', err.message || err);
            });
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
    AuthService,
    CompaniesService,
    CamerasService,
    CountsService,

    // Guards globales: JWT requerido en todos los endpoints salvo @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
