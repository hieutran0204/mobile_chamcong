import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>('roles', ctx.getHandler());
    if (!required) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user as { role?: string } | undefined;
    if (!user) return false;
    return required.includes(user.role || '');
  }
}
