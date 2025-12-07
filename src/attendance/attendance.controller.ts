import { Controller, Get, Param, UseGuards, Request, Post, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceGateway } from './attendance.gateway';
import { EmployeesService } from '../employees/employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    private readonly gateway: AttendanceGateway,
    private readonly employeesService: EmployeesService, 
  ) {}

  @Get()
  @Roles('owner')
  async findAll() {
    return this.service.findAll();
  }

  @Post('mode/:action')
  @Roles('owner')
  async setMode(@Param('action') action: string) {
    let mode: 'CHECK_IN' | 'CHECK_OUT' | 'IDLE' = 'IDLE';
    
    switch (action.toLowerCase()) {
      case 'check-in':
        mode = 'CHECK_IN';
        break;
      case 'check-out':
        mode = 'CHECK_OUT';
        break;
      case 'idle':
        mode = 'IDLE';
        break;
      default:
        return { error: 'Invalid mode. Use: check-in, check-out, or idle' };
    }

    return this.service.setMode(mode);
  }

  @Get('mode')
  @Roles('owner')
  async getMode() {
    return this.service.getMode();
  }

  @Get('check-ins')
  @Roles('owner')
  async findCheckIns() {
    return this.service.findCheckIns();
  }

  @Get('check-outs')
  @Roles('owner')
  async findCheckOuts() {
    return this.service.findCheckOuts();
  }

  @Get('me')
  @Roles('employee', 'owner')
  async findMyAttendance(@Request() req) {
    // req.user is populated by JwtStrategy
    // employeeId is now guaranteed if it was in the token
    return this.service.findByEmployee(req.user.employeeId);
  }

  @Get('employee/:id')
  @Roles('owner')
  async findByEmployee(@Param('id') id: string) {
    return this.service.findByEmployee(id);
  }

  @Post('start-enroll/:employeeId')
  @Roles('owner')
  async startEnroll(@Param('employeeId') employeeId: string) {
    // 1. Assign ID
    const emp = await this.employeesService.assignFingerId(employeeId);
    
    // 2. Send Command
    if (emp && emp.fingerId) {
       this.gateway.sendEnrollCmd(emp.fingerId);
    }
    
    return { message: 'Enrollment started', fingerId: emp.fingerId };
  }
}
