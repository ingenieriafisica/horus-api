import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
export declare const IS_PUBLIC_KEY = "isPublic";
export declare function Public(): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class JwtAuthGuard implements CanActivate {
    private jwtService;
    private reflector;
    constructor(jwtService: JwtService, reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare const ROLES_KEY = "roles";
export declare function Roles(...roles: string[]): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class RolesGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
