import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { SystemStatusModule } from '../system-status/system-status.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [SystemStatusModule, LocationsModule],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
