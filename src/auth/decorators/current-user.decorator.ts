import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el usuario autenticado (o un campo específico) del request.
 * Requiere que JwtAuthGuard haya ejecutado antes.
 *
 * Uso:
 *   @CurrentUser() user: JwtUser
 *   @CurrentUser('companyId') companyId: string
 */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field] : user;
  },
);
