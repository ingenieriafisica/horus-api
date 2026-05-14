// ─── companies.module.ts ──────────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './entities/company.schema';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}

// ─── cameras.module.ts ────────────────────────────────────────────────────────
import { Camera, CameraSchema } from '../companies/entities/company.schema';
import { CamerasService } from '../cameras/cameras.service';
import { CamerasController } from '../cameras/cameras.controller';

export class CamerasModule {
  static imports = [
    MongooseModule.forFeature([{ name: Camera.name, schema: CameraSchema }]),
    CompaniesModule,
  ];
  static providers = [CamerasService];
  static controllers = [CamerasController];
  static exports = [CamerasService];
}

// ─── counts.module.ts ─────────────────────────────────────────────────────────
import { Count, CountSchema } from '../companies/entities/company.schema';
import { CountsService } from '../counts/counts.service';
import { CountsController } from '../counts/counts.controller';

export class CountsModule {
  static imports = [
    MongooseModule.forFeature([{ name: Count.name, schema: CountSchema }]),
    CamerasModule,
  ];
  static providers = [CountsService];
  static controllers = [CountsController];
}

// ─── auth.module.ts ───────────────────────────────────────────────────────────
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { AuthController } from '../auth/auth.controller';

export class AuthModule {
  static imports = [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'change-me-in-production',
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    CompaniesModule,
  ];
  static providers = [AuthService];
  static controllers = [AuthController];
}
