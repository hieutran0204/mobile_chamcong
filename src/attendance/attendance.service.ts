import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './attendance.schema';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceGateway } from './attendance.gateway';

@Injectable()
export class AttendanceService {
  private currentMode: 'CHECK_IN' | 'CHECK_OUT' | 'IDLE' = 'IDLE';

  constructor(
    @InjectModel(Attendance.name) private attModel: Model<AttendanceDocument>,
    private employeesService: EmployeesService,
    @Inject(forwardRef(() => AttendanceGateway))
    private readonly gateway: AttendanceGateway,
  ) {}

  // Mode Management
  setMode(mode: 'CHECK_IN' | 'CHECK_OUT' | 'IDLE') {
    this.currentMode = mode;
    console.log(`System mode set to: ${this.currentMode}`);

    // Notify ESP32
    if (mode === 'CHECK_IN') {
      this.gateway.broadcast('cmd_checkin', {}); // Send command to device
    } else if (mode === 'CHECK_OUT') {
      this.gateway.broadcast('cmd_checkout', {}); // Send command to device
    } else {
      this.gateway.broadcast('cmd_idle', {}); // Send command to device
    }

    return { mode: this.currentMode };
  }

  getMode() {
    return { mode: this.currentMode };
  }

  // Helper to get YYYY-MM-DD in Vietnam Time (UTC+7)
  private getVNDateString(d: Date = new Date()): string {
    const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().slice(0, 10);
  }

  // Helper to get Date object shifted to VN Time (so DB saves it as VN time visually)
  private getVNTime(d: Date = new Date()): Date {
    return new Date(d.getTime() + 7 * 60 * 60 * 1000);
  }

  // Queries
  async create(employeeId: string) {
    const today = this.getVNDateString();
    const now = new Date();
    const vnNow = this.getVNTime(now);

    return this.attModel.create({
      employeeId,
      date: today,
      checkIn: vnNow,
      status: 'present',
      createdAt: vnNow,
      updatedAt: vnNow,
    });
  }


  async findAll(ownerId: string) {
    // 1. Get employees of this owner
    const employees = await this.employeesService.findAll(ownerId);
    const result = [];
    
    // 2. This is inefficient but works without complex aggregations for now.
    // Better: find({ employeeId: { $in: [...] } })
    const empIds = employees.map(e => (e as any)._id);

    return this.attModel
      .find({ employeeId: { $in: empIds } })
      .populate('employeeId', 'name')
      .sort({ checkIn: -1 })
      .exec();
  }

  async findCheckIns(ownerId: string) {
    const employees = await this.employeesService.findAll(ownerId);
    const empIds = employees.map(e => (e as any)._id);

    return this.attModel
      .find({ checkIn: { $ne: null }, employeeId: { $in: empIds } })
      .populate('employeeId', 'name')
      .sort({ checkIn: -1 })
      .exec();
  }

  async findCheckOuts(ownerId: string) {
    const employees = await this.employeesService.findAll(ownerId);
    const empIds = employees.map(e => (e as any)._id);

    return this.attModel
      .find({ checkOut: { $ne: null }, employeeId: { $in: empIds } })
      .populate('employeeId', 'name')
      .sort({ checkOut: -1 })
      .exec();
  }

  async findByEmployee(employeeId: string, ownerId: string, filter?: { startDate?: string; endDate?: string }) {
    // Check ownership
    await this.employeesService.findOne(employeeId, ownerId);

    const query: any = { employeeId };

    if (filter?.startDate || filter?.endDate) {
      query.date = {};
      if (filter.startDate) query.date.$gte = filter.startDate;
      if (filter.endDate) query.date.$lte = filter.endDate;
    }

    return this.attModel.find(query).sort({ checkIn: -1 }).exec();
  }

  async handleScan(fingerId: number) {
    // 0. Check Mode
    if (this.currentMode === 'IDLE') {
      console.log('Scan ignored: System is IDLE');
      return { success: false, message: 'System is IDLE' };
    }

    // 1. Find employee by fingerId
    const employee = await this.employeesService.findByFingerId(fingerId);
    if (!employee) {
      console.log(`Fingerprint ID ${fingerId} not found`);
      return { success: false, message: 'Fingerprint not found' };
    }

    const now = new Date();
    const timestamp = this.getVNTime(now); // Shift to VN Time
    const today = this.getVNDateString(now);

    // 2. Find latest attendance for today
    const empId = (employee as any)._id; 
    const latest = await this.attModel
      .findOne({
        employeeId: empId,
        date: today,
      })
      .sort({ createdAt: -1 })
      .exec();

    let type = '';

    if (this.currentMode === 'CHECK_IN') {
      if (latest) {
        return {
          success: false,
          message: 'Already checked in today',
          employeeName: employee.name,
        };
      }

      // Create Check-in
      await this.attModel.create({
        employeeId: empId,
        date: today,
        checkIn: timestamp,
        status: 'present',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      type = 'check-in';
    } else if (this.currentMode === 'CHECK_OUT') {
      if (!latest) {
        return {
          success: false,
          message: 'No check-in found for today',
          employeeName: employee.name,
        };
      }
      if (latest.checkOut) {
        return {
          success: false,
          message: 'Already checked out',
          employeeName: employee.name,
        };
      }

      // Update Check-out
      latest.checkOut = timestamp;
      latest.updatedAt = timestamp;
      
      // Calculate work hours
      const checkInTime = new Date(latest.checkIn).getTime();
      const checkOutTime = timestamp.getTime();
      const diffMs = checkOutTime - checkInTime;
      const hours = diffMs / (1000 * 60 * 60); 
      latest.work_hours = parseFloat(hours.toFixed(2));

      await latest.save();
      type = 'check-out';
    }

    // 5. Return info for ws broadcast
    return {
      success: true,
      employeeName: employee.name,
      timestamp,
      type,
    };
  }
  // State to track who is currently enrolling
  private pendingEnrollUserId: string | null = null;
  
  // Encyclopedia (Called by Controller -> Service -> Gateway)
  async startEnroll(userId: string, fingerId: number) {
    this.pendingEnrollUserId = userId;
    console.log(`Starting enrollment for User ${userId} with Finger ID ${fingerId}`);
    
    this.gateway.sendEnrollCmd(fingerId);
    return { success: true, message: 'Enrollment command sent', fingerId };
  }

  async finishEnroll(fingerId: number, success: boolean) {
    if (!this.pendingEnrollUserId) {
      console.warn('Received enroll result but no pending user enrollment found.');
      return;
    }

    if (success) {
      console.log(`Enrollment SUCCESS for User ${this.pendingEnrollUserId}, Finger ID ${fingerId}`);
      await this.employeesService.updateFingerId(this.pendingEnrollUserId, fingerId);
    } else {
      console.log(`Enrollment FAILED for User ${this.pendingEnrollUserId}`);
    }

    // Reset state
    this.pendingEnrollUserId = null;
  }

  // Manual Attendance by Admin (Owner)
  async manualCheckIn(employeeId: string, timestamp: Date, ownerId: string) {
      // Check ownership
      await this.employeesService.findOne(employeeId, ownerId);

      const storedTime = this.getVNTime(timestamp);
      const date = this.getVNDateString(timestamp);
      const nowFn = () => this.getVNTime(new Date());
      
      const existing = await this.attModel.findOne({ employeeId, date }).exec();
      if (existing) {
          throw new Error('Attendance record already exists for this date. Check-out only.');
      }

      await this.attModel.create({
          employeeId,
          date,
          checkIn: storedTime,
          status: 'present (manual)',
          createdAt: nowFn(),
          updatedAt: nowFn(),
      });
      return { success: true, message: 'Manual Check-in Success' };
  }

  async manualCheckOut(employeeId: string, timestamp: Date, ownerId: string) {
      // Check ownership
      await this.employeesService.findOne(employeeId, ownerId);

      const storedTime = this.getVNTime(timestamp);
      const date = this.getVNDateString(timestamp);
      const latest = await this.attModel.findOne({ employeeId, date }).exec();

      if (!latest) {
          throw new Error('No check-in found for this date. Cannot check-out.');
      }

      latest.checkOut = storedTime; // Fix: use storedTime (shifted) instead of raw timestamp
      latest.updatedAt = this.getVNTime(new Date());

       // Calculate work hours
      const checkInTime = new Date(latest.checkIn).getTime();
      const checkOutTime = storedTime.getTime();
      const diffMs = checkOutTime - checkInTime;
      const hours = diffMs / (1000 * 60 * 60); 
      latest.work_hours = parseFloat(hours.toFixed(2));

      await latest.save();
      return { success: true, message: 'Manual Check-out Success' };
  }
}
