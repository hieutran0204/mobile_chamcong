import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from '../attendance/attendance.schema';
import { Employee, EmployeeDocument } from '../employees/employee.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Attendance.name) private attModel: Model<AttendanceDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
  ) {}

  async generateSummary(from: string, to: string, ownerId: string) {
    // 1. Get all employees of THIS owner
    const employees = await this.employeeModel.find({ ownerId });
    const empIds = employees.map(e => e._id);
    
    // 2. Fetch attendance in range for THESE employees
    const query = {
        date: { $gte: from, $lte: to },
        employeeId: { $in: empIds } // Isolation
    };
    
    const attendances = await this.attModel.find(query).exec();

    // 3. Aggregate
    const reportData = employees.map(emp => {
        const empAtt = attendances.filter(a => a.employeeId.toString() === emp._id.toString());
        
        const totalWorkHours = empAtt.reduce((sum, a) => sum + (a.work_hours || 0), 0);
        const daysPresent = empAtt.length;

        return {
            employeeId: emp._id,
            name: emp.name,
            email: emp.email,
            daysPresent,
            totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
            attendances: empAtt 
        };
    });

    return {
        period: { from, to },
        data: reportData
    };
  }
}
