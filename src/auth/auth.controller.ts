import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, ValidatedUser } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDocument } from 'src/users/entities/user.entity';
import type { Response } from 'express';
import { SameUserGuard } from './guards/same-user.guard';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

// ----------------------------------------------------
// OAuth Guards
// ----------------------------------------------------
class GoogleAuthGuard extends AuthGuard('google') {}
class FacebookAuthGuard extends AuthGuard('facebook') {}

// ----------------------------------------------------
// Cookie options (ÚNICA FUENTE DE VERDAD)
// ----------------------------------------------------
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // 🔴 true en producción con HTTPS
  sameSite: 'lax' as const,
  path: '/', // 🔴 CLAVE PARA LOGOUT
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // ----------------------------------------------------
  // REGISTER
  // ----------------------------------------------------
  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (await this.usersService.create(
      createUserDto,
    )) as UserDocument;

    const loginResult = this.authService.login(user);

    res.cookie('token', loginResult.access_token, COOKIE_OPTIONS);

    return loginResult;
  }

  // ----------------------------------------------------
  // LOGIN LOCAL
  // ----------------------------------------------------
  @UseGuards(LocalAuthGuard)
  @Post('login/local')
  login(
    @Request() req: { user: ValidatedUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(req.user);

    res.cookie('token', loginResult.access_token, COOKIE_OPTIONS);

    return loginResult;
  }

  // ----------------------------------------------------
  // LOGOUT (FUNCIONA 100%)
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/', // 🔴 MISMO PATH
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  // ----------------------------------------------------
  // PROFILE
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: ValidatedUser }) {
    return req.user;
  }

  // ----------------------------------------------------
  // GOOGLE OAUTH
  // ----------------------------------------------------
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(
    @Request() req: { user: UserDocument },
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(req.user);

    res.clearCookie('token', { path: '/' });
    res.cookie('token', loginResult.access_token, COOKIE_OPTIONS);

    return res.redirect('https://tourism-frontend-beta.vercel.app/es/login');
  }

  // ----------------------------------------------------
  // FACEBOOK OAUTH
  // ----------------------------------------------------
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookAuth() {}

  @Get('facebook/redirect')
  @UseGuards(FacebookAuthGuard)
  facebookAuthRedirect(
    @Request() req: { user: UserDocument },
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(req.user);

    res.clearCookie('token', { path: '/' });
    res.cookie('token', loginResult.access_token, COOKIE_OPTIONS);

    return res.redirect('https://tourism-frontend-beta.vercel.app/es/login');
  }

  // ----------------------------------------------------
  // UPDATE USER (SOLO MISMO USUARIO)
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard, SameUserGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
