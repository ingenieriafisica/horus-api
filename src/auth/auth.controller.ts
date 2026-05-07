import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from '../common/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  /**
   * POST /auth/otp/request
   * Solicita un código OTP. El usuario recibe el código por email.
   * Body: { email }
   */
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.svc.requestOtp(dto);
  }

  /**
   * POST /auth/otp/verify
   * Verifica el OTP y devuelve access_token + refresh_token.
   * Body: { email, code }
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.svc.verifyOtp(dto);
  }

  /**
   * POST /auth/refresh
   * Renueva el access_token usando el refresh_token.
   * Body: { refresh_token }
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.svc.refresh(refreshToken);
  }

  /**
   * POST /auth/logout
   * Invalida el refresh_token del usuario en Redis.
   * Body: { email }
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body('email') email: string) {
    return this.svc.logout(email);
  }
}
