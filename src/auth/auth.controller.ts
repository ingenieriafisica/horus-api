import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/otp/request
   * Público — solicita el envío de un OTP al correo registrado.
   */
  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  /**
   * POST /auth/otp/verify
   * Público — verifica el OTP y devuelve access_token + refresh_token.
   *
   * Respuesta:
   * {
   *   access_token:  "eyJ...",
   *   refresh_token: "eyJ...",
   *   token_type:    "Bearer",
   *   expires_in:    28800,        // segundos (8h)
   *   user: { email, role, companyId, companyName, branchIndexes }
   * }
   */
  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * POST /auth/refresh
   * Público (usa refresh_token, no access_token).
   * Renueva el access_token sin pedir el código OTP de nuevo.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  /**
   * POST /auth/logout
   * Protegido — requiere access_token válido.
   * Invalida tanto el access_token como el refresh_token almacenado.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    const token = req.headers.authorization!.split(' ')[1];
    const user  = (req as any).user as { email: string };
    return this.authService.logout(token, user.email);
  }
}