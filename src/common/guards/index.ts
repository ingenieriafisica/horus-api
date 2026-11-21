import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

export const TENANT_ID_PARAM_KEY = 'tenantIdParam';

/**
 * Indica qué parámetro de ruta (`req.params[paramName]`) representa el `companyId`
 * del tenant. Evita que rutas con `:id` de otros recursos (p. ej. `/radars/:id`
 * o `/alerts/:id`) sean confundidas con un `companyId`.
 */
export const TenantIdParam = (paramName = 'id') =>
  SetMetadata(TENANT_ID_PARAM_KEY, paramName);

/**
 * Garantiza aislamiento multitenant: el `companyId` en la petición debe
 * coincidir con el `companyId` del JWT, salvo que el rol sea `super_admin`.
 * Se salta en rutas marcadas con `@Public()`.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | {
          email?: string;
          companyId?: string;
          role?: string;
          branchIndexes?: number[];
        }
      | undefined;

    if (!user) throw new UnauthorizedException();
    if (user.role === 'super_admin') return true;

    const idParamName = this.reflector.getAllAndOverride<string>(
      TENANT_ID_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requestedCompanyId =
      request.params?.companyId ||
      (idParamName ? request.params?.[idParamName] : undefined) ||
      request.query?.companyId ||
      request.body?.companyId;

    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      throw new ForbiddenException('No autorizado para acceder a esta empresa');
    }

    return true;
  }
}

/**
 * Verifica si un usuario (`manager` / `viewer`) tiene acceso a una sede específica.
 * Si `branchIndexes` está vacío, el usuario tiene acceso a todas las sedes de su empresa.
 */
export function assertBranchAccess(
  user: { role?: string; branchIndexes?: number[] } | undefined,
  branchIndex?: number,
): void {
  if (!user || branchIndex === undefined) return;
  if (user.role === 'admin' || user.role === 'super_admin') return;
  const allowed = user.branchIndexes ?? [];
  if (allowed.length > 0 && !allowed.includes(branchIndex)) {
    throw new ForbiddenException(
      `No tienes permiso para acceder a la sede ${branchIndex}`,
    );
  }
}
