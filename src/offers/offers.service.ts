import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Offer, OfferDocument } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
  ) {}

  // CREATE
  async create(createOfferDto: CreateOfferDto) {
    // Validar código único manualmente (opcional)
    const existing = await this.offerModel.findOne({
      code: createOfferDto.code.toUpperCase(),
    });

    if (existing) {
      throw new BadRequestException(
        `Offer code "${createOfferDto.code}" already exists`,
      );
    }

    // Forzar código a mayúsculas
    createOfferDto.code = createOfferDto.code.trim().toUpperCase();

    const offer = await this.offerModel.create(createOfferDto);
    return offer;
  }

  // FIND ALL (con paginación)
  async findAll(paginationDto: PaginationDto) {
    const { page = '1', limit = '10' } = paginationDto;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const skip = (pageNumber - 1) * limitNumber;

    const [offers, total] = await Promise.all([
      this.offerModel.find().skip(skip).limit(limitNumber),
      this.offerModel.countDocuments(),
    ]);

    return {
      page: pageNumber,
      limit: limitNumber,
      total,
      data: offers,
    };
  }

  // FIND ONE
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID');
    }

    const offer = await this.offerModel.findById(id);

    if (!offer) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }

    return offer;
  }

  // UPDATE
  async update(id: string, updateOfferDto: UpdateOfferDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID');
    }

    if (updateOfferDto.code) {
      updateOfferDto.code = updateOfferDto.code.trim().toUpperCase();
    }

    const updated = await this.offerModel.findByIdAndUpdate(
      id,
      updateOfferDto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID');
    }

    const deleted = await this.offerModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }

    return {
      message: 'Offer deleted successfully',
      offerId: id,
    };
  }

  // 🔥 Buscar oferta por código
  async findByCode(code: string) {
    const cleanCode = code.trim().toUpperCase();

    const now = new Date();

    const offer = await this.offerModel.findOne({
      code: cleanCode,
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null },
      ],
    });

    if (!offer) {
      throw new NotFoundException(`Offer code "${code}" is invalid or expired`);
    }

    return offer;
  }
}
