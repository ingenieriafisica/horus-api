import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { CompaniesModule } from '../companies/companies.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            global: true,
            useFactory: () => ({
                secret: process.env.JWT_SECRET!,
                signOptions: {
                    expiresIn: '8h',
                    algorithm: 'HS256',
                    issuer: 'peoplecount-api',
                    audience: 'peoplecount-clients',
                },
            }),
        }),
        CompaniesModule, // provee CompaniesService
    ],
    controllers: [AuthController],
    providers: [
        MailService,
        TokenBlacklistService,
        AuthService,
        JwtStrategy,

        // Guards globales: JwtAuthGuard protege todo excepto rutas @Public()
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
    exports: [AuthService, TokenBlacklistService, MailService],
})
export class AuthModule { }
