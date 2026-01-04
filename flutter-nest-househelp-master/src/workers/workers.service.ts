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

    async create(userId: string, bio: string, serviceIds: string[]) {
        const worker = this.workersRepository.create({
            user: { id: userId } as any,
            bio,
            services: serviceIds.map(id => ({ id }) as any),
        });
        return this.workersRepository.save(worker);
    }

    async findOne(id: string) {
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
}
