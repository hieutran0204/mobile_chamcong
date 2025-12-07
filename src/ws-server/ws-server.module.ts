import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Global() // Make it global so we can inject EventsService easily anywhere
@Module({
  imports: [AttendanceModule],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class WsServerModule {}
