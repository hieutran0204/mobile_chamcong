import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Put,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { EventsService } from '../ws-server/events.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(
    private readonly service: EmployeesService,
    private readonly eventsService: EventsService,
  ) {}

  @Post()
  @Roles('owner')
  async create(@Body() dto: CreateEmployeeDto, @Request() req) {
    try {
      // create record with ownerId
      const ownerId = req.user.userId;
      const emp = await this.service.create(dto, ownerId);
      return emp;
    } catch (e: any) {
      return { error: e.message, stack: e.stack, details: e };
    }
  }

  @Get()
  @Roles('owner')
  async findAll(@Request() req) {
    return this.service.findAll(req.user.userId);
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

  @Post(':id/deactivate')
  @Roles('owner')
  async deactivate(@Param('id') id: string) {
    return this.service.update(id, { isActive: false } as any);
  }

  @Post(':id/activate')
  @Roles('owner')
  async activate(@Param('id') id: string) {
    return this.service.update(id, { isActive: true } as any);
  }

  @Post(':id/enroll-start')
  @Roles('owner')
  async startEnrollment(@Param('id') id: string) {
    const emp = await this.service.findOne(id);
    const nextFingerId = await this.service.getNextFingerId();

    // Send command to device
    // ESP32 expects: cmd "ENROLL_MODE" with userId
    this.eventsService.sendCommandToDevice('ENROLL_MODE', {
      userId: id,
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
