import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { TokenBlacklistService } from './token-blacklist.service';
import { CompaniesService } from '../companies/companies.service';
import * as dotenv from 'dotenv';
dotenv.config();

export interface JwtPayload {
  sub: string;       // email
  companyId: string;
  role: string;
  branchIndexes: number[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly blacklistService: TokenBlacklistService,
    private readonly companiesService: CompaniesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
      passReqToCallback: true, // necesario para acceder al token crudo
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // 1. Extraer el token crudo del header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token no proporcionado');

    // 2. Verificar blacklist (logout previo)
    const revoked = await this.blacklistService.isBlacklisted(token);
    if (revoked) {
      throw new UnauthorizedException('La sesión fue cerrada. Vuelve a iniciar sesión.');
    }

    // 3. Verificar que la empresa sigue activa (guard de tenant)
    const company = await this.companiesService.findCompanyByUserEmail(payload.sub);
    if (!company || (company as any).status !== 'active') {
      throw new UnauthorizedException('Empresa suspendida o no encontrada');
    }

    // 4. Verificar que el usuario sigue activo dentro de la empresa
    const user = (company as any).users.find(
      (u: any) => u.email === payload.sub && u.active,
    );
    if (!user) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    // El objeto retornado queda disponible como req.user en los controladores
    return {
      email:         payload.sub,
      companyId:     payload.companyId,
      role:          payload.role,
      branchIndexes: payload.branchIndexes,
    };
  }
}