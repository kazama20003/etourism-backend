import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

export interface JwtPayload {
  email: string;
  sub: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está definido');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // 1) Authorization header
          if (req?.headers?.authorization) {
            const header = req.headers.authorization;
            if (header.startsWith('Bearer ')) {
              return header.split(' ')[1];
            }
          }

          // 2) Cookie
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

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOneById(payload.sub);

    return {
      _id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      authProvider: user.authProvider ?? 'LOCAL',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      createdAt: user.createdAt ?? new Date().toISOString(),
    };
  }
}
