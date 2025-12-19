import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Transport, TransportDocument } from './entities/transport.entity';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';

import type { Lang } from 'src/common/constants/languages';
import type { TransportPlain, RouteItemPlain } from './types/transports.types';
import { createSlug } from 'src/common/utils/slug.util';

@Injectable()
export class TransportsService {
  constructor(
    @InjectModel(Transport.name)
    private readonly transportModel: Model<TransportDocument>,
  ) {}

  private applyTranslation(
    base: string | undefined,
    translations: Partial<Record<Lang, string>> | undefined,
    lang?: Lang,
  ): string | undefined {
    if (!base) return base;
    if (!lang) return base;
    return translations?.[lang] ?? base;
  }

  private applyRouteItemTranslation(
    item: RouteItemPlain,
    lang?: Lang,
  ): RouteItemPlain {
    return {
      ...item,
      translations: undefined,
      name:
        this.applyTranslation(item.name, item.translations, lang) ?? item.name,
    };
  }

  private mapTransport(t: TransportDocument, lang?: Lang): TransportPlain {
    const obj = t.toObject() as TransportPlain;

    return {
      ...obj,
      titleTranslations: undefined,
      descriptionTranslations: undefined,
      routeDescriptionTranslations: undefined,

      title:
        this.applyTranslation(obj.title, obj.titleTranslations, lang) ??
        obj.title,

      description: this.applyTranslation(
        obj.description,
        obj.descriptionTranslations,
        lang,
      ),

      routeDescription: this.applyTranslation(
        obj.routeDescription,
        obj.routeDescriptionTranslations,
        lang,
      ),

      route: obj.route?.map((r) => this.applyRouteItemTranslation(r, lang)),
    };
  }

  // ------------------------------------------
  // CREATE (con generación automática del slug)
  // ------------------------------------------
  async create(dto: CreateTransportDto) {
    const slug = createSlug(dto.title);

    return this.transportModel.create({
      ...dto,
      slug,
    });
  }

  async findAll(
    lang?: Lang,
    pagination?: PaginationDto,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    items: TransportPlain[];
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    const skip = (page - 1) * limit;

    const total = await this.transportModel.countDocuments();

    const transports = await this.transportModel
      .find()
      .populate('vehicle')
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: transports.map((t) => this.mapTransport(t, lang)),
    };
  }

  async findOne(id: string, lang?: Lang): Promise<TransportPlain> {
    const transport = await this.transportModel
      .findById(id)
      .populate('vehicle')
      .exec();

    if (!transport) {
      throw new NotFoundException(`Transport with id "${id}" not found`);
    }

    return this.mapTransport(transport, lang);
  }

  // ----------------------------------------------------
  // UPDATE (si cambia el título, regeneramos el slug)
  // ----------------------------------------------------
  async update(id: string, dto: UpdateTransportDto) {
    let slugUpdate = {};

    if (dto.title) {
      slugUpdate = { slug: createSlug(dto.title) };
    }

    const updated = await this.transportModel
      .findByIdAndUpdate(id, { ...dto, ...slugUpdate }, { new: true })
      .populate('vehicle')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Transport with id "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.transportModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Transport with id "${id}" not found`);
    }

    return { message: 'Transport deleted successfully', id };
  }

  // ------------------------------------------
  // FIND BY SLUG (incluye traducciones)
  // ------------------------------------------
  async findBySlug(slug: string, lang?: Lang): Promise<TransportPlain> {
    const transport = await this.transportModel
      .findOne({ slug })
      .populate('vehicle')
      .exec();

    if (!transport) {
      throw new NotFoundException(`Transport with slug "${slug}" not found`);
    }

    return this.mapTransport(transport, lang);
  }
}
