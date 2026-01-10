import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { ReportsModule } from './reports/reports.module';
import { WsServerModule } from './ws-server/ws-server.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb+srv://tranminhhieu620:HieuDepZai@chamcong.knp7cdc.mongodb.net/?appName=ChamCong',
    ),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USER || 'user@gmail.com', 
          pass: process.env.MAIL_PASS || 'pass',
        },
      },
      defaults: {
        from: '"Cham Cong App" <noreply@chamcong.com>',
      },
    }),
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule,
    ReportsModule,
    WsServerModule,
  ],
})
export class AppModule {}
