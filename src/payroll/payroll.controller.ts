import { Controller, Post, Body, Get, Query, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PayrollService } from '../payroll/payroll.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('salary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}


  @Post('calculate')
  @Roles('owner')
  async calculate(@Body() dto: CalculatePayrollDto, @Request() req) {
    return this.payrollService.calculate(dto.month, dto.year, req.user.userId);
  }

  @Post('confirm/:id')
  @Roles('owner')
  async confirm(@Param('id') id: string, @Request() req) {
    return this.payrollService.confirm(id, req.user.userId);
  }

  @Post('send-payslip/:id')
  @Roles('owner')
  async sendPayslip(@Param('id') id: string, @Request() req) {
      return this.payrollService.sendPayslip(id, req.user.userId);
  }

  @Get()
  @Roles('owner')
  async findAll(@Query('month') month: number, @Query('year') year: number, @Request() req) {
      if (month && year) {
          return this.payrollService.findByMonthYear(month, year, req.user.userId);
      }
      return this.payrollService.findAll(req.user.userId);
  }
}
