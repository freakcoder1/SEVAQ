import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot } from './entities/slot.entity';

@Injectable()
export class SlotsService {
    constructor(
        @InjectRepository(Slot)
        private slotsRepository: Repository<Slot>,
    ) { }

    async findAll() {
        return this.slotsRepository.find({ relations: ['worker'] });
    }

    async findOne(id: string) {
        return this.slotsRepository.findOne({ where: { id }, relations: ['worker'] });
    }

    async findAvailableSlot(workerId: string, startTime: Date, endTime: Date): Promise<Slot | null> {
        return this.slotsRepository.findOne({
            where: {
                worker: { id: workerId },
                startTime,
                endTime,
                isBooked: false,
            },
        });
    }

    async findBookedSlot(workerId: string, startTime: Date, endTime: Date): Promise<Slot | null> {
        return this.slotsRepository.findOne({
            where: {
                worker: { id: workerId },
                startTime,
                endTime,
                isBooked: true,
            },
        });
    }

    async markAsAvailable(id: string): Promise<void> {
        await this.slotsRepository.update(id, { isBooked: false });
    }

    async markAsBooked(id: string): Promise<void> {
        await this.slotsRepository.update(id, { isBooked: true });
    }
}
