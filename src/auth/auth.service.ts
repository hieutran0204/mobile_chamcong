import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from './user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwt: JwtService,
  ) {}

  async registerOwner(username: string, password: string, name: string) {
    // Check if username exists
    const existing = await this.userModel.findOne({ username });
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const u = await this.userModel.create({
      username,
      password: hashed,
      role: Role.OWNER,
      name,
    });
    const out = u.toObject();
    delete out.password;
    return out;
  }

  // Admin registration (optional, can be seeded or specific route)
  async registerAdmin(username: string, password: string, name: string) {
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new BadRequestException('Username exists');

    const hashed = await bcrypt.hash(password, 10);
    const u = await this.userModel.create({
      username,
      password: hashed,
      role: Role.ADMIN,
      name,
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
    };

    return {
      access_token: this.jwt.sign(payload),
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
        email: user.email,
      },
    };
  }
}
