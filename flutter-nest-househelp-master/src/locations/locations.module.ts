import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationService } from './locations.service';
import { MicroZone } from './entities/micro_zone.entity';
import { ServiceArea } from './entities/service_area.entity';
import { Waitlist } from './entities/waitlist.entity';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MicroZone, ServiceArea, Waitlist, Worker, User]),
    AuthModule,
  ],
  controllers: [LocationsController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationsModule {}
