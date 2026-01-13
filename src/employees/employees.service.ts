import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEmployeeDto } from './dto/create-employee.dto';
// Valid Import
import { Employee, EmployeeDocument } from './employee.schema';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, ownerId: string): Promise<Employee> {
    // Check if code exists
    if (createEmployeeDto.employeeCode) {
        const existing = await this.employeeModel.findOne({ employeeCode: createEmployeeDto.employeeCode, ownerId });
        if (existing) throw new Error('Employee Code already exists');
    }

    const newEmployee = new this.employeeModel({
      ...createEmployeeDto,
      ownerId,
      isActive: true,
      hourly_rate: createEmployeeDto.hourly_rate || 0,
    });
    return newEmployee.save();
  }

  async findAll(ownerId: string): Promise<Employee[]> {
    return this.employeeModel.find({ ownerId }).exec();
  }

  async findOne(id: string, ownerId: string): Promise<Employee | null> {
    const employee = await this.employeeModel.findOne({ _id: id, ownerId }).exec();
    if (!employee) throw new NotFoundException('Employee not found or access denied');
    return employee;
  }

  // Update employee info
  async update(id: string, updateDto: any, ownerId: string): Promise<Employee> {
    const e = await this.employeeModel
      .findOneAndUpdate({ _id: id, ownerId }, updateDto, { new: true })
      .exec();
    if (!e) throw new NotFoundException('Employee not found or access denied');
    return e;
  }

  // Special update for fingerprint (internal use)
  async updateFingerId(id: string, fingerId: number): Promise<Employee | null> {
    return this.employeeModel.findByIdAndUpdate(id, { fingerId }, { new: true }).exec();
  }

  async remove(id: string, ownerId: string): Promise<Employee | null> {
    const deleted = await this.employeeModel.findOneAndDelete({ _id: id, ownerId }).exec();
    if (!deleted) throw new NotFoundException('Employee not found or access denied');
    return deleted;
  }
  
  // Helper to find next available ID for device Sync
  async getNextFingerId(): Promise<number> {
    const highest = await this.employeeModel.findOne().sort('-fingerId').exec();
    return highest ? (highest.fingerId || 0) + 1 : 1;
  }

  async getEmptyFingerId(id: string): Promise<Employee | null> {
     const nextId = await this.getNextFingerId();
     return this.employeeModel.findByIdAndUpdate(id, { fingerId: nextId }, { new: true });
  }

  async findByFingerId(fingerId: number): Promise<Employee | null> {
      return this.employeeModel.findOne({ fingerId }).exec();
  }

  // Deactivate/Activate
  async deactivate(id: string, ownerId: string): Promise<Employee | null> {
    const e = await this.employeeModel.findOneAndUpdate({ _id: id, ownerId }, { isActive: false }, { new: true }).exec();
    if (!e) throw new NotFoundException('Employee not found or access denied');
    return e;
  }

  async activate(id: string, ownerId: string): Promise<Employee | null> {
    const e = await this.employeeModel.findOneAndUpdate({ _id: id, ownerId }, { isActive: true }, { new: true }).exec();
    if (!e) throw new NotFoundException('Employee not found or access denied');
    return e;
  }
}
