// src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export interface JwtUser {
  sub: string;
  email?: string;
  role?: string;
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtUser | null>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    // 👇 Marcar parámetros como usados para ESLint
    void info;
    void context;
    void status;

    if (err || !user) {
      return null as TUser;
    }

    return user as TUser;
  }
}
