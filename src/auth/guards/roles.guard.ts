import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-roles.enum';
import { ValidatedUser } from '../auth.service'; // Usa tu tipo real de usuario del JWT

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Roles requeridos
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // acceso libre
    }

    // Tipar correctamente request
    const request = context.switchToHttp().getRequest<{
      user?: ValidatedUser;
    }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!Array.isArray(user.roles)) {
      throw new ForbiddenException('User has no roles');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
