import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-modules/ioredis';

// Schemas
import { Count, CountSchema } from './counts/entities/count.schema';

// Modules
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { RadarsModule } from './radars/radars.module';

// Services & Controllers (counts module — simple, sin módulo propio)
import { CountsService } from './counts/counts.service';
import { CountsController } from './counts/counts.controller';

import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    // ── Módulos de dominio ────────────────────────────────────────────────────
    AuthModule,       // JwtAuthGuard + RolesGuard + TenantGuard como APP_GUARD global
    CompaniesModule,  // Empresas y sedes
    RadarsModule,     // Radares ESP32 (reemplaza CamerasModule)

    // ── MongoDB Atlas ──────────────────────────────────────────────────────
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
        connectionFactory: (connection: any) => {
          connection.on('connected', () => console.log('[MongoDB] Conectado'));
          connection.on('error',     (err: Error) => console.error('[MongoDB] Error:', err.message));
          return connection;
        },
      }),
    }),

    // Counts solo necesita su propia colección (Radar la inyecta RadarsModule)
    MongooseModule.forFeature([
      { name: Count.name, schema: CountSchema },
    ]),

    // ── Redis (OTP + blacklist + caché) ───────────────────────────────────
    RedisModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return {
          type: 'single',
          url: redisUrl,
          options: {
            maxRetriesPerRequest: 3,
            retryStrategy:   (times: number) => Math.min(times * 50, 2000),
            reconnectOnError: (err: Error) =>
              ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED'].some(
                (c) => err.message.includes(c),
              ),
            connectTimeout: 10000,
            keepAlive: 10000,
          },
          onClientReady: (client: any) => {
            client.on('error', (err: Error) => console.error('[Redis] error:', err.message));
          },
        };
      },
    }),
  ],

  controllers: [CountsController],
  providers:   [CountsService],
})
export class AppModule {}
