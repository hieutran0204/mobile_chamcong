import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
