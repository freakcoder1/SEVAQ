import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slot } from './entities/slot.entity';
import { Worker } from '../workers/entities/worker.entity';
import { DailySlotGenerationScheduler } from './daily-slot-generation.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Slot, Worker])],
  controllers: [SlotsController],
  providers: [SlotsService, DailySlotGenerationScheduler],
  exports: [SlotsService],
})
export class SlotsModule {}
