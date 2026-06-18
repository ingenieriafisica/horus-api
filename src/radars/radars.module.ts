import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RadarsService } from './radars.service';
import { RadarsController } from './radars.controller';
import { Radar, RadarSchema } from './entities/radar.schema';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Radar.name, schema: RadarSchema }]),
    CompaniesModule,
  ],
  controllers: [RadarsController],
  providers: [RadarsService],
  exports: [RadarsService],
})
export class RadarsModule {}
