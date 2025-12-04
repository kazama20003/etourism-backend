// src/tours/tours.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';

import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour, TourDocument } from './entities/tour.entity';
import {
  GoogleTranslationService,
  TourTranslationPayload,
} from './services/google-translation.service';
import { UpdateTourTranslationDto } from './dto/update-tour-translation.dto';
import { Lang } from 'src/common/constants/languages';

type TourTranslation = Tour['translations'][number];

@Injectable()
export class ToursService {
  constructor(
    @InjectModel(Tour.name)
    private readonly tourModel: Model<TourDocument>,
    private readonly googleTranslationService: GoogleTranslationService,
  ) {}

  // 🚀 Crear tour (base en 🇪🇸)
  async create(createTourDto: CreateTourDto): Promise<Tour> {
    try {
      const createdTour = new this.tourModel(createTourDto);
      const saved = await createdTour.save();
      return saved.toObject() as unknown as Tour;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new BadRequestException(
          'Ya existe un tour con el mismo título o slug',
        );
      }

      throw error;
    }
  }

  async findAll(
    pagination: { page?: string; limit?: string },
    lang?: string,
    email?: string,
  ): Promise<{
    data: Tour[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = pagination.page ? parseInt(pagination.page, 10) : 1;
    const limit = pagination.limit ? parseInt(pagination.limit, 10) : 10;
    const skip = (page - 1) * limit;

    // 🆕 Filtro dinámico
    const filter: Record<string, unknown> = {};

    if (email) {
      filter.createdByEmail = email; // 👈 ajusta si tu esquema usa otro nombre
    }

    const [tours, total] = await Promise.all([
      this.tourModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('vehicleIds')
        .exec(),

      this.tourModel.countDocuments(filter).exec(),
    ]);

    return {
      data: tours.map((tour) => this.mergeTourWithLang(tour, lang)),
      total,
      page,
      limit,
    };
  }

  // 🔎 Obtener un tour por ID (opcional: con lang ya mergeado)
  async findOne(id: string, lang?: string): Promise<Tour> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de tour inválido');
    }

    const tour = await this.tourModel
      .findById(id)
      .populate('vehicleIds')
      .exec();

    if (!tour) {
      throw new NotFoundException(`Tour con id "${id}" no encontrado`);
    }

    return this.mergeTourWithLang(tour, lang);
  }

  // ✏️ Actualizar un tour (base ES)
  async update(id: string, updateTourDto: UpdateTourDto): Promise<Tour> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de tour inválido');
    }

    const updated = await this.tourModel
      .findByIdAndUpdate(id, updateTourDto, {
        new: true,
        runValidators: true,
      })
      .populate('vehicleIds')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Tour con id "${id}" no encontrado`);
    }

    return updated.toObject() as unknown as Tour;
  }

  // 🗑 Eliminar un tour (delete físico)
  async remove(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de tour inválido');
    }

    const result = await this.tourModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Tour con id "${id}" no encontrado`);
    }
  }

  // (Opcional) Soft delete
  async deactivate(id: string): Promise<Tour> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de tour inválido');
    }

    const updated = await this.tourModel
      .findByIdAndUpdate(
        id,
        { isActive: false, isBookable: false },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Tour con id "${id}" no encontrado`);
    }

    return updated.toObject() as unknown as Tour;
  }

  // 🌍 Auto-traducir un tour a uno o varios idiomas y guardar en `translations`
  async autoTranslate(id: string, targetLangs: Lang[]): Promise<Tour> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de tour inválido');
    }

    const tour = await this.tourModel.findById(id).exec();
    if (!tour) {
      throw new NotFoundException(`Tour con id "${id}" no encontrado`);
    }

    // base ES como objeto plano (tipado)
    const base = tour.toObject() as unknown as Tour;

    // Aseguramos arrays
    if (!tour.translations) {
      tour.translations = [];
    }
    if (!tour.languages || tour.languages.length === 0) {
      tour.languages = ['es'];
    }

    for (const lang of targetLangs) {
      if (!lang || lang === 'es') continue;

      // Siempre recalculamos la traducción para ese idioma
      const translated: TourTranslationPayload =
        await this.googleTranslationService.translateTourBase(base, lang);

      const newTranslation: TourTranslation = {
        lang,
        title: translated.title,
        description: translated.description,
        slug: translated.slug,
        meetingPoint: translated.meetingPoint,
        metaDescription: translated.metaDescription,
        includes: translated.includes,
        excludes: translated.excludes,
        categories: translated.categories,
        itinerary: translated.itinerary,
      };

      // 🔁 Si ya existe traducción en ese idioma, la REEMPLAZAMOS
      const existingIndex = tour.translations.findIndex((t) => t.lang === lang);

      if (existingIndex !== -1) {
        tour.translations[existingIndex] = newTranslation;
      } else {
        tour.translations.push(newTranslation);
      }

      // Actualizamos lista de idiomas soportados
      if (!tour.languages.includes(lang)) {
        tour.languages.push(lang);
      }
    }

    const saved = await tour.save();
    return saved.toObject() as unknown as Tour;
  }

  // 🔁 Helper: mezcla base 🇪🇸 + traducción (si existe) según `lang`
  private mergeTourWithLang(tour: TourDocument, lang?: string): Tour {
    // 💡 convertimos el documento de Mongoose a objeto plano
    const base = tour.toObject() as unknown as Tour;

    if (!lang || lang === 'es') {
      return base;
    }

    const translations = base.translations ?? [];
    const t = translations.find((tr) => tr.lang === lang);

    if (!t) {
      return base;
    }

    const mergedItinerary =
      base.itinerary?.map((item) => {
        const translatedItem = t.itinerary?.find((i) => i.order === item.order);
        return {
          ...item,
          title: translatedItem?.title ?? item.title,
          description: translatedItem?.description ?? item.description,
        };
      }) ?? base.itinerary;

    return {
      ...base,
      title: t.title ?? base.title,
      description: t.description ?? base.description,
      slug: t.slug ?? base.slug,
      meetingPoint: t.meetingPoint ?? base.meetingPoint,
      metaDescription: t.metaDescription ?? base.metaDescription,
      includes: t.includes ?? base.includes,
      excludes: t.excludes ?? base.excludes,
      categories: t.categories ?? base.categories,
      itinerary: mergedItinerary,
    };
  }

  // ✏️ Editar / corregir una traducción específica (it, de, en, etc.)
  async updateTranslation(
    id: string,
    lang: Lang,
    dto: UpdateTourTranslationDto,
  ): Promise<Tour> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de tour inválido');
    }

    const tour = await this.tourModel.findById(id).exec();
    if (!tour) {
      throw new NotFoundException(`Tour con id "${id}" no encontrado`);
    }

    // Nos aseguramos de tener el array de traducciones
    if (!tour.translations) {
      tour.translations = [];
    }

    const translations = tour.translations;

    // Buscamos la traducción para ese idioma por índice
    let translationIndex = translations.findIndex((t) => t.lang === lang);
    let translation: TourTranslation;

    if (translationIndex === -1) {
      // No existía: la creamos
      translation = { lang };
      translations.push(translation);
      translationIndex = translations.length - 1;
    } else {
      translation = translations[translationIndex];
    }

    // Campos simples (si vienen en dto, los aplicamos)
    if (dto.title !== undefined) translation.title = dto.title;
    if (dto.description !== undefined)
      translation.description = dto.description;
    if (dto.slug !== undefined) translation.slug = dto.slug;
    if (dto.meetingPoint !== undefined)
      translation.meetingPoint = dto.meetingPoint;
    if (dto.metaDescription !== undefined) {
      translation.metaDescription = dto.metaDescription;
    }

    // Arrays: si los envías, reemplazan completos
    if (dto.includes !== undefined) translation.includes = dto.includes;
    if (dto.excludes !== undefined) translation.excludes = dto.excludes;
    if (dto.categories !== undefined) translation.categories = dto.categories;

    // Itinerario traducido: merge por "order"
    if (dto.itinerary && dto.itinerary.length > 0) {
      if (!translation.itinerary) {
        translation.itinerary = [];
      }

      for (const itemUpdate of dto.itinerary) {
        const idx = translation.itinerary.findIndex(
          (it) => it.order === itemUpdate.order,
        );

        if (idx === -1) {
          // no existía este "order": lo creamos
          translation.itinerary.push({
            order: itemUpdate.order,
            title: itemUpdate.title ?? '',
            description: itemUpdate.description ?? '',
          });
        } else {
          // ya existe: actualizamos solo lo que viene
          const current = translation.itinerary[idx];
          if (itemUpdate.title !== undefined) {
            current.title = itemUpdate.title;
          }
          if (itemUpdate.description !== undefined) {
            current.description = itemUpdate.description;
          }
        }
      }
    }

    // Guardamos
    const saved = await tour.save();

    // Devolvemos el tour ya "mergeado" en ese idioma
    return this.mergeTourWithLang(saved as TourDocument, lang);
  }
  // src/tours/tours.service.ts

  async findPopularTours(lang?: string): Promise<Tour[]> {
    const tours = await this.tourModel
      .find({ isPopular: true, isActive: true })
      .limit(4)
      .populate('vehicleIds')
      .exec();

    return tours.map((tour) => this.mergeTourWithLang(tour, lang));
  }
}
