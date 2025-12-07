import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EventsService } from '../ws-server/events.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(
    private readonly service: EmployeesService,
    private readonly eventsService: EventsService,
  ) {}

  @Post()
  @Roles('owner')
  async create(@Body() dto: CreateEmployeeDto) {
    try {
      // create record with no fingerId (owner will trigger enroll)
      const emp = await this.service.create(dto);
      return emp;
    } catch (e: any) {
      return { error: e.message, stack: e.stack, details: e };
    }
  }

  @Get()
  @Roles('owner')
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('owner')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('owner')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmployeeDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('owner')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/enroll-start')
  @Roles('owner')
  async startEnrollment(@Param('id') id: string) {
    const emp = await this.service.findOne(id);
    const nextFingerId = await this.service.getNextFingerId();

    // Send command to device
    // ESP32 expects: event "cmd_enroll" with data { fingerId: int }
    this.eventsService.sendCommandToDevice('cmd_enroll', {
      fingerId: nextFingerId,
      employeeId: emp._id, // Optional, for context if needed
      name: emp.name,
    });
    return { message: 'Enrollment command sent', fingerId: nextFingerId };
  }

  @Post(':id/enroll-confirm')
  @Roles('owner')
  async confirmEnrollment(
    @Param('id') id: string,
    @Body('fingerId') fingerId: number,
  ) {
    if (fingerId === undefined) {
      throw new Error('fingerId is required');
    }
    return this.service.update(id, { fingerId });
  }
}
