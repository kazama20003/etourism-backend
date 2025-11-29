import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { ValidatedUser } from '../auth.service';

export interface JwtPayload {
  email: string;
  sub: string;
  roles: string[]; // 👈 añadir esto
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no está definido');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // 1️⃣ Revisar Authorization Header
          if (req?.headers?.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
              return authHeader.split(' ')[1];
            }
          }

          // 2️⃣ Revisar cookie "token"
          const typedReq = req as Request & {
            cookies?: Record<string, unknown>;
          };
          if (
            typedReq.cookies?.token &&
            typeof typedReq.cookies.token === 'string'
          ) {
            return typedReq.cookies.token;
          }

          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const user = (await this.usersService.findOneById(
      payload.sub,
    )) as ValidatedUser;

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return user;
  }
}
