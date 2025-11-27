import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  MinLength,
  IsArray,
  IsEnum,
} from 'class-validator';
import { AuthProvider } from '../enums/auth-provider.enum';
import { UserRole } from '../enums/user-roles.enum';

/**
 * Data Transfer Object para la creación de un nuevo usuario.
 * Está diseñado para ser usado tanto en registro LOCAL (email/password) como en OAuth (Google/Facebook).
 */
export class CreateUserDto {
  // --- Campos Requeridos por el Esquema (Comunes) ---

  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;

  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  firstName: string;

  @IsString({ message: 'El apellido debe ser un texto.' })
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  lastName: string;

  // --- Proveedor de Autenticación (Define la lógica de validación) ---

  @IsEnum(AuthProvider, {
    message: 'El proveedor de autenticación no es válido.',
  })
  authProvider: AuthProvider;

  // --- Campos Condicionales de Autenticación ---

  // 1. Contraseña (Requerida SOLO si el proveedor es LOCAL)
  // CORRECCIÓN: Tipado explícito de 'o'
  @ValidateIf((o: CreateUserDto) => o.authProvider === AuthProvider.LOCAL)
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password?: string; // Nota: Aquí usamos 'password', no 'passwordHash'

  // 2. ID Externa (Requerida SOLO si el proveedor NO es LOCAL)
  // CORRECCIÓN: Tipado explícito de 'o'
  @ValidateIf((o: CreateUserDto) => o.authProvider !== AuthProvider.LOCAL)
  @IsString({ message: 'El ID externo debe ser un texto.' })
  @IsNotEmpty({
    message: 'El ID externo es obligatorio para proveedores externos.',
  })
  externalId?: string;

  // --- Roles (Opcional, solo usado por Administradores) ---

  @IsOptional()
  @IsArray({ message: 'Los roles deben ser una lista (array).' })
  @IsEnum(UserRole, { each: true, message: 'Uno o más roles no son válidos.' })
  roles?: UserRole[];

  // --- Información de Contacto/Ubicación/Documento (Opcionales) ---

  @IsOptional()
  @IsString({ message: 'El país debe ser un texto.' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto.' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto.' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser un texto.' })
  documentType?: string;

  @IsOptional()
  @IsString({ message: 'El número de documento debe ser un texto.' })
  documentNumber?: string;
}
