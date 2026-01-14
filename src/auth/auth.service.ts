import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from './user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwt: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async registerOwner(username: string, password: string, name: string, email?: string) {
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
      email,
    });
    const out = u.toObject();
    delete out.password;
    return out;
  }

  // Admin registration (optional, can be seeded or specific route)
  async registerAdmin(username: string, password: string, name: string, email?: string) {
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new BadRequestException('Username exists');

    const hashed = await bcrypt.hash(password, 10);
    const u = await this.userModel.create({
      username,
      password: hashed,
      role: Role.ADMIN,
      name,
      email,
    });
    const out = u.toObject();
    delete out.password;
    return out;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username }).select('+password').exec();
    if (!user || !user.password) return null;

    const match = await bcrypt.compare(password, user.password);
    return match ? user : null;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 2FA Check
    if (user.isTwoFactorEnabled) {
      // 1. Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 5); // 5 mins

      // 2. Save to DB
      user.otp = otp;
      user.otpExpires = expires;
      await user.save();

      // 3. Send Email (Non-blocking)
      const email = user.email;
      if (email) {
          this.mailerService.sendMail({
              to: email,
              subject: 'Login OTP Code - Cham Cong App',
              html: `<p>Your OTP code is: <b>${otp}</b></p><p>Valid for 5 minutes.</p>`
          }).then(() => {
              console.log(`OTP sent to ${email}`);
          }).catch(e => {
              console.error('Send mail failed:', e);
          });
      } else {
        console.warn(`User ${username} has 2FA enabled but no email!`);
      }

      return {
          requires2FA: true,
          message: 'OTP sent to email',
          email: user.email // Hint for frontend
      };
    }

    // No 2FA -> Issue Token directly
    return this.generateToken(user);
  }

  async verify2FA(username: string, otp: string) {
      const user = await this.userModel.findOne({ username }).select('+otp +otpExpires +role +name +username +email +companyName').exec();
      if (!user) throw new UnauthorizedException('User not found');

      if (!user.otp || !user.otpExpires) {
          throw new UnauthorizedException('No OTP request found. Please login again.');
      }

      if (new Date() > user.otpExpires) {
          throw new UnauthorizedException('OTP Expired');
      }

      if (user.otp !== otp) {
          throw new UnauthorizedException('Invalid OTP');
      }

      // Valid -> Clear OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      return this.generateToken(user);
  }


  async enable2FA(userId: string, enable: boolean) {
      await this.userModel.findByIdAndUpdate(userId, { isTwoFactorEnabled: enable });
      return { success: true, isTwoFactorEnabled: enable };
  }

  private generateToken(user: any) {
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
        isTwoFactorEnabled: user.isTwoFactorEnabled, // Inform frontend
      },
    };
  }
}
