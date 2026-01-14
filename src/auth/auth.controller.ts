import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFaDto, EnableTwoFaDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from './user.schema';

import { AttendanceService } from '../attendance/attendance.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('register-owner')
  async registerOwner(@Body() dto: RegisterDto) {
    // Expect name in DTO now
    return this.authService.registerOwner(dto.username, dto.password, dto.name || 'Owner', dto.email);
  }

  @Post('register-admin')
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto.username, dto.password, dto.name || 'System Admin', dto.email);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('verify-2fa')
  async verify2FA(@Body() dto: VerifyTwoFaDto) {
      return this.authService.verify2FA(dto.username, dto.otp);
  }


  @Post('enable-2fa')
  @UseGuards(JwtAuthGuard)
  async enable2FA(@Body() dto: EnableTwoFaDto, @Request() req) {
      // req.user.userId comes from JwtStrategy
      return this.authService.enable2FA(req.user.userId, dto.enable);
  }
}
