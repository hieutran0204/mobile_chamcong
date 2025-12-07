import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateEmployeeAccountDto } from './dto/create-employee-account.dto';
import { RegisterEmployeeSelfDto } from './dto/register-employee-self.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from './user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterEmployeeSelfDto) {
    return this.authService.registerSelf(dto.username, dto.password, dto.name, dto.position);
  }

  @Post('register-owner')
  async registerOwner(@Body() dto: RegisterDto) {
    return this.authService.registerOwner(dto.username, dto.password);
  }

  @Post('register-employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async registerEmployee(@Body() dto: CreateEmployeeAccountDto) {
    return this.authService.registerEmployee(dto.username, dto.password, dto.employeeId);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}
