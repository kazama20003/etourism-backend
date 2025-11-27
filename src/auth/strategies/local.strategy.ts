import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

// Importamos el servicio y el tipo ValidatedUser
import { AuthService, ValidatedUser } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Método que intenta validar el email y la contraseña.
   * Retorna ValidatedUser en lugar de any.
   */
  async validate(email: string, password: string): Promise<ValidatedUser> {
    // Al estar tipado en el servicio, 'user' ahora es ValidatedUser | null
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Retornamos el usuario validado sin problemas de tipo
    return user;
  }
}
