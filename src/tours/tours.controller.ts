// src/tours/tours.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';

import { IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { UpdateTourTranslationDto } from './dto/update-tour-translation.dto';

import { SUPPORTED_LANGS, Lang } from 'src/common/constants/languages';
import { PaginationDto } from 'src/common/dto/pagination.dto';

class AutoTranslateDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(SUPPORTED_LANGS, {
    each: true,
    message: `Cada idioma debe ser uno de: ${SUPPORTED_LANGS.join(', ')}`,
  })
  langs: Lang[];
}

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  create(@Body() dto: CreateTourDto) {
    return this.toursService.create(dto);
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('lang') lang: string = 'es',
    @Query('email') email?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ?? 1,
      limit: limit ?? 20,
    };

    const safeLang: Lang = SUPPORTED_LANGS.includes(lang as Lang)
      ? (lang as Lang)
      : 'es';

    return this.toursService.findAll(pagination, safeLang, email);
  }

  @Get('popular')
  getPopularTours(@Query('lang') lang?: string) {
    const safeLang: Lang | undefined =
      lang && SUPPORTED_LANGS.includes(lang as Lang)
        ? (lang as Lang)
        : undefined;

    return this.toursService.findPopularTours(safeLang);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    const safeLang: Lang | undefined =
      lang && SUPPORTED_LANGS.includes(lang as Lang)
        ? (lang as Lang)
        : undefined;

    return this.toursService.findOne(id, safeLang);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTourDto) {
    return this.toursService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }

  @Post(':id/auto-translate')
  autoTranslate(@Param('id') id: string, @Body() body: AutoTranslateDto) {
    return this.toursService.autoTranslate(id, body.langs);
  }

  @Patch(':id/translation/:lang')
  updateTranslation(
    @Param('id') id: string,
    @Param('lang') lang: string,
    @Body() body: UpdateTourTranslationDto,
  ) {
    const safeLang = SUPPORTED_LANGS.includes(lang as Lang)
      ? (lang as Lang)
      : undefined;

    if (!safeLang) {
      throw new BadRequestException(
        `Idioma no soportado. Usa uno de: ${SUPPORTED_LANGS.join(', ')}`,
      );
    }

    return this.toursService.updateTranslation(id, safeLang, body);
  }
}
