import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      // IDLE or generic
      // Maybe we want to send cmd_idle if device supports it, but user code didn't show it.
      // User code resets to IDLE after scan or timeout usually, but explicitly setting IDLE might be good?
      // User code has: currentMode = MODE_IDLE in webSocketEvent but only on disconnect or inside handlers.
      // Actually user code doesn't have a 'cmd_idle'.
    }

    return { mode: this.currentMode };
  }

  getMode() {
    return { mode: this.currentMode };
  }

  // Queries
  async create(employeeId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.attModel.create({
      employeeId,
      date: today,
      checkIn: new Date(),
      status: 'present',
    });
  }

  async findAll() {
    return this.attModel.find().populate('employeeId', 'name position').sort({ checkIn: -1 }).exec();
  }

  async findCheckIns() {
    // Return all records that have a checkIn time
    return this.attModel.find({ checkIn: { $ne: null } }).populate('employeeId', 'name position').sort({ checkIn: -1 }).exec();
  }

  async findCheckOuts() {
    // Return all records that have a checkOut time
    return this.attModel.find({ checkOut: { $ne: null } }).populate('employeeId', 'name position').sort({ checkOut: -1 }).exec();
  }

  async findByEmployee(employeeId: string) {
    return this.attModel.find({ employeeId }).sort({ checkIn: -1 }).exec();
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

    const today = new Date().toISOString().slice(0, 10);
    const timestamp = new Date();
    
    // 2. Find latest attendance for today
    const latest = await this.attModel.findOne({
      employeeId: employee._id,
      date: today,
    }).sort({ createdAt: -1 }).exec();

    let type = '';

    if (this.currentMode === 'CHECK_IN') {
      if (latest) {
        return { success: false, message: 'Already checked in today', employeeName: employee.name };
      }
      
      // Create Check-in
      await this.attModel.create({
        employeeId: employee._id,
        date: today,
        checkIn: timestamp,
        status: 'present',
      });
      type = 'check-in';

    } else if (this.currentMode === 'CHECK_OUT') {
      if (!latest) {
        return { success: false, message: 'No check-in found for today', employeeName: employee.name };
      }
      if (latest.checkOut) {
        return { success: false, message: 'Already checked out', employeeName: employee.name };
      }

      // Update Check-out
      latest.checkOut = timestamp;
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
}
