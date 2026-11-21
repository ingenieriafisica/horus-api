import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertRule, AlertRuleSchema } from './entities/alert-rule.schema';
import { AlertEvent, AlertEventSchema } from './entities/alert-event.schema';
import { Radar, RadarSchema } from '../radars/entities/radar.schema';
import { Count, CountSchema } from '../counts/entities/count.schema';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: AlertRule.name,  schema: AlertRuleSchema },
      { name: AlertEvent.name, schema: AlertEventSchema },
      { name: Radar.name,      schema: RadarSchema },
      { name: Count.name,      schema: CountSchema },
    ]),
  ],
  controllers: [AlertsController],
  providers:   [AlertsService],
  exports:     [AlertsService],
})
export class AlertsModule {}
