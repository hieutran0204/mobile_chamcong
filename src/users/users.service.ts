import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, Role } from '../auth/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 1. List all Owners
  async findAllOwners() {
    return this.userModel.find({ role: Role.OWNER }).select('-password').exec();
  }

  // 2. Create new Owner
  async createOwner(dto: CreateUserDto) {
    const existing = await this.userModel.findOne({ username: dto.username });
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = new this.userModel({
      ...dto,
      password: hashedPassword,
      role: Role.OWNER, // Force role to OWNER
      isActive: true,
    });

    const saved = await newUser.save();
    const result = saved.toObject();
    delete result.password;
    return result;
  }

  // 3. Find One
  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // 4. Update Owner
  async update(id: string, dto: UpdateUserDto) {
    const updateData: any = { ...dto };
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Role cannot be changed via this API, ensure it stays OWNER if accidentally passed
    delete updateData.role; 

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');
    return updatedUser;
  }

  // 5. Delete Owner (Soft Delete or Hard Delete? Let's do Hard Delete for now as requested "Ngừng cung cấp dịch vụ")
  async remove(id: string) {
    // Optionally: check if user exists first
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }
}
