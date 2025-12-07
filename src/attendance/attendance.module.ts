import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendance, AttendanceSchema } from './attendance.schema';
import { AttendanceService } from './attendance.service';
import { EmployeesModule } from '../employees/employees.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceGateway } from './attendance.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
    EmployeesModule,
  ],
  providers: [AttendanceService, AttendanceGateway],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
