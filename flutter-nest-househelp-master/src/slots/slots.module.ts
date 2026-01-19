import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slot } from './entities/slot.entity';
import { Worker } from '../workers/entities/worker.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Slot, Worker])],
    controllers: [SlotsController],
    providers: [SlotsService],
    exports: [SlotsService],
})
export class SlotsModule { }
