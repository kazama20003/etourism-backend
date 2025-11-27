import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, ValidatedUser } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// Importamos el tipo de Mongoose para tipar req.user en OAuth
import { UserDocument } from 'src/users/entities/user.entity';

// ----------------------------------------------------
// OAuth Guards (Extienden AuthGuard con el nombre de la estrategia)
// ----------------------------------------------------
class GoogleAuthGuard extends AuthGuard('google') {}
class FacebookAuthGuard extends AuthGuard('facebook') {}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  /**
   * Endpoint para el registro de nuevos usuarios locales.
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // FIX 1: Se añade la aserción de tipo 'as UserDocument'
    const user = (await this.usersService.create(
      createUserDto,
    )) as UserDocument;
    return this.authService.login(user);
  }

  /**
   * Endpoint para el login local (email/password).
   */
  @UseGuards(LocalAuthGuard)
  @Post('login/local')
  login(@Request() req: { user: ValidatedUser }) {
    // AGREGAMOS LOG y CORREGIMOS el error de ESLint:
    // Se usa .toString() para asegurar que req.user._id (que es ObjectId | string) sea un string primitivo.
    console.log(
      `[AUTH-CONTROLLER] Intento de login exitoso para el usuario ID: ${req.user._id.toString()}`,
    );

    // req.user contiene el usuario validado (ValidatedUser) por LocalStrategy
    return this.authService.login(req.user);
  }

  /**
   * Endpoint de prueba para una ruta protegida (requiere JWT válido).
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: ValidatedUser }) {
    // req.user contiene el perfil completo gracias a JwtStrategy (ValidatedUser)
    return req.user;
  }

  // ----------------------------------------------------
  // Endpoints OAuth (Google)
  // ----------------------------------------------------

  /**
   * 1. Inicia el flujo de autenticación de Google.
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport inicia el flujo de redirección.
  }

  /**
   * 2. Callback de Google después de la autenticación exitosa.
   */
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Request() req: { user: UserDocument }) {
    // req.user es llenado por GoogleStrategy (contiene el UserDocument de Mongoose)
    return this.authService.login(req.user);
  }

  // ----------------------------------------------------
  // Endpoints OAuth (Facebook)
  // ----------------------------------------------------

  /**
   * 1. Inicia el flujo de autenticación de Facebook.
   */
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookAuth() {
    // Passport inicia el flujo.
  }

  /**
   * 2. Callback de Facebook después de la autenticación exitosa.
   */
  @Get('facebook/redirect')
  @UseGuards(FacebookAuthGuard)
  facebookAuthRedirect(@Request() req: { user: UserDocument }) {
    // req.user es llenado por FacebookStrategy
    return this.authService.login(req.user);
  }
}
