import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigService } from './config.service';
import { SystemConfigController } from './config.controller';
import { NotificationTemplate } from './entities/notification-template.entity';
import { BusinessHours } from './entities/business-hours.entity';
import { ServiceArea } from './entities/service-area.entity';
import { PricingRule } from './entities/pricing-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, BusinessHours, ServiceArea, PricingRule]),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
