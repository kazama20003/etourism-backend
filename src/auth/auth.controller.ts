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
import type { Response, CookieOptions } from 'express'; // ← IMPORT CORRECTO
import { SameUserGuard } from './guards/same-user.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';

// ----------------------------------------------------
// COOKIE OPTIONS CORRECTAMENTE TIPADAS
// ----------------------------------------------------
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  domain: '.tawantinsuyoperu.com',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

// OAuth Guards
class GoogleAuthGuard extends AuthGuard('google') {}
class FacebookAuthGuard extends AuthGuard('facebook') {}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // REGISTER
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

  // LOGIN LOCAL
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

  // LOGOUT
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', COOKIE_OPTIONS);

    return { message: 'Sesión cerrada correctamente' };
  }

  // PROFILE
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: ValidatedUser }) {
    return req.user;
  }

  // GOOGLE LOGIN
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

    res.clearCookie('token', COOKIE_OPTIONS);
    res.cookie('token', loginResult.access_token, COOKIE_OPTIONS);

    return res.redirect('https://tawantinsuyoperu.com/login');
  }

  // FACEBOOK LOGIN
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

    res.clearCookie('token', COOKIE_OPTIONS);
    res.cookie('token', loginResult.access_token, COOKIE_OPTIONS);

    return res.redirect('https://tawantinsuyoperu.com/login');
  }

  // UPDATE USER
  @UseGuards(JwtAuthGuard, SameUserGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
