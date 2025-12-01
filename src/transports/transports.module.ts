import { Module } from '@nestjs/common';
import { TransportsService } from './transports.service';
import { TransportsController } from './transports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transport, TransportSchema } from './entities/transport.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transport.name, schema: TransportSchema },
    ]),
  ],
  controllers: [TransportsController],
  providers: [TransportsService],
})
export class TransportsModule {}
