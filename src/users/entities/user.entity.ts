import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enums/user-roles.enum';
import { AuthProvider } from '../enums/auth-provider.enum';

export type UserDocument = User & Document;
const SALT_ROUNDS = 10;

@Schema({ timestamps: true })
export class User {
  // --- Autenticación y Perfil ---

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ select: false })
  passwordHash?: string;

  // Campo virtual (no va a la BD)
  public password!: string;

  @Prop({
    type: String,
    enum: AuthProvider,
    required: true,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Prop({ unique: true, sparse: true })
  externalId?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName: string;

  // --- Roles y Estado ---

  @Prop({
    type: [String],
    enum: UserRole,
    default: [UserRole.CLIENT],
  })
  roles: UserRole[];

  @Prop({ default: true })
  isActive: boolean;

  // --- Información opcional ---

  @Prop()
  country?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  documentType?: string;

  @Prop({ unique: true, sparse: true })
  documentNumber?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual Setter
UserSchema.virtual('password').set(function (
  this: UserDocument,
  password: string,
) {
  this.passwordHash = password;
});

// Middleware para hash automático
UserSchema.pre('save', async function (this: UserDocument, next) {
  if (
    this.authProvider === AuthProvider.LOCAL &&
    this.passwordHash &&
    this.isModified('passwordHash')
  ) {
    if (this.passwordHash.startsWith('$2b$')) {
      return next();
    }

    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Método para verificar contraseña
UserSchema.methods.checkPassword = function (
  this: UserDocument,
  password: string,
): Promise<boolean> {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

// Índices útiles
UserSchema.index({ firstName: 1, lastName: 1 });
// ❌ Se eliminó el índice duplicado documentNumber
