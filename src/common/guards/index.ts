import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como público (sin JWT requerido) */
export function Public() {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

// ─── roles.guard.ts ───────────────────────────────────────────────────────────
export const ROLES_KEY = 'roles';

/** Decora un endpoint con los roles permitidos */
export function Roles(...roles: string[]) {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new UnauthorizedException('Usuario no autenticado');

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new UnauthorizedException(
        `Rol requerido: ${requiredRoles.join(' | ')}. Tu rol: ${user.role}`,
      );
    }
    return true;
  }
}

// ─── tenant.guard.ts ──────────────────────────────────────────────────────────
/**
 * Garantiza aislamiento multitenant: el companyId en la petición debe
 * coincidir con el companyId del JWT, salvo que el rol sea 'super_admin'.
 * Se salta en rutas marcadas con @Public().
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Respetar rutas públicas (ESP32 heartbeat / ingest, auth OTP…)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      sub?: string;
      email?: string;
      companyId?: string;
      role?: string;
    } | undefined;

    if (!user) throw new UnauthorizedException();
    if (user.role === 'super_admin') return true;

    const requestedCompanyId =
      request.params?.companyId ||
      request.params?.id ||
      request.query?.companyId ||
      request.body?.companyId;

    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      throw new UnauthorizedException(
        'No autorizado para acceder a esta empresa',
      );
    }

    return true;
  }
}
