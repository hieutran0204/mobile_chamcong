import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from './user.schema';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwt: JwtService,
    private employeesService: EmployeesService,
  ) {}

  async registerSelf(username: string, password: string, name: string, position: string) {
    // 0. Check if username exists
    const existing = await this.userModel.findOne({ username });
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    // 1. Create Employee Profile
    const emp = await this.employeesService.create({ name, position });
    
    // 2. Create User Account
    const hashed = await bcrypt.hash(password, 10);
    const u = await this.userModel.create({
      username,
      password: hashed,
      role: Role.EMPLOYEE,
      employeeId: emp._id, // Link to the new employee
    });

    const out = u.toObject();
    delete out.password;
    return out;
  }

  async registerOwner(username: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const u = await this.userModel.create({
      username,
      password: hashed,
      role: Role.OWNER,
    });
    const out = u.toObject();
    delete out.password;
    return out;
  }

  async registerEmployee(username: string, password: string, employeeId: string) {
    const hashed = await bcrypt.hash(password, 10);
    const u = await this.userModel.create({
      username,
      password: hashed,
      role: Role.EMPLOYEE,
      employeeId: new Types.ObjectId(employeeId),
    });
    const out = u.toObject();
    delete out.password;
    return out;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user || !user.password) return null;

    const match = await bcrypt.compare(password, user.password);
    return match ? user : null;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
    };

    return { access_token: this.jwt.sign(payload) };
  }
}
