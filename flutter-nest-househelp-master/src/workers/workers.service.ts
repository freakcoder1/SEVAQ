import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from './entities/worker.entity';

@Injectable()
export class WorkersService {
    constructor(
        @InjectRepository(Worker)
        private workersRepository: Repository<Worker>,
    ) { }

    async findAll() {
        return this.workersRepository.find({ relations: ['user', 'services'] });
    }

    async create(userId: number, bio: string, serviceIds: number[], latitude: number, longitude: number) {
        const worker = this.workersRepository.create({
            user: { id: userId },
            bio,
            services: serviceIds.map((id) => ({ id })),
            latitude,
            longitude,
            currentLat: latitude,
            currentLng: longitude,
            isAvailable: true,
        });
        return this.workersRepository.save(worker);
    }

    async findOne(id: number) {
        return this.workersRepository.findOne({ where: { id }, relations: ['user', 'services'] });
    }

    async search(lat: number, long: number, radius: number) {
        return this.workersRepository.createQueryBuilder('worker')
            .leftJoinAndSelect('worker.user', 'user')
            .leftJoinAndSelect('worker.services', 'services')
            .where(`(
                6371 * acos(
                    cos(radians(:lat)) * cos(radians(user.latitude)) * cos(radians(user.longitude) - radians(:long)) +
                    sin(radians(:lat)) * sin(radians(user.latitude))
                )
            ) <= :radius`, { lat, long, radius })
            .getMany();
    }

    async updateRating(id: string, rating: number, reviewCount: number) {
        await this.workersRepository.update(id, { rating, reviewCount });
    }

    async findByService(serviceId: string) {
        // Map frontend service IDs to actual UUID service IDs
        const serviceIdMap: Record<string, string> = {
            'maid': '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Home Cleaning
            'cleaning': '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Home Cleaning
            'cooking': '7f8e4b5c-a883-4c6c-b348-f966508fd49d', // Cooking
        };

        const actualServiceId = serviceIdMap[serviceId] || serviceId;
        
        return this.workersRepository.createQueryBuilder('worker')
            .leftJoinAndSelect('worker.user', 'user')
            .leftJoinAndSelect('worker.services', 'services')
            .where('services.id = :serviceId', { serviceId: actualServiceId })
            .getMany();
    }

    async updateExistingWorkersWithDefaultLocation() {
        // Set default location for existing workers without location data
        await this.workersRepository
            .createQueryBuilder()
            .update(Worker)
            .set({
                latitude: 28.5804579,
                longitude: 77.4392951,
                currentLat: 28.5804579,
                currentLng: 77.4392951
            })
            .where("latitude IS NULL OR longitude IS NULL")
            .execute();
    }

    async updateWorkerAvailability(id: number, isAvailable: boolean) {
        const worker = await this.workersRepository.findOne({ where: { id } });
        if (!worker) {
            throw new Error('Worker not found');
        }

        // Validate location data before allowing worker to be marked as available
        if (isAvailable && (!worker.latitude || !worker.longitude)) {
            throw new Error('Cannot mark worker as available without location data');
        }

        await this.workersRepository.update(id, { isAvailable });
        return this.workersRepository.findOne({ where: { id } });
    }
}
