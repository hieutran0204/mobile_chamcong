import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payroll, PayrollDocument } from './payroll.schema';
import { Attendance, AttendanceDocument } from '../attendance/attendance.schema';
import { Employee, EmployeeDocument } from '../employees/employee.schema';

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(Payroll.name) private payrollModel: Model<PayrollDocument>,
    @InjectModel(Attendance.name) private attModel: Model<AttendanceDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private readonly mailerService: MailerService,
  ) {}

  async sendPayslip(id: string, ownerId: string) {
    const payroll = await this.payrollModel.findById(id).populate('user').exec();
    if (!payroll) {
        throw new NotFoundException('Payroll record not found');
    }

    // Verify Owner
    const employee = payroll.user as unknown as EmployeeDocument;
    if (employee.ownerId.toString() !== ownerId) {
        throw new NotFoundException('Payroll not found or access denied');
    }

    if (payroll.status !== 'CONFIRMED' && payroll.status !== 'SENT') {
        throw new BadRequestException('Payroll must be CONFIRMED before sending payslip. Current status: ' + payroll.status);
    }
    if (!employee || !employee.email) {
        return { success: false, message: 'Employee has no email address' };
    }

    const { month, year, total_hours, total_salary } = payroll;
    const formatSalary = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total_salary);

    try {
        await this.mailerService.sendMail({
            to: employee.email,
            subject: `Payslip for ${month}/${year}`,
            html: `
                <h1>Payslip: ${month}/${year}</h1>
                <p>Hello <b>${employee.name}</b>,</p>
                <p>Here is your salary details for this month:</p>
                <ul>
                    <li><b>Total Hours:</b> ${total_hours} hrs</li>
                    <li><b>Total Salary:</b> ${formatSalary}</li>
                </ul>
                <p>Status: CONFIRMED</p>
                <br/>
                <p>Best regards,<br/>Cham Cong App</p>
            `,
        });

        payroll.status = 'SENT';
        await payroll.save();

        return { success: true, message: `Payslip sent to ${employee.email}` };
    } catch (e) {
        console.error('Email send error:', e);
        return { success: false, message: 'Failed to send email', error: e.message };
    }
  }

  // New Method: Confirm Payroll (Lock it)
  async confirm(id: string, ownerId: string) {
      const payroll = await this.payrollModel.findById(id).populate('user');
      if (!payroll) throw new NotFoundException('Payroll not found');

      const employee = payroll.user as unknown as EmployeeDocument;
      if (employee.ownerId.toString() !== ownerId) {
          throw new NotFoundException('Payroll not found or access denied');
      }

      if (payroll.status !== 'DRAFT') {
          throw new BadRequestException('Only DRAFT payroll can be confirmed');
      }

      payroll.status = 'CONFIRMED';
      await payroll.save();
      return { success: true, message: 'Payroll confirmed', data: payroll };
  }

  async calculate(month: number, year: number, ownerId: string) {
    const employees = await this.employeeModel.find({ ownerId });
    const results: Payroll[] = [];

    // Calculate dates broadly to cover potential timezone offset issues if needed,
    // but for now, we'll store date as string YYYY-MM-DD so we can regex/substring match or filter by range.
    // However, the attendance date is stored as string 'YYYY-MM-DD'.
    // Let's filter by string prefix.
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    for (const user of employees) {
      // 0. Check existing payroll
      const existing = await this.payrollModel.findOne({ user: user._id, month, year }).exec();
      
      // CRITICAL FIX: Do not overwrite if already finalized
      if (existing && (existing.status === 'CONFIRMED' || existing.status === 'SENT')) {
          // Skip calculation for this finalized record
          results.push(existing); 
          continue; 
      }

      const attendances = await this.attModel.find({
        employeeId: user._id,
        date: { $regex: new RegExp(`^${prefix}`) },
      });

      const total_hours = attendances.reduce((sum, record) => sum + (record.work_hours || 0), 0);
      const total_salary = total_hours * (user.hourly_rate || 0);

      // Upsert
      const payroll = await this.payrollModel.findOneAndUpdate(
        { user: user._id, month, year },
        {
          total_hours: parseFloat(total_hours.toFixed(2)),
          total_salary: parseFloat(total_salary.toFixed(2)),
          status: 'DRAFT', // Always DRAFT on calculation/re-calculation
        },
        { new: true, upsert: true }
      ).populate('user', 'name');

      results.push(payroll);
    }

    return results;
  }
  
  async findAll(ownerId: string) {
      // Filter by employees of this owner
      // This requires a join or two queries.
      // Easier: Find all employees of owner, then find payrolls for those employees
      const employees = await this.employeeModel.find({ ownerId }).select('_id');
      const empIds = employees.map(e => e._id);
      
      return this.payrollModel.find({ user: { $in: empIds } }).populate('user', 'name').exec();
  }
  
  async findByMonthYear(month: number, year: number, ownerId: string) {
      const employees = await this.employeeModel.find({ ownerId }).select('_id');
      const empIds = employees.map(e => e._id);

      return this.payrollModel.find({ month, year, user: { $in: empIds } }).populate('user', 'name hourly_rate').exec();
  }
}
