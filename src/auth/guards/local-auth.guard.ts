import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que aplica la estrategia 'local'.
 * Es una clase simple que extiende AuthGuard para poder inyectarla.
 * Se usa en el endpoint POST /auth/login/local.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
