import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { ValidatedUser } from '../auth.service';

// Payload decodificado del JWT
export interface JwtPayload {
  email: string;
  sub: string; // ID del usuario (ObjectId como string)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    // 🚨 PROBLEMA POTENCIAL AQUÍ: Asegúrate de que process.env.JWT_SECRET es correcto
    const secretKey =
      process.env.JWT_SECRET || 'fallback-secret-development-key';

    // Log para verificar la clave secreta (NO HACER ESTO EN PRODUCCIÓN)
    console.log(`[JWT-STRATEGY] Clave secreta configurada: ${secretKey}`);

    super({
      // Extrae el token del encabezado Authorization: Bearer
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Ignorar la verificación de expiración si no quieres manejar la expiración (No recomendado)
      ignoreExpiration: false,
      // Clave secreta para verificar la firma del token
      secretOrKey: secretKey,
    });
  }

  /**
   * Método de validación llamado por Passport después de verificar la firma del JWT.
   * Si la verificación de la firma falla (p. ej., clave secreta incorrecta), este método NO SE EJECUTA.
   * Si la expiración falla, tampoco se ejecuta (si ignoreExpiration es false).
   */
  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    // Log para confirmar que la firma fue exitosa y se decodificó el payload
    console.log(
      `[JWT-STRATEGY] Token Decodificado. Sub (ID): ${payload.sub}, Email: ${payload.email}`,
    );

    // 1. Buscar al usuario usando el ID (sub) del token
    const user = (await this.usersService.findOneById(
      payload.sub,
    )) as ValidatedUser;

    // 2. Verificar si el usuario existe y está activo
    if (!user || !user.isActive) {
      // Log de falla si el usuario no se encuentra en la DB
      console.log(
        `[JWT-STRATEGY] ERROR: Usuario con ID ${payload.sub} no encontrado o inactivo.`,
      );
      throw new UnauthorizedException();
    }

    // Log de éxito si el usuario fue encontrado
    console.log(
      `[JWT-STRATEGY] ÉXITO: Usuario ID ${user._id.toString()} validado y activo.`,
    );

    // 3. Devuelve el objeto de usuario, que se adjunta a req.user
    return user;
  }
}
