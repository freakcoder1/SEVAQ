import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigService } from './config.service';
import { SystemConfigController } from './config.controller';
import { NotificationTemplate } from './entities/notification-template.entity';
import { BusinessHours } from './entities/business-hours.entity';
import { PricingRule } from './entities/pricing-rule.entity';
import { ServiceArea } from '../locations/entities/service_area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, BusinessHours, PricingRule, ServiceArea]),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
