import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { WorkersModule } from '../workers/workers.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { SlotsModule } from '../slots/slots.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    WorkersModule,
    ServicesModule,
    UsersModule,
    SlotsModule,
    TypeOrmModule.forFeature([Worker, Service, User]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}