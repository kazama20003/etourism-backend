import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import { TransportsService } from './transports.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import type { Lang } from 'src/common/constants/languages';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('transports')
export class TransportsController {
  constructor(private readonly transportsService: TransportsService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateTransportDto) {
    return this.transportsService.create(dto);
  }

  // FIND ALL (pagination + lang)
  @Get()
  findAll(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('lang') lang?: Lang,
  ) {
    // pagination validated as numbers
    const pagination: PaginationDto = {
      page: page ?? 1,
      limit: limit ?? 20,
    };

    return this.transportsService.findAll(lang, pagination);
  }

  // FIND ONE (with lang)
  @Get(':id')
  findOne(@Param('id') id: string, @Query('lang') lang?: Lang) {
    return this.transportsService.findOne(id, lang);
  }

  // UPDATE
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransportDto) {
    return this.transportsService.update(id, dto);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transportsService.remove(id);
  }
}
