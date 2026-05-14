import { Request } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: {
            email: string;
            role: string;
            companyId: string;
            companyName: string;
            branchIndexes: number[];
        };
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
}
