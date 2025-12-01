// src/vehicle/vehicle.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleDocument } from './entities/vehicle.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
  ) {}

  // Crear vehículo
  async create(createVehicleDto: CreateVehicleDto) {
    const vehicle = await this.vehicleModel.create(createVehicleDto);
    return vehicle;
  }

  // Listar con paginación
  async findAll(paginationDto: PaginationDto) {
    const { page = '1', limit = '10' } = paginationDto;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [items, total] = await Promise.all([
      this.vehicleModel.find().skip(skip).limit(limitNumber).lean(),
      this.vehicleModel.countDocuments(),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber) || 1,
      },
    };
  }

  // Obtener un vehículo por ID
  async findOne(id: string) {
    const vehicle = await this.vehicleModel.findById(id);

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    return vehicle;
  }

  // Actualizar vehículo
  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const updated = await this.vehicleModel.findByIdAndUpdate(
      id,
      updateVehicleDto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    return updated;
  }

  // Eliminar vehículo
  // Puedes hacer soft delete (isActive: false) o hard delete. Te dejo soft delete:
  async remove(id: string) {
    const deleted = await this.vehicleModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!deleted) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }

    return deleted;
  }
}
