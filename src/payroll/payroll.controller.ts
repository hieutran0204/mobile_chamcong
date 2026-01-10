import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PayrollService } from '../payroll/payroll.service';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('salary')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('calculate')
  async calculate(@Body() body: { month: number; year: number }) {
    return this.payrollService.calculate(body.month, body.year);
  }

  @Post('send-payslip/:id')
  async sendPayslip(@Param('id') id: string) {
      return this.payrollService.sendPayslip(id);
  }

  @Get()
  async findAll(@Query('month') month: number, @Query('year') year: number) {
      if (month && year) {
          return this.payrollService.findByMonthYear(month, year);
      }
      return this.payrollService.findAll();
  }
}
