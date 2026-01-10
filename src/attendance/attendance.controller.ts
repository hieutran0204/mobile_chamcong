import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { AttendanceGateway } from './attendance.gateway';
import { EmployeesService } from '../employees/employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

import { ManualAttendanceDto } from './dto/manual-attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    private readonly gateway: AttendanceGateway,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post('manual')
  @Roles('owner')
  @ApiBody({ type: ManualAttendanceDto })
  async manualAttendance(@Body() body: ManualAttendanceDto) {
    // date: YYYY-MM-DD, time: HH:mm
    // Force Vietnam Timezone (+07:00)
    const dateTime = new Date(`${body.date}T${body.time}:00+07:00`);
    
    if (body.type === 'check-in') {
      return this.service.manualCheckIn(body.employeeId, dateTime);
    } else {
      return this.service.manualCheckOut(body.employeeId, dateTime);
    }
  }

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


  @Get('employee/:id')
  @Roles('owner')
  async findByEmployee(@Param('id') id: string) {
    return this.service.findByEmployee(id);
  }

  @Post('start-enroll/:id')
  @Roles('owner')
  async startEnroll(@Param('id') id: string) {
    const emp = await this.employeesService.getEmptyFingerId(id);

    if (!emp) {
      throw new NotFoundException('Employee not found');
    }
    if (emp.fingerId) {
      await this.service.startEnroll(id, emp.fingerId);
    }
  }
}
