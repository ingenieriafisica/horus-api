import { IsEmail, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  email!: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token!: string;
}
