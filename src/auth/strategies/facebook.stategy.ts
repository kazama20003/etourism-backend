import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from 'src/users/enums/auth-provider.enum';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const appID = configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = configService.get<string>('FACEBOOK_APP_SECRET');
    const callbackURL = configService.get<string>('FACEBOOK_CALLBACK_URL');

    if (!appID || !appSecret || !callbackURL) {
      throw new InternalServerErrorException(
        'Facebook OAuth credentials not configured in environment variables.',
      );
    }

    super({
      clientID: appID,
      clientSecret: appSecret,
      callbackURL,
      profileFields: ['id', 'emails', 'name'],
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName || 'Unknown';
    const lastName = profile.name?.familyName || 'Unknown';

    if (!email || !firstName) {
      return done(new Error('Facebook profile missing email or name.'));
    }

    const userProfile = {
      externalId: profile.id,
      email,
      firstName,
      lastName,
    };

    const user = await this.authService.validateOrCreateExternalUser(
      userProfile,
      AuthProvider.FACEBOOK,
    );

    done(null, user);
  }
}
