import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UsersService } from '../users/users.service';
// Asume que esta es la ruta correcta a tu entidad/esquema
import { User, UserDocument } from 'src/users/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuthProvider } from '../users/enums/auth-provider.enum';
import { UserRole } from '../users/enums/user-roles.enum';

// ✅ TIPO 1: Usuario validado (sin passwordHash) y con _id explícito
export type ValidatedUser = Omit<User, 'passwordHash'> & {
  _id: Types.ObjectId | string;
};

// ✅ TIPO 2: Interfaz auxiliar para que TS reconozca métodos (como checkPassword)
interface UserWithMethods extends UserDocument {
  // La implementación de este método está en el esquema/entidad del usuario.
  checkPassword(password: string): Promise<boolean>;
}

// 📌 TIPO 3: Tipo para el objeto plano retornado por user.toObject() antes de filtrar
type UserObjectWithHash = ValidatedUser & {
  passwordHash?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Valida credenciales.
   * 🚨 Si falla aquí con 401, la causa está en user.checkPassword.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<ValidatedUser | null> {
    // AGREGAMOS LOG 1: Verificar el email que se intenta validar
    console.log(
      `[AUTH-SERVICE] Intentando validar usuario con email: ${email}`,
    );

    // 1. El usuario se busca con el passwordHash incluido (gracias a UsersService)
    const user = (await this.usersService.findOneByEmail(
      email,
    )) as UserWithMethods;

    // AGREGAMOS LOG 2: Verificar si el usuario fue encontrado y si está activo
    if (!user) {
      console.log(
        `[AUTH-SERVICE] ERROR: Usuario no encontrado con email: ${email}`,
      );
      return null;
    }

    if (!user.isActive) {
      console.log(
        `[AUTH-SERVICE] ERROR: Usuario encontrado (${email}), pero no está activo.`,
      );
      return null;
    }

    // 2. Aquí se llama al método que compara el hash.
    const isMatch = await user.checkPassword(pass);

    // AGREGAMOS LOG 3: Resultado de la comparación de contraseñas
    if (isMatch) {
      console.log(
        `[AUTH-SERVICE] ÉXITO: Contraseña coincidente para: ${email}`,
      );
      const userObj = user.toObject() as UserObjectWithHash;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = userObj;

      return result as ValidatedUser;
    } else {
      console.log(
        `[AUTH-SERVICE] ERROR: Contraseña NO coincidente para: ${email}.`,
      );
    }

    return null;
  }

  /**
   * Genera el JWT.
   * Acepta UserDocument o el objeto plano ValidatedUser.
   */
  login(user: UserDocument | ValidatedUser) {
    // Extracción segura del ID (ambos tipos contienen _id)
    const id = user._id.toString();

    const payload: JwtPayload = { email: user.email, sub: id };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: id,
        email: user.email,
        roles: user.roles,
        firstName: user.firstName,
      },
    };
  }

  /**
   * Lógica para Google/Facebook OAuth.
   */
  async validateOrCreateExternalUser(
    profile: {
      externalId: string;
      email: string;
      firstName: string;
      lastName: string;
    },
    provider: AuthProvider,
  ): Promise<UserDocument> {
    const userByExternalId = await this.userModel
      .findOne({ externalId: profile.externalId })
      .exec();
    if (userByExternalId) return userByExternalId;

    const userByEmail = await this.userModel
      .findOne({ email: profile.email })
      .exec();

    if (userByEmail) {
      if (!userByEmail.externalId) {
        userByEmail.externalId = profile.externalId;
        userByEmail.authProvider = provider;
        await userByEmail.save();
      }
      return userByEmail;
    }

    const newUser = new this.userModel({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      externalId: profile.externalId,
      authProvider: provider,
      roles: [UserRole.CLIENT],
    });

    return newUser.save();
  }
}
