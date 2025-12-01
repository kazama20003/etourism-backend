import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Transport, TransportDocument } from './entities/transport.entity';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';

@Injectable()
export class TransportsService {
  constructor(
    @InjectModel(Transport.name)
    private readonly transportModel: Model<TransportDocument>,
  ) {}

  // 🚀 Crear transporte
  async create(createTransportDto: CreateTransportDto) {
    const transport = await this.transportModel.create(createTransportDto);
    return transport;
  }

  // 📄 Listar todos (con populate del vehículo)
  async findAll() {
    return this.transportModel
      .find()
      .populate('vehicle') // Populate del vehículo
      .exec();
  }

  // 🔍 Buscar por ID
  async findOne(id: string) {
    const transport = await this.transportModel
      .findById(id)
      .populate('vehicle')
      .exec();

    if (!transport) {
      throw new NotFoundException(`Transport with id "${id}" not found`);
    }

    return transport;
  }

  // ✏️ Actualizar
  async update(id: string, updateTransportDto: UpdateTransportDto) {
    const updated = await this.transportModel
      .findByIdAndUpdate(id, updateTransportDto, { new: true })
      .populate('vehicle')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Transport with id "${id}" not found`);
    }

    return updated;
  }

  // 🗑️ Eliminar
  async remove(id: string) {
    const deleted = await this.transportModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Transport with id "${id}" not found`);
    }

    return {
      message: 'Transport deleted successfully',
      id,
    };
  }
}
