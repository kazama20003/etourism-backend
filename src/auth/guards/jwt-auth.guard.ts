import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que aplica la estrategia 'jwt'.
 * Se usa para proteger rutas, asegurando que el usuario tenga un token válido.
 * Ejemplo de uso: @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
