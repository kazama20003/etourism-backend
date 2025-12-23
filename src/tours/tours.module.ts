import { Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { GoogleTranslationService } from './services/google-translation.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Tour, TourSchema } from './entities/tour.entity';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [
    // 👇 Aquí registras el modelo Tour para este módulo
    MongooseModule.forFeature([{ name: Tour.name, schema: TourSchema }]),
    // para HttpService en GoogleTranslationService
    HttpModule,
  ],
  controllers: [ToursController],
  providers: [ToursService, GoogleTranslationService],
  exports: [ToursService],
})
export class ToursModule {}
