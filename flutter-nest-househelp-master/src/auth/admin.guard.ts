import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context?: ExecutionContext) {
    // First handle JWT authentication
    const authenticatedUser = super.handleRequest(
      err,
      user,
      info,
      context || ({} as ExecutionContext),
    );

    if (!authenticatedUser) {
      throw new ForbiddenException('User not authenticated');
    }

    if (authenticatedUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return authenticatedUser;
  }
}
