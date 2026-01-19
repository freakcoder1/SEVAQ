import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ServiceRequest } from './entities/service-request.entity';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { AssignmentWorker } from './assignment.worker';
import { AssignmentProcessor } from './assignment.processor';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest, Worker, Service, User]),
    BullModule.registerQueue({
      name: 'assignment',
    }),
    SlotsModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, AssignmentWorker, AssignmentProcessor],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}