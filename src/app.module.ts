import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { WsServerModule } from './ws-server/ws-server.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb+srv://tranminhhieu620:HieuDepZai@chamcong.knp7cdc.mongodb.net/?appName=ChamCong',
    ),
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    WsServerModule,
  ],
})
export class AppModule {}
