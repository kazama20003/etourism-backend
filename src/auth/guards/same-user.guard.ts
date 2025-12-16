import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { ValidatedUser } from '../auth.service';

interface RequestWithUser extends Request {
  user: ValidatedUser;
}

@Injectable()
export class SameUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userIdFromJwt = request.user?._id;
    const userIdFromParams = request.params?.id;

    if (!userIdFromJwt || !userIdFromParams) {
      return false;
    }

    // Comparación segura ObjectId ↔ string
    return new Types.ObjectId(userIdFromJwt).equals(userIdFromParams);
  }
}
