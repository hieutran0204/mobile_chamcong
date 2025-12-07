import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from './employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { User, UserDocument, Role } from '../auth/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private empModel: Model<EmployeeDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateEmployeeDto) {
    console.log('Creating employee with data:', JSON.stringify(dto));
    try {
      const doc: any = {
        name: dto.name,
        position: dto.position,
      };
      if (dto.fingerId !== undefined && dto.fingerId !== null) {
        doc.fingerId = dto.fingerId;
      }

      // 1. Create Employee
      const emp = await this.empModel.create(doc);

      return emp.toObject();
    } catch (e) {
      console.error('ERROR creating employee:', e);
      throw e;
    }
  }

  async findAll() {
    return this.empModel.find().select('-__v').lean().exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const e = await this.empModel.findById(id).select('-__v').lean().exec();
    if (!e) throw new NotFoundException();
    return e;
  }

  async update(id: string, data: Partial<CreateEmployeeDto>) {
    const e = await this.empModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-__v')
      .lean()
      .exec();
    if (!e) throw new NotFoundException();
    return e;
  }

  async remove(id: string) {
    const emp = await this.empModel.findById(id);
    if (!emp) throw new NotFoundException();

    // delete linked user
    await this.userModel.deleteMany({ employeeId: emp._id });
    
    // delete employee
    await this.empModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async findByFingerId(fingerId: number) {
    return this.empModel.findOne({ fingerId }).lean().exec();
  }

  async assignFingerId(id: string) {
    // find max fingerId
    const highest = await this.empModel.findOne().sort({ fingerId: -1 }).exec();
    const nextId = (highest && highest.fingerId ? highest.fingerId : 0) + 1;

    // update employee
    return this.update(id, { fingerId: nextId });
  }

  async getNextFingerId(): Promise<number> {
    const highest = await this.empModel.findOne().sort({ fingerId: -1 }).exec();
    return (highest && highest.fingerId ? highest.fingerId : 0) + 1;
  }
}
