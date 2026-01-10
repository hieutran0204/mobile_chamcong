import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee, EmployeeSchema } from './employee.schema';
import { WsServerModule } from '../ws-server/ws-server.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    forwardRef(() => WsServerModule),
  ],
  providers: [EmployeesService],
  controllers: [EmployeesController],
  exports: [EmployeesService, MongooseModule],
})
export class EmployeesModule {}
