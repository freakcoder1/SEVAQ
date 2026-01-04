import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { SlotsService } from '../slots/slots.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        @InjectRepository(Worker)
        private workersRepository: Repository<Worker>,
        @InjectRepository(Service)
        private servicesRepository: Repository<Service>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private slotsService: SlotsService,
    ) { }

    async findBestWorker(serviceId: string, userLat: number, userLng: number, startTime: Date, endTime: Date) {
        // Find all workers who offer this service
        const workers = await this.workersRepository.find({
            where: { services: { id: serviceId } },
            relations: ['user', 'services']
        });

        if (workers.length === 0) {
            throw new BadRequestException('No workers available for this service');
        }

        // Score each worker
        const scoredWorkers = await Promise.all(workers.map(async (worker) => {
            const user = worker.user;
            if (!user.latitude || !user.longitude) return null;

            // Calculate distance (Haversine formula)
            const distance = this.calculateDistance(userLat, userLng, user.latitude, user.longitude);

            // Check availability
            const availableSlot = await this.slotsService.findAvailableSlot(worker.id, startTime, endTime);
            if (!availableSlot) return null;

            // Calculate score (lower is better)
            const distanceScore = distance * 0.4; // 40% weight
            const ratingScore = (5 - worker.rating) * 10 * 0.3; // 30% weight (invert rating)
            const reviewScore = (100 - Math.min(worker.reviewCount, 100)) * 0.3; // 30% weight

            const totalScore = distanceScore + ratingScore + reviewScore;

            return {
                worker,
                distance,
                score: totalScore,
                slot: availableSlot
            };
        }));

        // Filter out unavailable workers and sort by score
        const availableWorkers = scoredWorkers.filter(w => w !== null).sort((a, b) => a.score - b.score);

        if (availableWorkers.length === 0) {
            throw new BadRequestException('No workers available at the requested time');
        }

        return availableWorkers[0]; // Return best match
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the Earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    async create(createBookingDto: any) {
        let workerId = createBookingDto.worker;
        const { service: serviceId, user: userId, startTime, endTime } = createBookingDto;

        // If no worker specified, find the best match using AI
        if (!workerId && serviceId && userId && startTime && endTime) {
            const user = await this.usersRepository.findOne({ where: { id: userId } });
            if (!user || !user.latitude || !user.longitude) {
                throw new BadRequestException('User location not available for matching');
            }

            const bestMatch = await this.findBestWorker(serviceId, user.latitude, user.longitude, new Date(startTime), new Date(endTime));
            workerId = bestMatch.worker.id;

            // Book the slot
            await this.slotsService.markAsBooked(bestMatch.slot.id);
        } else if (workerId && startTime && endTime) {
            // Manual worker selection - check availability
            const slot = await this.slotsService.findAvailableSlot(workerId, new Date(startTime), new Date(endTime));
            if (!slot) {
                throw new BadRequestException('Slot not available for the selected time');
            }
            await this.slotsService.markAsBooked(slot.id);
        }

        const booking = this.bookingsRepository.create({ ...createBookingDto, worker: { id: workerId } });
        return this.bookingsRepository.save(booking);
    }

    async findAll(userId?: string, workerId?: string) {
        const where: any = {};
        if (userId) where.user = { id: userId };
        if (workerId) where.worker = { id: workerId };
        return this.bookingsRepository.find({ where, relations: ['user', 'worker', 'service'] });
    }

    findOne(id: string) {
        return this.bookingsRepository.findOne({ where: { id }, relations: ['user', 'worker', 'service'] });
    }

    async update(id: string, updateBookingDto: any) {
        const currentBooking = await this.findOne(id);
        if (!currentBooking) {
            throw new BadRequestException('Booking not found');
        }

        // Handle Cancellation
        if (updateBookingDto.status === 'cancelled' && currentBooking.status !== 'cancelled') {
            const slot = await this.slotsService.findBookedSlot(currentBooking.worker.id, currentBooking.startTime, currentBooking.endTime);
            if (slot) {
                await this.slotsService.markAsAvailable(slot.id);
            }
        }

        // Handle Reschedule
        if (updateBookingDto.startTime && updateBookingDto.endTime) {
            if (new Date(updateBookingDto.startTime).getTime() !== new Date(currentBooking.startTime).getTime()) {
                // Release old slot
                const oldSlot = await this.slotsService.findBookedSlot(currentBooking.worker.id, currentBooking.startTime, currentBooking.endTime);
                if (oldSlot) {
                    await this.slotsService.markAsAvailable(oldSlot.id);
                }

                // Check and book new slot
                const newSlot = await this.slotsService.findAvailableSlot(currentBooking.worker.id, new Date(updateBookingDto.startTime), new Date(updateBookingDto.endTime));
                if (!newSlot) {
                    throw new BadRequestException('New slot not available');
                }
                await this.slotsService.markAsBooked(newSlot.id);
            }
        }

        return this.bookingsRepository.update(id, updateBookingDto);
    }
}
