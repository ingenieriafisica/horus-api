import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './entities/company.schema';
import { Radar, RadarSchema } from '../radars/entities/radar.schema';
import { Count, CountSchema } from '../counts/entities/count.schema';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Radar.name,   schema: RadarSchema },
      { name: Count.name,   schema: CountSchema },
    ]),
  ],
  providers:   [CompaniesService],
  controllers: [CompaniesController],
  exports:     [CompaniesService],
})
export class CompaniesModule {}
