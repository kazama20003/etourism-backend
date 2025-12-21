import { Injectable, UnauthorizedException } from '@nestjs/common';
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
          // 1️⃣ Authorization: Bearer <token>
          if (req?.headers?.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
              return authHeader.split(' ')[1];
            }
          }

          // 2️⃣ Cookie "token"
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

  // ✔️ VALIDACIÓN LIMPIA Y CORRECTA
  async validate(payload: JwtPayload) {
    // Verificar existencia del usuario
    const user = await this.usersService.findOneById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // ✔️ Retornar SOLO un objeto plano
    return {
      _id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
