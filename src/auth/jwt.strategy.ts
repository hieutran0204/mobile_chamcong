import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';
dotenv.config();

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  employeeId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  // Bỏ async nếu không có await
  validate(payload: JwtPayload): {
    userId: string;
    username: string;
    role: string;
    employeeId?: string;
  } {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      employeeId: payload.employeeId,
    };
  }
}
