import { Controller, Post, Body, Get, Query, Param, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PayrollService } from '../payroll/payroll.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('salary')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}


  @Post('calculate')
  async calculate(@Body() dto: CalculatePayrollDto, @Request() req) {
    return this.payrollService.calculate(dto.month, dto.year, req.user.userId);
  }

  @Post('confirm/:id')
  async confirm(@Param('id') id: string, @Request() req) {
    return this.payrollService.confirm(id, req.user.userId);
  }

  @Post('send-payslip/:id')
  async sendPayslip(@Param('id') id: string, @Request() req) {
      return this.payrollService.sendPayslip(id, req.user.userId);
  }

  @Get()
  async findAll(@Query('month') month: number, @Query('year') year: number, @Request() req) {
      if (month && year) {
          return this.payrollService.findByMonthYear(month, year, req.user.userId);
      }
      return this.payrollService.findAll(req.user.userId);
  }
}
