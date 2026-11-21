import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const TENANT_ID_PARAM_KEY = "tenantIdParam";
export declare const TenantIdParam: (paramName?: string) => import("@nestjs/common").CustomDecorator<string>;
export declare class TenantGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare function assertBranchAccess(user: {
    role?: string;
    branchIndexes?: number[];
} | undefined, branchIndex?: number): void;
