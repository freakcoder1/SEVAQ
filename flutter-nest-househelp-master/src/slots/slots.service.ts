import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Slot } from './entities/slot.entity';
import { Worker } from '../workers/entities/worker.entity';

@Injectable()
export class SlotsService {
    private readonly logger = new Logger(SlotsService.name);

    constructor(
        @InjectRepository(Slot)
        private slotsRepository: Repository<Slot>,
        @InjectRepository(Worker)
        private workersRepository: Repository<Worker>,
    ) { }

    async findAll() {
        return this.slotsRepository.find({ relations: ['worker'] });
    }

    async findOne(id: number) {
        return this.slotsRepository.findOne({ where: { id }, relations: ['worker'] });
    }

    async findAvailableSlot(workerId: number, startTime: Date, endTime: Date): Promise<Slot | null> {
        this.logger.log(`Finding available slot for workerId: ${workerId} (type: ${typeof workerId})`);
        return this.slotsRepository.findOne({
            where: {
                worker: { id: workerId },
                startTime,
                endTime,
                isBooked: false,
            },
        });
    }

    async findBookedSlot(workerId: number, startTime: Date, endTime: Date): Promise<Slot | null> {
        return this.slotsRepository.findOne({
            where: {
                worker: { id: workerId },
                startTime,
                endTime,
                isBooked: true,
            },
        });
    }

    /**
     * Find available slot with flexible time matching
     * This method allows for flexible time matching to improve worker availability
     */
    async findAvailableSlotFlexible(workerId: number, requestedStartTime: Date, requestedEndTime: Date): Promise<Slot | null> {
        this.logger.log(`Finding flexible slot for worker ${workerId} from ${requestedStartTime} to ${requestedEndTime}`);

        try {
            // 1. First try exact match
            const exactMatch = await this.findAvailableSlot(workerId, requestedStartTime, requestedEndTime);
            if (exactMatch) {
                this.logger.log(`Found exact match for worker ${workerId}`);
                return exactMatch;
            }

            // 2. Try to find slots with flexible time matching
            // Allow up to 30 minutes flexibility in start time
            const flexibilityMinutes = 30;
            const startTimeWindow = {
                start: new Date(requestedStartTime.getTime() - flexibilityMinutes * 60000),
                end: new Date(requestedStartTime.getTime() + flexibilityMinutes * 60000)
            };

            // Find available slots within the time window
            const flexibleSlots = await this.slotsRepository.find({
                where: {
                    worker: { id: workerId },
                    startTime: Between(startTimeWindow.start, startTimeWindow.end),
                    isBooked: false,
                },
                order: {
                    startTime: 'ASC'
                }
            });

            if (flexibleSlots.length > 0) {
                this.logger.log(`Found ${flexibleSlots.length} flexible slots for worker ${workerId}`);
                return flexibleSlots[0]; // Return the earliest available slot
            }

            // 3. Try to find any available slot for the worker on the same day
            const requestedDate = new Date(requestedStartTime.getFullYear(), requestedStartTime.getMonth(), requestedStartTime.getDate());
            const nextDay = new Date(requestedDate);
            nextDay.setDate(requestedDate.getDate() + 1);

            const sameDaySlots = await this.slotsRepository.find({
                where: {
                    worker: { id: workerId },
                    startTime: Between(requestedDate, nextDay),
                    isBooked: false,
                },
                order: {
                    startTime: 'ASC'
                }
            });

            if (sameDaySlots.length > 0) {
                this.logger.log(`Found ${sameDaySlots.length} same-day slots for worker ${workerId}`);
                return sameDaySlots[0];
            }

            this.logger.log(`No flexible slots found for worker ${workerId}`);
            return null;

        } catch (error) {
            this.logger.error(`Error finding flexible slot for worker ${workerId}:`, error);
            throw error;
        }
    }

    /**
     * Enhanced slot creation with better availability management
     */
    async createSlotsForWorker(workerId: number, date: Date, timeSlots: Array<{ startTime: Date, endTime: Date }>): Promise<Slot[]> {
        this.logger.log(`Creating ${timeSlots.length} slots for worker ${workerId} on ${date}`);

        try {
            // Validate worker exists
            const worker = await this.workersRepository.findOne({ where: { id: workerId } });
            if (!worker) {
                throw new Error(`Worker with ID ${workerId} not found`);
            }

            // Check for existing slots on the same date to avoid duplicates
            const existingSlots = await this.slotsRepository.find({
                where: {
                    worker: { id: workerId },
                    startTime: Between(
                        new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                        new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                    )
                }
            });

            if (existingSlots.length > 0) {
                this.logger.warn(`Worker ${workerId} already has ${existingSlots.length} slots for ${date}. Skipping slot creation.`);
                return existingSlots;
            }

            // Create new slots
            const slotsToCreate = timeSlots.map(slotData => {
                const slot = new Slot();
                slot.worker = worker;
                slot.date = date;
                slot.startTime = slotData.startTime;
                slot.endTime = slotData.endTime;
                slot.isBooked = false;
                slot.maxBookings = 1;
                slot.currentBookings = 0;
                return slot;
            });

            const createdSlots = await this.slotsRepository.save(slotsToCreate);
            this.logger.log(`Successfully created ${createdSlots.length} slots for worker ${workerId}`);
            
            return createdSlots;

        } catch (error) {
            this.logger.error(`Error creating slots for worker ${workerId}:`, error);
            throw error;
        }
    }

    /**
     * Bulk create slots for multiple workers
     */
    async createSlotsForMultipleWorkers(workerSlots: Array<{
        workerId: number,
        date: Date,
        timeSlots: Array<{ startTime: Date, endTime: Date }>
    }>): Promise<void> {
        this.logger.log(`Creating slots for ${workerSlots.length} workers`);

        try {
            const promises = workerSlots.map(async (workerSlot) => {
                await this.createSlotsForWorker(workerSlot.workerId, workerSlot.date, workerSlot.timeSlots);
            });

            await Promise.all(promises);
            this.logger.log(`Successfully created slots for all workers`);

        } catch (error) {
            this.logger.error('Error creating slots for multiple workers:', error);
            throw error;
        }
    }

    /**
     * Get available slots for a worker within a date range
     */
    async getAvailableSlotsForWorker(workerId: number, startDate: Date, endDate: Date): Promise<Slot[]> {
        return this.slotsRepository.find({
            where: {
                worker: { id: workerId },
                startTime: Between(startDate, endDate),
                isBooked: false,
            },
            order: {
                startTime: 'ASC'
            }
        });
    }

    /**
     * Get booking statistics for a worker
     */
    async getWorkerSlotStats(workerId: number): Promise<{
        totalSlots: number;
        availableSlots: number;
        bookedSlots: number;
        bookingRate: number;
    }> {
        const totalSlots = await this.slotsRepository.count({
            where: { worker: { id: workerId } }
        });

        const availableSlots = await this.slotsRepository.count({
            where: {
                worker: { id: workerId },
                isBooked: false
            }
        });

        const bookedSlots = totalSlots - availableSlots;
        const bookingRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

        return {
            totalSlots,
            availableSlots,
            bookedSlots,
            bookingRate
        };
    }

    async markAsAvailable(id: number): Promise<void> {
        await this.slotsRepository.update(id, { isBooked: false });
    }

    async markAsBooked(id: number): Promise<void> {
        await this.slotsRepository.update(id, { isBooked: true });
    }

    /**
     * Enhanced slot booking with validation
     */
    async bookSlot(slotId: number): Promise<boolean> {
        try {
            const slot = await this.slotsRepository.findOne({ where: { id: slotId } });
            
            if (!slot) {
                this.logger.warn(`Slot ${slotId} not found`);
                return false;
            }

            if (slot.isBooked) {
                this.logger.warn(`Slot ${slotId} is already booked`);
                return false;
            }

            await this.slotsRepository.update(slotId, { isBooked: true });
            this.logger.log(`Successfully booked slot ${slotId}`);
            return true;

        } catch (error) {
            this.logger.error(`Error booking slot ${slotId}:`, error);
            return false;
        }
    }

    /**
     * Enhanced slot unbooking with validation
     */
    async unbookSlot(slotId: number): Promise<boolean> {
        try {
            const slot = await this.slotsRepository.findOne({ where: { id: slotId } });
            
            if (!slot) {
                this.logger.warn(`Slot ${slotId} not found`);
                return false;
            }

            if (!slot.isBooked) {
                this.logger.warn(`Slot ${slotId} is not booked`);
                return false;
            }

            await this.slotsRepository.update(slotId, { isBooked: false });
            this.logger.log(`Successfully unbooked slot ${slotId}`);
            return true;

        } catch (error) {
            this.logger.error(`Error unbooking slot ${slotId}:`, error);
            return false;
        }
    }
}
