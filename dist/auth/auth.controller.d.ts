import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from '../common/dto';
export declare class AuthController {
    private readonly svc;
    constructor(svc: AuthService);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: object;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
    }>;
    logout(email: string): Promise<{
        message: string;
    }>;
}
