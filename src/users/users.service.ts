import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    // Inyección del modelo de Mongoose
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Crea un nuevo usuario basado en el DTO.
   * El hashing de la contraseña se maneja automáticamente en el hook 'pre-save' del esquema.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    // Nota: El DTO 'password' se mapea a 'passwordHash' en el modelo
    return createdUser.save();
  }

  /**
   * Obtiene todos los usuarios.
   */
  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Listado de usuarios obtenido correctamente',
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: users,
    };
  }

  /**
   * Obtiene un usuario por ID de Mongoose (Usado en el JwtStrategy).
   */
  /**
   * Obtiene un usuario por ID de Mongoose (usado en JwtStrategy).
   */
  async findOneById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    return user; // 🔥 ahora es UserDocument real
  }

  /**
   * Obtiene un usuario por email (CRUCIAL para el login).
   * Necesita el passwordHash, por lo que usamos .select('+passwordHash').
   */
  async findOneByEmail(email: string): Promise<UserDocument> {
    // Mongoose por defecto excluye 'passwordHash', lo forzamos a incluirlo (+)
    return this.userModel
      .findOne({ email })
      .select('+passwordHash')
      .exec() as Promise<UserDocument>;
  }

  /**
   * Actualiza un usuario existente por ID.
   * La validación del DTO previene que se envíen campos no deseados.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Mongoose pre('save') hook se activará si se modifica 'passwordHash' en el DTO
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true }) // new: true retorna el documento actualizado
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(
        `Usuario con ID "${id}" no encontrado para actualizar.`,
      );
    }
    return updatedUser;
  }

  /**
   * Elimina un usuario por ID.
   */
  async remove(id: string): Promise<any> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Usuario con ID "${id}" no encontrado para eliminar.`,
      );
    }
    return { message: 'Usuario eliminado exitosamente' };
  }
}
