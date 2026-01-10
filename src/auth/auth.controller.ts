import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from './user.schema';

import { AttendanceService } from '../attendance/attendance.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('register-owner')
  async registerOwner(@Body() dto: RegisterDto) {
    // Expect name in DTO now
    return this.authService.registerOwner(dto.username, dto.password, dto.name || 'Owner');
  }

  @Post('register-admin')
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto.username, dto.password, dto.name || 'System Admin');
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}
