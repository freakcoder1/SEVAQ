import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceProfile } from './entities/service-profile.entity';
import { ServiceProfilesController } from './service-profiles.controller';
import { ServiceProfilesService } from './service-profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceProfile])],
  controllers: [ServiceProfilesController],
  providers: [ServiceProfilesService],
  exports: [ServiceProfilesService],
})
export class ServiceProfilesModule {}
