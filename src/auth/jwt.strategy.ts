import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(JwtStrategy.name);

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
    console.log('[JWT-VALIDATE] called, sub=', payload.sub);

    // 1. Extraer el token crudo del header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { console.error('[JWT-VALIDATE] No token'); throw new UnauthorizedException('Token no proporcionado'); }

    // 2. Verificar blacklist (logout previo)
    let revoked = false;
    try {
      revoked = await this.blacklistService.isBlacklisted(token);
      console.log('[JWT-VALIDATE] revoked=', revoked);
    } catch (e: any) {
      console.error('[JWT-VALIDATE] Blacklist error:', e.message);
    }
    if (revoked) {
      throw new UnauthorizedException('La sesión fue cerrada. Vuelve a iniciar sesión.');
    }

    // 3. Verificar que la empresa sigue activa (guard de tenant)
    let company: any;
    try {
      company = await this.companiesService.findCompanyByUserEmail(payload.sub);
      console.log('[JWT-VALIDATE] company=', company?._id?.toString(), 'status=', company?.status);
    } catch (e: any) {
      console.error('[JWT-VALIDATE] Company error:', e.message);
      throw new UnauthorizedException('Error buscando empresa');
    }
    if (!company || (company as any).status !== 'active') {
      console.log('[JWT-VALIDATE] company inactive or not found');
      throw new UnauthorizedException('Empresa suspendida o no encontrada');
    }

    // 4. Verificar que el usuario sigue activo dentro de la empresa
    const user = (company as any).users.find(
      (u: any) => u.email === payload.sub && u.active,
    );
    console.log('[JWT-VALIDATE] user found=', !!user);
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