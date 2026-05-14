export declare class CompaniesModule {
}
import { CamerasService } from '../cameras/cameras.service';
import { CamerasController } from '../cameras/cameras.controller';
export declare class CamerasModule {
    static imports: (typeof CompaniesModule | import("@nestjs/common").DynamicModule)[];
    static providers: (typeof CamerasService)[];
    static controllers: (typeof CamerasController)[];
    static exports: (typeof CamerasService)[];
}
import { CountsService } from '../counts/counts.service';
import { CountsController } from '../counts/counts.controller';
export declare class CountsModule {
    static imports: (typeof CamerasModule | import("@nestjs/common").DynamicModule)[];
    static providers: (typeof CountsService)[];
    static controllers: (typeof CountsController)[];
}
import { AuthService } from '../auth/auth.service';
import { AuthController } from '../auth/auth.controller';
export declare class AuthModule {
    static imports: (typeof CompaniesModule | import("@nestjs/common").DynamicModule)[];
    static providers: (typeof AuthService)[];
    static controllers: (typeof AuthController)[];
}
