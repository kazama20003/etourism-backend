import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, ValidatedUser } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// Importamos el tipo de Mongoose para tipar req.user en OAuth
import { UserDocument } from 'src/users/entities/user.entity';
import type { Response } from 'express';

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
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (await this.usersService.create(
      createUserDto,
    )) as UserDocument;

    const loginResult = this.authService.login(user);

    res.cookie('token', loginResult.access_token, {
      httpOnly: true,
      secure: false, // en producción: true con HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    });

    return loginResult;
  }

  /**
   * Endpoint para el login local (email/password).
   */
  @UseGuards(LocalAuthGuard)
  @Post('login/local')
  login(
    @Request() req: { user: ValidatedUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(req.user);

    res.cookie('token', loginResult.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return loginResult;
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
  googleAuthRedirect(
    @Request() req: { user: UserDocument },
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(req.user);

    // Limpia cookies viejas antes de establecer la nueva
    res.clearCookie('token');

    res.cookie('token', loginResult.access_token, {
      httpOnly: true,
      secure: false, // en producción: true con HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.redirect('http://localhost:3000/login');
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
  facebookAuthRedirect(
    @Request() req: { user: UserDocument },
    @Res({ passthrough: true }) res: Response, // <--- agregado
  ) {
    const loginResult = this.authService.login(req.user);

    // Limpiamos cookies antiguas si existieran
    res.clearCookie('token');

    // Guardamos JWT en HttpOnly cookie
    res.cookie('token', loginResult.access_token, {
      httpOnly: true,
      secure: false, // en producción: true con HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    });

    // Redirigimos al frontend (opcional)
    return res.redirect('http://localhost:3000/login');
  }
}
