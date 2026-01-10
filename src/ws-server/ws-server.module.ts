import { Module, Global, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { EmployeesModule } from '../employees/employees.module';

@Global()
@Module({
  imports: [
    forwardRef(() => AttendanceModule),
    forwardRef(() => EmployeesModule),
  ],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class WsServerModule {}
