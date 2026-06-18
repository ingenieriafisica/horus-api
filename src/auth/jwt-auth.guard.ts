import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('[JWT-GUARD] err=', err?.message, 'user=', !!user, 'info=', info?.message ?? info?.name ?? JSON.stringify(info));
    if (err || !user) {
      throw err || new UnauthorizedException(
        info?.message || 'Acceso denegado. Autentícate para continuar.',
      );
    }
    return user;
  }
}
