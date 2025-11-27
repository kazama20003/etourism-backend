import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';
import { AuthProvider } from 'src/users/enums/auth-provider.enum';

interface GoogleProfile {
  id: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: [{ value: string; verified: boolean }];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    // ⚠️ OJO: NO USAMOS this.configService ANTES DE SUPER()

    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new InternalServerErrorException(
        'Google OAuth credentials not configured in environment variables.',
      );
    }

    // ✔ AHORA YA PODEMOS LLAMAR A super()
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails } = profile;

    const email = emails?.[0]?.value;

    if (!email || !name.givenName) {
      return done(
        new Error(
          'Google profile missing critical information (email or name).',
        ),
      );
    }

    const userProfile = {
      externalId: id,
      email: email,
      firstName: name.givenName,
      lastName: name.familyName,
    };

    const user = await this.authService.validateOrCreateExternalUser(
      userProfile,
      AuthProvider.GOOGLE,
    );

    done(null, user);
  }
}
