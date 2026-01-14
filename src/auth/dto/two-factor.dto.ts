import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class VerifyTwoFaDto {
  @ApiProperty({ example: 'username123', description: 'Username of the user' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code received via email' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class EnableTwoFaDto {
  @ApiProperty({ example: true, description: 'Set to true to enable 2FA, false to disable' })
  @IsBoolean()
  enable: boolean;
}
